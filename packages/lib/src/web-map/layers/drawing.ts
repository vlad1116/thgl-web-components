import type { Layer, LatLng, RenderState } from "../types";

export interface DrawingShape {
  id: string;
  type: "line" | "rectangle" | "polygon" | "circle" | "text";
  positions?: LatLng[];
  center?: LatLng;
  radius?: number;
  text?: string;
  color: string;
  fillColor?: string;
  size: number;
  mapName: string;
}

export interface DrawingLayerOptions {
  interactive?: boolean;
  zIndex?: number;
}

export class DrawingLayer implements Layer {
  private gl: WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private program: WebGLProgram | null = null;
  private shapes: Map<string, DrawingShape> = new Map();
  private options: DrawingLayerOptions;
  private vertexBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  // Interleaved vertex data: [x, y, r, g, b, a] per vertex (6 floats = 24 bytes)
  private vertexData: Float32Array = new Float32Array();
  private indices: Uint16Array = new Uint16Array();
  private textElements: Map<string, HTMLElement> = new Map();
  private vertexMarkers: Map<string, HTMLElement[]> = new Map();
  private activeShapeIds: Set<string> = new Set();
  private needsBufferUpdate = false;
  private lastBufferZoom = -1;
  // Reusable scratch arrays for buffer building (avoids per-frame allocations)
  private scratchVertexData: number[] = [];
  private scratchIndices: number[] = [];
  private uniformLocations: {
    view?: WebGLUniformLocation | null;
  } = {};
  private cachedCanvasRect: DOMRect | null = null;
  private cachedRectTime: number = 0;
  private rectCacheMs: number = 100;

  constructor(options: DrawingLayerOptions = {}) {
    this.options = { interactive: true, ...options };
  }

  onAdd(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.canvas = gl.canvas as HTMLCanvasElement;
    this.createShaders();
    this.createBuffers();
    this.setupVAO();
    this.needsBufferUpdate = true;
  }

  private setupVAO(): void {
    if (!this.gl || !this.program) return;

    // Cache uniform locations
    this.uniformLocations.view = this.gl.getUniformLocation(this.program, "u_view");
  }

  onRemove(): void {
    this.destroy();
  }

