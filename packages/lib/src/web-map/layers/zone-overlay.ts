import type { Layer, LatLng, RenderState } from "../types";

/**
 * GPU-based zone overlay: loads ONE grayscale bitmap, colorizes zones via a
 * palette texture. Toggling zones = updating a 256×1 palette → instant.
 */
export class ZoneOverlayLayer implements Layer {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private bitmapTexture: WebGLTexture | null = null;
  private paletteTexture: WebGLTexture | null = null;
  private uniformLocations: {
    view?: WebGLUniformLocation | null;
    bitmap?: WebGLUniformLocation | null;
    palette?: WebGLUniformLocation | null;
  } = {};

  private bounds: [[number, number], [number, number]];
  private imageUrl: string;
  private imageLoaded = false;
  private _dirty = false;
  private lastQuadZoom = -1;
  // CPU-side bitmap data for pixel sampling (zone hover tooltips)
  private bitmapData: Uint8Array | null = null;
  private bitmapWidth = 0;
  private bitmapHeight = 0;
  // Pre-allocated buffers to avoid per-frame allocations
  private quadVertices = new Float32Array(12);
  private quadTexCoords = new Float32Array([
    0, 1, 1, 1, 0, 0,
    1, 1, 1, 0, 0, 0,
  ]);
  // 256 entries × 4 channels (RGBA), index = pixel value
  private palette = new Uint8Array(256 * 4);

  constructor(opts: {
    url: string;
    bounds: [[number, number], [number, number]];
  }) {
    this.imageUrl = opts.url;
    this.bounds = opts.bounds;
  }

  /** Set a zone's color. value = grayscale pixel value (0-255). */
  setZone(value: number, r: number, g: number, b: number, a: number): void {
    const off = value * 4;
    this.palette[off] = r;
    this.palette[off + 1] = g;
    this.palette[off + 2] = b;
    this.palette[off + 3] = a;
    this.uploadPalette();
  }

  /** Clear a zone (make transparent). */
  clearZone(value: number): void {
    this.setZone(value, 0, 0, 0, 0);
  }

  /** Set multiple zones at once. */
  setZones(entries: { value: number; color: [number, number, number, number] }[]): void {
    for (const { value, color } of entries) {
      const off = value * 4;
      this.palette[off] = color[0];
      this.palette[off + 1] = color[1];
      this.palette[off + 2] = color[2];
      this.palette[off + 3] = color[3];
    }
    this.uploadPalette();
  }

  /** Clear all zones. */
  clearAll(): void {
    this.palette.fill(0);
    this.uploadPalette();
  }

  /**
   * Sample the bitmap value at a map coordinate.
   * Returns the zone pixel value (0-255) or -1 if outside bounds / not loaded.
   */
  sampleAt(latlng: [number, number]): number {
    if (!this.bitmapData) return -1;
    const [[minLat, minLng], [maxLat, maxLng]] = this.bounds;
    const [lat, lng] = latlng;
    if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) return -1;

    // Normalize to 0-1 within bounds
    const u = (lng - minLng) / (maxLng - minLng);
    const v = 1 - (lat - minLat) / (maxLat - minLat); // flip Y (image top = maxLat)

    const px = Math.floor(u * this.bitmapWidth);
    const py = Math.floor(v * this.bitmapHeight);
    if (px < 0 || px >= this.bitmapWidth || py < 0 || py >= this.bitmapHeight) return -1;

