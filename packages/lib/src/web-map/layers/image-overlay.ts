import type { Layer, RenderState } from "../types";

export interface ImageOverlayOptions {
  url: string;
  bounds: [[number, number], [number, number]];
  opacity?: number;
}

export class ImageOverlayLayer implements Layer {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private texture: WebGLTexture | null = null;
  private uniformLocations: {
    view?: WebGLUniformLocation | null;
    texture?: WebGLUniformLocation | null;
    opacity?: WebGLUniformLocation | null;
  } = {};

  private options: Required<ImageOverlayOptions>;
  private imageLoaded = false;
  private needsBuild = true;

  constructor(options: ImageOverlayOptions) {
    this.options = {
      url: options.url,
      bounds: options.bounds,
      opacity: options.opacity ?? 1.0,
    };
  }

  onAdd(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.createShaders();
    this.createBuffers();
    this.setupVAO();
    this.loadImage();
  }

  onRemove(): void {
    this.destroy();
  }

  private createShaders(): void {
    if (!this.gl) return;

    const vertexShaderSource = `#version 300 es
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

    const fragmentShaderSource = `#version 300 es
      precision mediump float;
      in vec2 v_texCoord;
      uniform sampler2D u_texture;
      uniform float u_opacity;
      out vec4 outColor;

      void main() {
        vec4 texColor = texture(u_texture, v_texCoord);
        outColor = vec4(texColor.rgb, texColor.a * u_opacity);
      }
    `;

    this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
    if (this.program) {
      this.uniformLocations.view = this.gl.getUniformLocation(this.program, "u_view");
      this.uniformLocations.texture = this.gl.getUniformLocation(this.program, "u_texture");
      this.uniformLocations.opacity = this.gl.getUniformLocation(this.program, "u_opacity");
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

    const positionLocation = this.gl.getAttribLocation(this.program, "a_position");
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    const texCoordLocation = this.gl.getAttribLocation(this.program, "a_texCoord");
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.enableVertexAttribArray(texCoordLocation);
    this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.bindVertexArray(null);
  }

  private loadingImage?: HTMLImageElement;

  private loadImage(): void {
    if (!this.gl) return;

    const image = new Image();
    this.loadingImage = image;
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (!this.gl || this.loadingImage !== image) return;

      this.texture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

      this.imageLoaded = true;
      this.loadingImage = undefined;
    };
    image.onerror = () => {
      if (this.loadingImage === image) {
        this.loadingImage = undefined;
      }
    };
    image.src = this.options.url;
  }

  private buildQuad(projection: (latlng: [number, number]) => { x: number; y: number }): void {
    if (!this.gl) return;

    const [[minLat, minLng], [maxLat, maxLng]] = this.options.bounds;

    // Project the four corners
    const bottomLeft = projection([minLat, minLng]);
    const bottomRight = projection([minLat, maxLng]);
    const topLeft = projection([maxLat, minLng]);
    const topRight = projection([maxLat, maxLng]);

    // Two triangles for the quad
    const vertices = new Float32Array([
      // Triangle 1
      bottomLeft.x, bottomLeft.y,
      bottomRight.x, bottomRight.y,
      topLeft.x, topLeft.y,
      // Triangle 2
      bottomRight.x, bottomRight.y,
      topRight.x, topRight.y,
      topLeft.x, topLeft.y,
    ]);

    // Texture coordinates (flipped Y for WebGL)
    const texCoords = new Float32Array([
      // Triangle 1
      0, 1,
      1, 1,
      0, 0,
      // Triangle 2
      1, 1,
      1, 0,
      0, 0,
    ]);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null;

    const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER)!;
    this.gl.shaderSource(vertexShader, vertexSource);
    this.gl.compileShader(vertexShader);

    const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)!;
    this.gl.shaderSource(fragmentShader, fragmentSource);
    this.gl.compileShader(fragmentShader);

    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    return program;
  }

  render(gl: WebGL2RenderingContext, state: RenderState): void {
    if (!state.viewMatrix || !this.imageLoaded || !this.texture) return;

    if (this.needsBuild) {
      this.buildQuad(state.projection);
      this.needsBuild = false;
    }

    if (!this.program || !this.vao) return;

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    if (this.uniformLocations.view) {
      gl.uniformMatrix3fv(this.uniformLocations.view, false, state.viewMatrix);
    }

    if (this.uniformLocations.texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(this.uniformLocations.texture, 0);
    }

    if (this.uniformLocations.opacity) {
      gl.uniform1f(this.uniformLocations.opacity, this.options.opacity);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }

  setOpacity(opacity: number): void {
    this.options.opacity = opacity;
  }

  destroy(): void {
    if (this.gl) {
      if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer);
      if (this.texCoordBuffer) this.gl.deleteBuffer(this.texCoordBuffer);
      if (this.vao) this.gl.deleteVertexArray(this.vao);
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.texture) this.gl.deleteTexture(this.texture);
    }

    this.gl = null;
    this.program = null;
    this.vertexBuffer = null;
    this.texCoordBuffer = null;
    this.vao = null;
    this.texture = null;
    this.imageLoaded = false;
    this.loadingImage = undefined;
  }
}