  private createShaders(): void {
    if (!this.gl) return;

    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      in vec4 a_color;

      uniform mat3 u_view;

      out vec4 v_color;

      void main() {
        vec3 pos = u_view * vec3(a_position, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
        v_color = a_color;
      }
    `;

    const fragmentShaderSource = `#version 300 es
      precision highp float;

      in vec4 v_color;
      out vec4 fragColor;

      void main() {
        fragColor = v_color;
      }
    `;

    const vertexShader = this.createShader(
      this.gl.VERTEX_SHADER,
      vertexShaderSource,
    );
    const fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );

    if (!vertexShader || !fragmentShader) return;

    this.program = this.gl.createProgram();
    if (!this.program) return;

    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error(
        "Program link error:",
        this.gl.getProgramInfoLog(this.program),
      );
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
  }

  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private createBuffers(): void {
    if (!this.gl) return;

    this.vertexBuffer = this.gl.createBuffer();
    this.indexBuffer = this.gl.createBuffer();
  }

  addShape(shape: DrawingShape): void {
    this.shapes.set(shape.id, shape);
    if (shape.type === "text") {
      this.createTextElement(shape);
    }
    this.needsBufferUpdate = true;
  }

  removeShape(id: string): void {
    const shape = this.shapes.get(id);
    if (shape?.type === "text") {
      this.removeTextElement(id);
    }
    this.shapes.delete(id);
    this.needsBufferUpdate = true;
  }

  updateShape(id: string, updates: Partial<DrawingShape>): void {
    const shape = this.shapes.get(id);
    if (shape) {
      Object.assign(shape, updates);
      if (shape.type === "text" && (updates.color !== undefined || updates.text !== undefined || updates.size !== undefined)) {
        let element = this.textElements.get(id);
        if (!element && shape.text && shape.center) {
          this.createTextElement(shape);
          element = this.textElements.get(id);
        }
        if (element) {
          if (updates.color) element.style.setProperty('color', updates.color, 'important');
          if (updates.text !== undefined) element.textContent = updates.text;
          if (updates.size) element.style.fontSize = `${updates.size}px`;
        }
      }
      this.needsBufferUpdate = true;
    }
  }

  getShape(id: string): DrawingShape | undefined {
    return this.shapes.get(id);
  }

  getAllShapes(): DrawingShape[] {
    return Array.from(this.shapes.values());
  }

  setActiveShape(id: string | null): void {
    for (const prevId of this.activeShapeIds) {
      this.removeVertexMarkers(prevId);
    }
    this.activeShapeIds.clear();

    if (id) {
      this.activeShapeIds.add(id);
    }
  }

  setAllShapesActive(): void {
    for (const prevId of this.activeShapeIds) {
      this.removeVertexMarkers(prevId);
    }
    this.activeShapeIds.clear();

    for (const id of this.shapes.keys()) {
      this.activeShapeIds.add(id);
    }
  }

  private createVertexMarkers(shapeId: string, positions: LatLng[], color: string, midpoints?: LatLng[]): void {
    this.removeVertexMarkers(shapeId);

    const markers: HTMLElement[] = [];
    for (let i = 0; i < positions.length; i++) {
      const marker = document.createElement('div');
      marker.setAttribute('data-vertex-id', `${shapeId}-${i}`);
      marker.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: white;
        border: 2px solid ${color};
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
        z-index: 10001;
        transform: translate(-50%, -50%);
        left: 0px;
        top: 0px;
      `;
      document.body.appendChild(marker);
      markers.push(marker);
    }
    // Add midpoint markers (smaller, semi-transparent)
    if (midpoints) {
      for (let i = 0; i < midpoints.length; i++) {
        const marker = document.createElement('div');
        marker.setAttribute('data-vertex-id', `${shapeId}-mid-${i}`);
        marker.style.cssText = `
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: white;
          border: 2px solid ${color};
          opacity: 0.5;
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
          z-index: 10001;
          transform: translate(-50%, -50%);
          left: 0px;
          top: 0px;
        `;
        document.body.appendChild(marker);
        markers.push(marker);
      }
    }
    this.vertexMarkers.set(shapeId, markers);
  }

  private removeVertexMarkers(shapeId: string): void {
    const markers = this.vertexMarkers.get(shapeId);
    if (markers) {
      for (const marker of markers) {
        if (marker.parentNode) {
          marker.parentNode.removeChild(marker);
        }
      }
      this.vertexMarkers.delete(shapeId);
    }
  }

  private updateVertexMarkerPositions(shapeId: string, positions: LatLng[], state: RenderState): void {
    if (!state.viewMatrix || !this.canvas) return;

    const markers = this.vertexMarkers.get(shapeId);
    if (!markers) return;

    const now = performance.now();
    if (!this.cachedCanvasRect || (now - this.cachedRectTime) > this.rectCacheMs) {
      this.cachedCanvasRect = this.canvas.getBoundingClientRect();
      this.cachedRectTime = now;
    }
    const rect = this.cachedCanvasRect;

    const view = state.viewMatrix;
    const a = view[0], b = view[1];
    const c = view[3], d = view[4];
    const tx = view[6], ty = view[7];

    for (let i = 0; i < markers.length && i < positions.length; i++) {
      const marker = markers[i];
      const pos = positions[i];

      const worldPos = state.projection(pos);
      const clipX = a * worldPos.x + c * worldPos.y + tx;
      const clipY = b * worldPos.x + d * worldPos.y + ty;

      const cssWidth = rect.width || state.width / state.devicePixelRatio;
      const cssHeight = rect.height || state.height / state.devicePixelRatio;
      const pageX = rect.left + (clipX * 0.5 + 0.5) * cssWidth;
      const pageY = rect.top + (1 - (clipY * 0.5 + 0.5)) * cssHeight;

      marker.style.left = `${pageX}px`;
      marker.style.top = `${pageY}px`;
    }
  }