    return this.bitmapData[py * this.bitmapWidth + px];
  }

  isDirty(): boolean {
    const d = this._dirty;
    this._dirty = false;
    return d;
  }

  onAdd(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.createShaders();
    this.createBuffers();
    this.setupVAO();
    this.createPaletteTexture();
    this.loadBitmap();
  }

  onRemove(): void {
    this.destroy();
  }

  private createShaders(): void {
    if (!this.gl) return;

    const vs = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      uniform mat3 u_view;
      out vec2 v_texCoord;
      void main() {
        vec3 pos = u_view * vec3(a_position, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fs = `#version 300 es
      precision mediump float;
      in vec2 v_texCoord;
      uniform sampler2D u_bitmap;
      uniform sampler2D u_palette;
      out vec4 outColor;
      void main() {
        // Sample grayscale bitmap — value is in the red channel (0.0-1.0)
        float zoneValue = texture(u_bitmap, v_texCoord).r;
        // Convert to texel index and sample palette at exact texel center
        float paletteU = (zoneValue * 255.0 + 0.5) / 256.0;
        vec4 zoneColor = texture(u_palette, vec2(paletteU, 0.5));
        outColor = zoneColor;
      }
    `;

    this.program = this.createProgram(vs, fs);
    if (this.program) {
      this.uniformLocations.view = this.gl.getUniformLocation(this.program, "u_view");
      this.uniformLocations.bitmap = this.gl.getUniformLocation(this.program, "u_bitmap");
      this.uniformLocations.palette = this.gl.getUniformLocation(this.program, "u_palette");
    }
  }

  private createBuffers(): void {
    if (!this.gl) return;
    this.vertexBuffer = this.gl.createBuffer();
    this.texCoordBuffer = this.gl.createBuffer();
  }

  private setupVAO(): void {
    if (!this.gl || !this.program) return;
    this.vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vao);

    const posLoc = this.gl.getAttribLocation(this.program, "a_position");
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.enableVertexAttribArray(posLoc);
    this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 0, 0);

    const texLoc = this.gl.getAttribLocation(this.program, "a_texCoord");
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    // Upload static texCoords once
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.quadTexCoords, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(texLoc);
    this.gl.vertexAttribPointer(texLoc, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.bindVertexArray(null);
  }

  private createPaletteTexture(): void {
    if (!this.gl) return;
    this.paletteTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.paletteTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA,
      256, 1, 0,
      this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.palette,
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
  }

  private uploadPalette(): void {
    if (!this.gl || !this.paletteTexture) return;
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.paletteTexture);
    this.gl.texSubImage2D(
      this.gl.TEXTURE_2D, 0, 0, 0,
      256, 1,
      this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.palette,
    );
    this._dirty = true;
  }

  private loadBitmap(): void {
    if (!this.gl) return;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (!this.gl) return;
      this.bitmapTexture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.bitmapTexture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D, 0, this.gl.R8,
        this.gl.RED, this.gl.UNSIGNED_BYTE, image,
      );
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.imageLoaded = true;
      this._dirty = true;

      // Extract pixel data to CPU for hover sampling
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(image, 0, 0);
        const imgData = ctx.getImageData(0, 0, image.width, image.height);
        // Extract red channel only (grayscale bitmap)
        this.bitmapData = new Uint8Array(image.width * image.height);
        for (let i = 0; i < this.bitmapData.length; i++) {
          this.bitmapData[i] = imgData.data[i * 4]; // red channel
        }
        this.bitmapWidth = image.width;
        this.bitmapHeight = image.height;
      }
    };
    image.src = this.imageUrl;
  }

  private buildQuad(projection: (latlng: LatLng) => { x: number; y: number }): void {
    if (!this.gl) return;
    const [[minLat, minLng], [maxLat, maxLng]] = this.bounds;
    const bl = projection([minLat, minLng]);
    const br = projection([minLat, maxLng]);
    const tl = projection([maxLat, minLng]);
    const tr = projection([maxLat, maxLng]);

    // Reuse pre-allocated buffer
    const v = this.quadVertices;
    v[0] = bl.x; v[1] = bl.y; v[2] = br.x; v[3] = br.y; v[4] = tl.x; v[5] = tl.y;
    v[6] = br.x; v[7] = br.y; v[8] = tr.x; v[9] = tr.y; v[10] = tl.x; v[11] = tl.y;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, v, this.gl.DYNAMIC_DRAW);
  }

  private createProgram(vs: string, fs: string): WebGLProgram | null {
    if (!this.gl) return null;
    const vShader = this.gl.createShader(this.gl.VERTEX_SHADER)!;
    this.gl.shaderSource(vShader, vs);
    this.gl.compileShader(vShader);
    const fShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)!;
    this.gl.shaderSource(fShader, fs);
    this.gl.compileShader(fShader);
    const prog = this.gl.createProgram()!;
    this.gl.attachShader(prog, vShader);
    this.gl.attachShader(prog, fShader);
    this.gl.linkProgram(prog);
    this.gl.deleteShader(vShader);
    this.gl.deleteShader(fShader);
    return prog;
  }

  render(gl: WebGL2RenderingContext, state: RenderState): void {
    if (!state.viewMatrix || !this.imageLoaded || !this.bitmapTexture || !this.paletteTexture) return;

    // Rebuild quad only when zoom changes (projection depends on zoom)
    if (this.lastQuadZoom !== state.zoom) {
      this.buildQuad(state.projection);
      this.lastQuadZoom = state.zoom;
    }

    if (!this.program || !this.vao) return;

    // Save state
    const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM);
    const prevBlend = gl.isEnabled(gl.BLEND);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // Bind bitmap to texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.bitmapTexture);
    if (this.uniformLocations.bitmap) gl.uniform1i(this.uniformLocations.bitmap, 0);

    // Bind palette to texture unit 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.paletteTexture);
    if (this.uniformLocations.palette) gl.uniform1i(this.uniformLocations.palette, 1);

    // View matrix
    if (this.uniformLocations.view) gl.uniformMatrix3fv(this.uniformLocations.view, false, state.viewMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Restore state
    gl.bindVertexArray(null);
    gl.useProgram(prevProgram);
    if (!prevBlend) gl.disable(gl.BLEND);
  }

  destroy(): void {
    if (this.gl) {
      if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer);
      if (this.texCoordBuffer) this.gl.deleteBuffer(this.texCoordBuffer);
      if (this.vao) this.gl.deleteVertexArray(this.vao);
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.bitmapTexture) this.gl.deleteTexture(this.bitmapTexture);
      if (this.paletteTexture) this.gl.deleteTexture(this.paletteTexture);
    }
    this.gl = null;
    this.program = null;
    this.imageLoaded = false;
  }
}