  clearShapes(): void {
    for (const element of this.textElements.values()) {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
    this.textElements.clear();
    for (const shapeId of this.vertexMarkers.keys()) {
      this.removeVertexMarkers(shapeId);
    }
    this.activeShapeIds.clear();
    this.shapes.clear();
    this.needsBufferUpdate = true;
  }

  private updateBuffers(state: RenderState): void {
    // Reuse scratch arrays to avoid per-frame allocations
    const vertexData = this.scratchVertexData;
    const indices = this.scratchIndices;
    vertexData.length = 0;
    indices.length = 0;
    let vertexOffset = 0;

    const pixelToWorld = this.getPixelToWorldScale(state);

    for (const shape of this.shapes.values()) {
      if (shape.type === 'text') continue;

      const color = this.hexToRgba(shape.color);
      const halfWidth = (shape.size / 2) * pixelToWorld;

      switch (shape.type) {
        case "line":
          if (shape.positions && shape.positions.length >= 2) {
            vertexOffset += this.addStrokedPolyline(
              shape.positions, halfWidth, color,
              vertexData, indices, vertexOffset,
              state.projection, false
            );
          }
          break;
        case "rectangle":
          if (shape.positions && shape.positions.length >= 2) {
            const [p1, p2] = shape.positions;
            const minLat = Math.min(p1[0], p2[0]);
            const maxLat = Math.max(p1[0], p2[0]);
            const minLng = Math.min(p1[1], p2[1]);
            const maxLng = Math.max(p1[1], p2[1]);
            const corners: LatLng[] = [
              [minLat, minLng],
              [minLat, maxLng],
              [maxLat, maxLng],
              [maxLat, minLng],
            ];
            // Fill
            if (shape.fillColor) {
              vertexOffset += this.addFilledPolygon(
                corners, this.hexToRgba(shape.fillColor),
                vertexData, indices, vertexOffset, state.projection
              );
            }
            vertexOffset += this.addStrokedPolyline(
              corners, halfWidth, color,
              vertexData, indices, vertexOffset,
              state.projection, true
            );
          }
          break;
        case "polygon":
          if (shape.positions && shape.positions.length >= 3) {
            // Fill
            if (shape.fillColor) {
              vertexOffset += this.addFilledPolygon(
                shape.positions, this.hexToRgba(shape.fillColor),
                vertexData, indices, vertexOffset, state.projection
              );
            }
            vertexOffset += this.addStrokedPolyline(
              shape.positions, halfWidth, color,
              vertexData, indices, vertexOffset,
              state.projection, true
            );
          }
          break;
        case "circle":
          if (shape.center && shape.radius) {
            const segments = 64;
            const [lat, lng] = shape.center;
            const circlePositions: LatLng[] = [];
            for (let i = 0; i < segments; i++) {
              const angle = (i / segments) * Math.PI * 2;
              circlePositions.push([
                lat + Math.cos(angle) * shape.radius,
                lng + Math.sin(angle) * shape.radius,
              ]);
            }
            // Fill
            if (shape.fillColor) {
              vertexOffset += this.addFilledPolygon(
                circlePositions, this.hexToRgba(shape.fillColor),
                vertexData, indices, vertexOffset, state.projection
              );
            }
            vertexOffset += this.addStrokedPolyline(
              circlePositions, halfWidth, color,
              vertexData, indices, vertexOffset,
              state.projection, true
            );
          }
          break;
      }
    }

    // Reuse TypedArrays if size matches, otherwise allocate new ones
    if (this.vertexData.length !== vertexData.length) {
      this.vertexData = new Float32Array(vertexData);
    } else {
      this.vertexData.set(vertexData);
    }
    if (this.indices.length !== indices.length) {
      this.indices = new Uint16Array(indices);
    } else {
      this.indices.set(indices);
    }

    if (this.gl && this.vertexBuffer && this.indexBuffer) {
      // Update interleaved vertex buffer data
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexData, this.gl.DYNAMIC_DRAW);

      // Update index buffer data
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indices, this.gl.DYNAMIC_DRAW);
    }
  }

  /**
   * Generate a stroked polyline using individual quads per segment.
   * Each segment gets its own rectangle, with round joins handled by caps.
   * Uses interleaved vertex data: [x, y, r, g, b, a] per vertex.
   */
  private addStrokedPolyline(
    positions: LatLng[],
    halfWidth: number,
    color: [number, number, number, number],
    vertexData: number[],
    indices: number[],
    vertexOffset: number,
    projection: (latlng: LatLng) => { x: number; y: number },
    closed: boolean
  ): number {
    if (positions.length < 2) return 0;

    const worldPositions = positions.map(p => projection(p));
    const n = worldPositions.length;
    let totalVertices = 0;
    const numSegments = closed ? n : n - 1;
    const [r, g, b, a] = color;

    // Draw each segment as a separate quad
    for (let i = 0; i < numSegments; i++) {
      const p1 = worldPositions[i];
      const p2 = worldPositions[(i + 1) % n];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.0001) continue;

      // Normal perpendicular to segment
      const nx = (-dy / len) * halfWidth;
      const ny = (dx / len) * halfWidth;

      // Four corners of the quad - interleaved [x, y, r, g, b, a]
      const v0 = vertexOffset + totalVertices;
      vertexData.push(p1.x + nx, p1.y + ny, r, g, b, a); // top-left
      vertexData.push(p1.x - nx, p1.y - ny, r, g, b, a); // bottom-left
      vertexData.push(p2.x - nx, p2.y - ny, r, g, b, a); // bottom-right
      vertexData.push(p2.x + nx, p2.y + ny, r, g, b, a); // top-right

      // Two triangles for the quad
      indices.push(v0, v0 + 1, v0 + 2);
      indices.push(v0, v0 + 2, v0 + 3);

      totalVertices += 4;

      // Add round join at p2 (if not the last segment of an open line)
      if (i < numSegments - 1 || closed) {
        const nextIdx = (i + 2) % n;
        const p3 = worldPositions[nextIdx];
        const dx2 = p3.x - p2.x;
        const dy2 = p3.y - p2.y;
        const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        if (len2 > 0.0001) {
          // Add a round join at the corner
          const joinVerts = this.addRoundJoin(
            p2, { x: dx, y: dy }, { x: dx2, y: dy2 },
            halfWidth, color, vertexData, indices,
            vertexOffset + totalVertices
          );
          totalVertices += joinVerts;
        }
      }
    }

    // Add round caps for non-closed lines
    if (!closed && n >= 2) {
      // Start cap
      const startCapVerts = this.addRoundCap(
        worldPositions[0],
        { x: worldPositions[1].x - worldPositions[0].x, y: worldPositions[1].y - worldPositions[0].y },
        halfWidth, color, vertexData, indices,
        vertexOffset + totalVertices, true
      );
      totalVertices += startCapVerts;

      // End cap
      const endCapVerts = this.addRoundCap(
        worldPositions[n - 1],
        { x: worldPositions[n - 1].x - worldPositions[n - 2].x, y: worldPositions[n - 1].y - worldPositions[n - 2].y },
        halfWidth, color, vertexData, indices,
        vertexOffset + totalVertices, false
      );
      totalVertices += endCapVerts;
    }

    return totalVertices;
  }

  /**
   * Add a round join between two segments at their meeting point.
   * Uses interleaved vertex data: [x, y, r, g, b, a] per vertex.
   */
  private addRoundJoin(
    center: { x: number; y: number },
    dir1: { x: number; y: number },
    dir2: { x: number; y: number },
    halfWidth: number,
    color: [number, number, number, number],
    vertexData: number[],
    indices: number[],
    vertexOffset: number
  ): number {
    const len1 = Math.sqrt(dir1.x * dir1.x + dir1.y * dir1.y);
    const len2 = Math.sqrt(dir2.x * dir2.x + dir2.y * dir2.y);
    if (len1 < 0.0001 || len2 < 0.0001) return 0;

    // Normalized directions
    const d1x = dir1.x / len1, d1y = dir1.y / len1;
    const d2x = dir2.x / len2, d2y = dir2.y / len2;

    // Angle between segments (cross product gives sin of angle)
    const cross = d1x * d2y - d1y * d2x;

    // If segments are nearly collinear, no join needed
    if (Math.abs(cross) < 0.01) return 0;

    // Normals for each segment
    const n1x = -d1y, n1y = d1x;
    const n2x = -d2y, n2y = d2x;

    let startAngle: number, endAngle: number;
    if (cross > 0) {
      // Left turn - fill the outer right corner
      startAngle = Math.atan2(-n1y, -n1x);
      endAngle = Math.atan2(-n2y, -n2x);
    } else {
      // Right turn - fill the outer left corner
      startAngle = Math.atan2(n2y, n2x);
      endAngle = Math.atan2(n1y, n1x);
    }

    // Normalize angle difference
    let angleDiff = endAngle - startAngle;
    if (angleDiff < 0) angleDiff += Math.PI * 2;
    if (angleDiff > Math.PI) {
      // Swap and go the other way
      const temp = startAngle;
      startAngle = endAngle;
      endAngle = temp;
      angleDiff = Math.PI * 2 - angleDiff;
    }

    // Number of segments for the arc
    const segments = Math.max(2, Math.ceil(angleDiff / (Math.PI / 8)));
    const [r, g, b, a] = color;

    // Center vertex - interleaved [x, y, r, g, b, a]
    vertexData.push(center.x, center.y, r, g, b, a);
    const centerIdx = vertexOffset;
    let vertCount = 1;

    // Arc vertices - interleaved [x, y, r, g, b, a]
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (i / segments) * angleDiff;
      vertexData.push(center.x + Math.cos(angle) * halfWidth, center.y + Math.sin(angle) * halfWidth, r, g, b, a);
      vertCount++;
    }

    // Triangle fan
    for (let i = 0; i < segments; i++) {
      indices.push(centerIdx, centerIdx + 1 + i, centerIdx + 2 + i);
    }

    return vertCount;
  }

  /**
   * Add a round cap at the end of a line.
   * Uses interleaved vertex data: [x, y, r, g, b, a] per vertex.
   */
  private addRoundCap(
    center: { x: number; y: number },
    direction: { x: number; y: number },
    halfWidth: number,
    color: [number, number, number, number],
    vertexData: number[],
    indices: number[],
    vertexOffset: number,
    isStart: boolean
  ): number {
    const segments = 8;
    const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (len < 0.0001) return 0;

    const dirX = direction.x / len;
    const dirY = direction.y / len;

    const baseAngle = Math.atan2(-dirX, dirY);
    const startAngle = isStart ? baseAngle : baseAngle + Math.PI;
    const [r, g, b, a] = color;

    // Center vertex - interleaved [x, y, r, g, b, a]
    vertexData.push(center.x, center.y, r, g, b, a);
    const centerIdx = vertexOffset;
    let vertCount = 1;

    // Arc vertices - interleaved [x, y, r, g, b, a]
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (i / segments) * Math.PI;
      vertexData.push(center.x + Math.cos(angle) * halfWidth, center.y + Math.sin(angle) * halfWidth, r, g, b, a);
      vertCount++;
    }

    // Triangle fan
    for (let i = 0; i < segments; i++) {
      indices.push(centerIdx, centerIdx + 1 + i, centerIdx + 2 + i);
    }

    return vertCount;
  }

  /**
   * Add a filled polygon using a triangle fan from vertex 0.
   * Works correctly for convex polygons and reasonably for mildly concave ones.
   */
  private addFilledPolygon(
    positions: LatLng[],
    color: [number, number, number, number],
    vertexData: number[],
    indices: number[],
    vertexOffset: number,
    projection: (latlng: LatLng) => { x: number; y: number },
  ): number {
    if (positions.length < 3) return 0;

    const worldPositions = positions.map(p => projection(p));
    const [r, g, b, a] = color;

    // Add all vertices with interleaved color data
    for (const wp of worldPositions) {
      vertexData.push(wp.x, wp.y, r, g, b, a);
    }

    // Triangle fan from vertex 0
    for (let i = 1; i < worldPositions.length - 1; i++) {
      indices.push(vertexOffset, vertexOffset + i, vertexOffset + i + 1);
    }

    return worldPositions.length;
  }

  private getPixelToWorldScale(state: RenderState): number {
    if (!state.viewMatrix) return 0.001;

    // Extract the actual scale from the view matrix, accounting for rotation.
    // In a rotated matrix: [scaleX*cos(θ), scaleX*sin(θ), ...]
    // The scale is the length of the first column vector.
    const view = state.viewMatrix;
    const scaleX = Math.sqrt(view[0] * view[0] + view[1] * view[1]);
    const screenWidth = state.width / state.devicePixelRatio;
    return (2 / screenWidth) / scaleX;
  }

  private hexToRgba(hex: string): [number, number, number, number] {
    if (!hex) return [1, 0, 0, 1]; // Default to red if no color provided

    // Handle 8-character hex with alpha (RRGGBBAA)
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
        parseInt(result[4], 16) / 255,
      ];
    }

    // Handle 6-character hex (no alpha)
    result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
        1.0,
      ];
    }

    // Handle 4-character hex with alpha (RGBA shorthand)
    result = /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (result) {
      return [
        parseInt(result[1] + result[1], 16) / 255,
        parseInt(result[2] + result[2], 16) / 255,
        parseInt(result[3] + result[3], 16) / 255,
        parseInt(result[4] + result[4], 16) / 255,
      ];
    }

    // Handle 3-character hex (e.g., "#f00" -> "#ff0000")
    result = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (result) {
      return [
        parseInt(result[1] + result[1], 16) / 255,
        parseInt(result[2] + result[2], 16) / 255,
        parseInt(result[3] + result[3], 16) / 255,
        1.0,
      ];
    }

    // Handle rgba() format
    result = /^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/i.exec(hex);
    if (result) {
      return [
        parseInt(result[1], 10) / 255,
        parseInt(result[2], 10) / 255,
        parseInt(result[3], 10) / 255,
        result[4] ? parseFloat(result[4]) : 1.0,
      ];
    }

    // Default to red to make it obvious when color parsing fails
    return [1, 0, 0, 1];
  }

  private computeMidpoints(positions: LatLng[], closed: boolean): LatLng[] {
    const midpoints: LatLng[] = [];
    const n = positions.length;
    const segments = closed ? n : n - 1;
    for (let i = 0; i < segments; i++) {
      const p1 = positions[i];
      const p2 = positions[(i + 1) % n];
      midpoints.push([(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]);
    }
    return midpoints;
  }

  private getCircleRadiusHandle(center: LatLng, radius: number): LatLng {
    // Place handle to the right of center
    return [center[0], center[1] + radius];
  }

  private updateActiveShapeVertexMarkers(state: RenderState): void {
    for (const shapeId of this.activeShapeIds) {
      const shape = this.shapes.get(shapeId);
      if (!shape) continue;

      let positions: LatLng[] | undefined;
      let midpoints: LatLng[] | undefined;

      if (shape.type === 'line' && shape.positions) {
        positions = shape.positions;
        midpoints = this.computeMidpoints(positions, false);
      } else if (shape.type === 'polygon' && shape.positions) {
        positions = shape.positions;
        midpoints = this.computeMidpoints(positions, true);
      } else if (shape.type === 'rectangle' && shape.positions && shape.positions.length >= 2) {
        positions = shape.positions;
      } else if (shape.type === 'circle' && shape.center) {
        const radiusHandle = this.getCircleRadiusHandle(shape.center, shape.radius ?? 0);
        positions = [shape.center, radiusHandle];
      }

      if (!positions || positions.length === 0) continue;

      const totalExpected = positions.length + (midpoints?.length ?? 0);
      const existingMarkers = this.vertexMarkers.get(shapeId);
      if (!existingMarkers || existingMarkers.length !== totalExpected) {
        this.createVertexMarkers(shapeId, positions, shape.color, midpoints);
      }

      // Update positions for all markers (vertices + midpoints)
      const allPositions = midpoints ? [...positions, ...midpoints] : positions;
      this.updateVertexMarkerPositions(shapeId, allPositions, state);
    }
  }

  render(gl: WebGL2RenderingContext, state: RenderState): void {
    // Update text elements position every frame
    this.updateTextElements(state);

    // Update vertex markers for active shapes
    this.updateActiveShapeVertexMarkers(state);

    // Update buffers when shapes changed or zoom changed (stroke widths depend on zoom)
    const zoomChanged = this.shapes.size > 0 && Math.abs(state.zoom - this.lastBufferZoom) > 0.001;
    if (this.needsBufferUpdate || zoomChanged) {
      this.updateBuffers(state);
      this.needsBufferUpdate = false;
      this.lastBufferZoom = state.zoom;
    }

    if (!this.gl || !this.program || this.indices.length === 0) {
      return;
    }

    // Save current WebGL state
    const prevProgram = this.gl.getParameter(this.gl.CURRENT_PROGRAM);
    const prevVao = this.gl.getParameter(this.gl.VERTEX_ARRAY_BINDING);
    const prevBlendEnabled = this.gl.isEnabled(this.gl.BLEND);
    const prevBlendSrcRGB = this.gl.getParameter(this.gl.BLEND_SRC_RGB);
    const prevBlendDstRGB = this.gl.getParameter(this.gl.BLEND_DST_RGB);
    const prevBlendSrcAlpha = this.gl.getParameter(this.gl.BLEND_SRC_ALPHA);
    const prevBlendDstAlpha = this.gl.getParameter(this.gl.BLEND_DST_ALPHA);

    this.gl.useProgram(this.program);

    // Get attribute locations
    const positionLocation = this.gl.getAttribLocation(this.program, "a_position");
    const colorLocation = this.gl.getAttribLocation(this.program, "a_color");

    // Bind interleaved vertex buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);

    // Interleaved format: [x, y, r, g, b, a] = 6 floats = 24 bytes per vertex
    const STRIDE = 6 * 4; // 6 floats * 4 bytes per float = 24 bytes
    const POSITION_OFFSET = 0;
    const COLOR_OFFSET = 2 * 4; // 2 floats * 4 bytes = 8 bytes

    // Setup position attribute (2 floats at offset 0)
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, STRIDE, POSITION_OFFSET);

    // Setup color attribute (4 floats at offset 8)
    this.gl.enableVertexAttribArray(colorLocation);
    this.gl.vertexAttribPointer(colorLocation, 4, this.gl.FLOAT, false, STRIDE, COLOR_OFFSET);

    // Enable blending for alpha transparency
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFuncSeparate(
      this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA,
      this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA
    );

    // Bind index buffer
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    if (this.uniformLocations.view && state.viewMatrix) {
      this.gl.uniformMatrix3fv(this.uniformLocations.view, false, state.viewMatrix);
    }

    // Draw triangles
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.indices.length,
      this.gl.UNSIGNED_SHORT,
      0,
    );

    // Restore WebGL state
    this.gl.disableVertexAttribArray(positionLocation);
    this.gl.disableVertexAttribArray(colorLocation);
    this.gl.bindVertexArray(prevVao);
    this.gl.useProgram(prevProgram);

    // Restore blend state
    if (prevBlendEnabled) {
      this.gl.enable(this.gl.BLEND);
    } else {
      this.gl.disable(this.gl.BLEND);
    }
    this.gl.blendFuncSeparate(prevBlendSrcRGB, prevBlendDstRGB, prevBlendSrcAlpha, prevBlendDstAlpha);
  }

  private createTextElement(shape: DrawingShape): void {
    if (!shape.center || !shape.text || !this.canvas?.parentElement) return;

    const element = document.createElement("div");
    element.textContent = shape.text;
    element.setAttribute('data-text-id', shape.id);
    element.style.cssText = `
      position: absolute;
      font-size: ${shape.size}px;
      font-family: Arial, system-ui, sans-serif;
      font-weight: 700;
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
      transform: translate(-50%, -50%);
      -webkit-font-smoothing: antialiased;
      left: 0px;
      top: 0px;
      text-shadow: -1px -1px 0 #594f42, 1px -1px 0 #594f42, -1px 1px 0 #594f42, 1px 1px 0 #594f42, 0 -1px 0 #594f42, 0 1px 0 #594f42, -1px 0 0 #594f42, 1px 0 0 #594f42;
    `;
    element.style.setProperty('color', shape.color, 'important');

    this.canvas.parentElement.appendChild(element);
    this.textElements.set(shape.id, element);
  }

  private removeTextElement(id: string): void {
    const element = this.textElements.get(id);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    this.textElements.delete(id);
  }

  private updateTextElements(state: RenderState): void {
    if (!state.viewMatrix || !this.canvas || this.textElements.size === 0) return;

    const cssWidth = this.canvas.clientWidth || state.width / state.devicePixelRatio;
    const cssHeight = this.canvas.clientHeight || state.height / state.devicePixelRatio;

    const view = state.viewMatrix;
    const a = view[0], b = view[1];
    const c = view[3], d = view[4];
    const tx = view[6], ty = view[7];

    // Adaptive zoom sizing for text (matching icon marker scaling)
    const zoomRange = state.maxZoom - state.minZoom;
    const zoomFactor = zoomRange > 0 ? Math.max(0, Math.min(1, (state.zoom - state.minZoom) / zoomRange)) : 0.5;
    const zoomSizeScale = 0.25 + 2.25 * Math.pow(zoomFactor, zoomRange / 6.0);

    for (const [id, element] of this.textElements) {
      const shape = this.shapes.get(id);
      if (!shape || !shape.center) continue;

      const worldPos = state.projection(shape.center);
      const clipX = a * worldPos.x + c * worldPos.y + tx;
      const clipY = b * worldPos.x + d * worldPos.y + ty;

      const x = (clipX * 0.5 + 0.5) * cssWidth;
      const y = (1 - (clipY * 0.5 + 0.5)) * cssHeight;

      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.style.fontSize = `${shape.size * zoomSizeScale}px`;
    }
  }

  destroy(): void {
    for (const element of this.textElements.values()) {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
    this.textElements.clear();

    for (const shapeId of this.vertexMarkers.keys()) {
      this.removeVertexMarkers(shapeId);
    }
    this.activeShapeIds.clear();

    if (this.gl) {
      if (this.program) {
        this.gl.deleteProgram(this.program);
        this.program = null;
      }
      if (this.vertexBuffer) {
        this.gl.deleteBuffer(this.vertexBuffer);
        this.vertexBuffer = null;
      }
      if (this.indexBuffer) {
        this.gl.deleteBuffer(this.indexBuffer);
        this.indexBuffer = null;
      }
    }
    this.shapes.clear();
  }
}
