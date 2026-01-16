import type { WebMap } from "../webmap";
import type { LatLng } from "../types";
import { DrawingLayer, type DrawingShape } from "../layers/drawing";

export type DrawingMode = 'none' | 'line' | 'rectangle' | 'polygon' | 'circle' | 'text' | 'edit' | 'drag' | 'remove';

export interface DrawingManagerOptions {
  defaultColor?: string;
  defaultSize?: number;
  textColor?: string;
  textSize?: number;
}

export interface DrawingManagerEventMap {
  'drawing:start': { mode: DrawingMode };
  'drawing:create': { shape: DrawingShape };
  'drawing:edit': { shape: DrawingShape };
  'drawing:remove': { id: string };
  'drawing:finish': { shape: DrawingShape };
}

type EventHandler<T = any> = (event: T) => void;

export class DrawingManager {
  private map: WebMap;
  private drawingLayer: DrawingLayer;
  private currentMode: DrawingMode = 'none';
  private isDrawing = false;
  private currentShape: Partial<DrawingShape> | null = null;
  private temporaryPoints: LatLng[] = [];
  private options: Required<DrawingManagerOptions>;
  private eventHandlers: Map<keyof DrawingManagerEventMap, EventHandler[]> = new Map();
  private clickHandler?: (event: { latlng: LatLng; originalEvent: MouseEvent }) => void;
  private mouseMoveHandler?: (event: { latlng: LatLng; originalEvent: MouseEvent }) => void;
  private dblClickHandler?: (event: { latlng: LatLng; originalEvent: MouseEvent }) => void;
  private contextMenuHandler?: (event: { latlng: LatLng; originalEvent: MouseEvent }) => void;
  private canvas: HTMLCanvasElement | null = null;
  private previousCursor: string = '';
  private cursorTooltip: HTMLElement | null = null;
  private keydownHandler?: (event: KeyboardEvent) => void;
  private vertexClickThreshold = 15; // pixels
  private textInputContainer: HTMLElement | null = null;
  private textInputElement: HTMLInputElement | null = null;
  private currentTextPosition: LatLng | null = null;
  private isFinishingText = false;
  private textInputAnimationFrame?: number;

  constructor(map: WebMap, options: DrawingManagerOptions = {}) {
    this.map = map;
    this.drawingLayer = new DrawingLayer({ interactive: true });
    this.options = {
      defaultColor: options.defaultColor || '#3388ff',
      defaultSize: options.defaultSize || 3,
      textColor: options.textColor || '#000000',
      textSize: options.textSize || 16,
    };

    // Get canvas for cursor management
    this.canvas = map.getContainer();

    // Add drawing layer to map
    this.map.addLayer(this.drawingLayer, { zIndex: 50 });
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.clickHandler = (event) => this.handleMapClick(event);
    this.mouseMoveHandler = (event) => this.handleMapMouseMove(event);
    this.dblClickHandler = (event) => this.handleMapDblClick(event);
    this.contextMenuHandler = (event) => this.handleContextMenu(event);
    this.keydownHandler = (event) => this.handleKeyDown(event);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (this.currentMode === 'line' && this.isDrawing && this.temporaryPoints.length >= 2) {
        event.preventDefault();
        event.stopPropagation();
        if (this.currentShape && this.currentShape.positions) {
          this.currentShape.positions = [...this.temporaryPoints];
        }
        this.finishCurrentDrawing();
      } else if (this.currentMode === 'polygon' && this.isDrawing && this.temporaryPoints.length >= 3) {
        event.preventDefault();
        event.stopPropagation();
        if (this.currentShape && this.currentShape.positions) {
          this.currentShape.positions = [...this.temporaryPoints];
        }
        this.finishCurrentDrawing();
      }
    } else if (event.key === 'Escape') {
      // Cancel current drawing - always stop propagation to prevent closing dialog
      event.preventDefault();
      event.stopPropagation();
      if (this.isDrawing && this.currentShape) {
        this.setActiveDrawingShape(null);
        if (this.currentShape.id) {
          this.drawingLayer.removeShape(this.currentShape.id);
        }
        this.isDrawing = false;
        this.currentShape = null;
        this.temporaryPoints = [];
      }
    }
  }

  private isClickNearLastVertex(originalEvent: MouseEvent): boolean {
    if (!this.isDrawing || this.temporaryPoints.length === 0) return false;

    const state = this.map.getRenderState();
    if (!state) return false;

    // Get click position in screen coordinates
    const clickX = originalEvent.clientX;
    const clickY = originalEvent.clientY;
    const rect = this.canvas?.getBoundingClientRect();
    if (!rect) return false;

    // Only check the last vertex
    const lastVertex = this.temporaryPoints[this.temporaryPoints.length - 1];
    const worldPos = state.projection(lastVertex);
    const view = state.viewMatrix;
    if (!view) return false;

    const a = view[0], b = view[1];
    const c = view[3], d = view[4];
    const tx = view[6], ty = view[7];

    const clipX = a * worldPos.x + c * worldPos.y + tx;
    const clipY = b * worldPos.x + d * worldPos.y + ty;

    const cssWidth = rect.width;
    const cssHeight = rect.height;
    const screenX = rect.left + (clipX * 0.5 + 0.5) * cssWidth;
    const screenY = rect.top + (1 - (clipY * 0.5 + 0.5)) * cssHeight;

    // Calculate distance
    const dx = clickX - screenX;
    const dy = clickY - screenY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= this.vertexClickThreshold;
  }

  private setCursor(cursor: string): void {
    if (this.canvas) {
      if (this.previousCursor === '') {
        this.previousCursor = this.canvas.style.cursor;
      }
      this.canvas.style.cursor = cursor;
    }
  }

  private resetCursor(): void {
    if (this.canvas) {
      this.canvas.style.cursor = this.previousCursor;
      this.previousCursor = '';
    }
  }

  private createCursorTooltip(): void {
    if (this.cursorTooltip) return;

    this.cursorTooltip = document.createElement('div');
    this.cursorTooltip.style.cssText = `
      position: fixed;
      background: rgba(0, 0, 0, 0.75);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-family: system-ui, sans-serif;
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
      z-index: 10000;
      white-space: nowrap;
      display: none;
    `;
    document.body.appendChild(this.cursorTooltip);
  }

  private updateCursorTooltip(x: number, y: number): void {
    if (!this.cursorTooltip) return;

    const message = this.getTooltipMessage();
    if (message) {
      this.cursorTooltip.textContent = message;
      this.cursorTooltip.style.display = 'block';
      this.cursorTooltip.style.left = `${x + 15}px`;
      this.cursorTooltip.style.top = `${y + 20}px`;
    } else {
      this.cursorTooltip.style.display = 'none';
    }
  }

  private getTooltipMessage(): string {
    switch (this.currentMode) {
      case 'line':
        if (!this.isDrawing) return 'Click to start line';
        return this.temporaryPoints.length < 2
          ? 'Click to add point'
          : 'Click to continue, Enter or double-click to finish';
      case 'polygon':
        if (!this.isDrawing) return 'Click to start polygon';
        if (this.temporaryPoints.length < 3) return 'Click to add point';
        return 'Click to continue, Enter or double-click to finish';
      case 'rectangle':
        if (!this.isDrawing) return 'Click to start rectangle';
        return 'Click to finish rectangle';
      case 'circle':
        if (!this.isDrawing) return 'Click to set center';
        return 'Click to set radius';
      case 'text':
        return 'Click to place text';
      case 'edit':
        return 'Click shape to edit';
      case 'drag':
        return 'Drag to move';
      case 'remove':
        return 'Click shape to remove';
      default:
        return '';
    }
  }

  private removeCursorTooltip(): void {
    if (this.cursorTooltip && this.cursorTooltip.parentNode) {
      this.cursorTooltip.parentNode.removeChild(this.cursorTooltip);
      this.cursorTooltip = null;
    }
  }

  private getCursorForMode(mode: DrawingMode): string {
    switch (mode) {
      case 'line':
      case 'polygon':
        return 'crosshair';
      case 'rectangle':
      case 'circle':
        return 'crosshair';
      case 'text':
        return 'text';
      case 'edit':
        return 'pointer';
      case 'drag':
        return 'move';
      case 'remove':
        return 'not-allowed';
      default:
        return 'default';
    }
  }

  enableDraw(mode: DrawingMode): void {
    this.disableDraw();
    this.currentMode = mode;

    if (mode !== 'none') {
      // Don't disable interactions - allow zoom/pan while drawing
      // Click events are handled separately from pan/zoom
      this.map.on('click', this.clickHandler!);
      this.map.on('mousemove', this.mouseMoveHandler!);
      this.map.on('dblclick', this.dblClickHandler!);
      this.map.on('contextmenu', this.contextMenuHandler!);
      window.addEventListener('keydown', this.keydownHandler!);
      this.setCursor(this.getCursorForMode(mode));
      this.createCursorTooltip();
      this.fire('drawing:start', { mode });
    }
  }

  disableDraw(): void {
    if (this.clickHandler) {
      this.map.off('click', this.clickHandler);
    }
    if (this.mouseMoveHandler) {
      this.map.off('mousemove', this.mouseMoveHandler);
    }
    if (this.dblClickHandler) {
      this.map.off('dblclick', this.dblClickHandler);
    }
    if (this.contextMenuHandler) {
      this.map.off('contextmenu', this.contextMenuHandler);
    }
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
    }

    // Clean up text input if active
    if (this.textInputElement) {
      this.finishTextInput();
    }

    this.resetCursor();
    this.removeCursorTooltip();
    // Clear vertex markers before finishing
    this.setActiveDrawingShape(null);
    this.finishCurrentDrawing();
    this.currentMode = 'none';
    this.isDrawing = false;
    this.temporaryPoints = [];
    this.currentShape = null;
  }

  getActiveShape(): DrawingMode {
    return this.currentMode;
  }

  setPathOptions(options: { color?: string; weight?: number }): void {
    if (options.color) this.options.defaultColor = options.color;
    if (options.weight) this.options.defaultSize = options.weight;
  }

  setTextOptions(options: { color?: string; size?: number }): void {
    if (options.color) this.options.textColor = options.color;
    if (options.size) this.options.textSize = options.size;
  }

  private handleMapClick(event: { latlng: LatLng; originalEvent: MouseEvent }): void {
    const { latlng, originalEvent } = event;

    switch (this.currentMode) {
      case 'line':
        this.handleLineClick(latlng, originalEvent);
        break;
      case 'rectangle':
        this.handleRectangleClick(latlng);
        break;
      case 'polygon':
        this.handlePolygonClick(latlng, originalEvent);
        break;
      case 'circle':
        this.handleCircleClick(latlng);
        break;
      case 'text':
        this.handleTextClick(latlng);
        break;
      default:
    }
  }

  private handleMapMouseMove(event: { latlng: LatLng; originalEvent: MouseEvent }): void {
    // Always update cursor tooltip position
    this.updateCursorTooltip(event.originalEvent.clientX, event.originalEvent.clientY);

    if (!this.isDrawing || !this.currentShape) return;

    const { latlng } = event;

    switch (this.currentMode) {
      case 'line':
        this.updateLinePreview(latlng);
        break;
      case 'polygon':
        this.updatePolygonPreview(latlng);
        break;
      case 'rectangle':
        this.updateRectanglePreview(latlng);
        break;
      case 'circle':
        this.updateCirclePreview(latlng);
        break;
    }
  }

  private handleMapDblClick(event: { latlng: LatLng; originalEvent: MouseEvent }): void {
    event.originalEvent.preventDefault();
    event.originalEvent.stopPropagation();

    // Double-click finishes line or polygon
    if (this.currentMode === 'line' || this.currentMode === 'polygon') {
      if (this.isDrawing && this.temporaryPoints.length >= 2) {
        // Remove the last preview point and finish
        if (this.currentShape && this.currentShape.positions) {
          this.currentShape.positions = [...this.temporaryPoints];
        }
        this.finishCurrentDrawing();
      }
    }
  }

  private handleContextMenu(event: { latlng: LatLng; originalEvent: MouseEvent }): void {
    event.originalEvent.preventDefault();
    event.originalEvent.stopPropagation();

    // Right-click cancels current drawing
    if (this.isDrawing && this.currentShape) {
      // Clear vertex markers
      this.setActiveDrawingShape(null);
      // Remove the temporary shape
      if (this.currentShape.id) {
        this.drawingLayer.removeShape(this.currentShape.id);
      }
      this.isDrawing = false;
      this.currentShape = null;
      this.temporaryPoints = [];
    }
  }

  private handleLineClick(latlng: LatLng, originalEvent: MouseEvent): void {
    if (!this.isDrawing) {
      // Start new line
      this.startDrawing();
      const id = this.generateId();
      this.currentShape = {
        id,
        type: 'line',
        positions: [latlng],
        color: this.options.defaultColor,
        size: this.options.defaultSize,
        mapName: '', // Will be set by consumer
      };
      this.temporaryPoints = [latlng];
      // Add the shape to the layer immediately
      this.updateTemporaryShape();
      // Set as active shape for vertex markers
      this.setActiveDrawingShape(id);
    } else {
      // Check if clicking on the last vertex to finish (like double-click)
      if (this.temporaryPoints.length >= 2 && this.isClickNearLastVertex(originalEvent)) {
        // Finish the line without adding the clicked point
        if (this.currentShape && this.currentShape.positions) {
          this.currentShape.positions = [...this.temporaryPoints];
        }
        this.finishCurrentDrawing();
        return;
      }

      // Add point to line
      this.temporaryPoints.push(latlng);
      if (this.currentShape && this.currentShape.positions) {
        this.currentShape.positions = [...this.temporaryPoints];
        this.updateTemporaryShape();
      }
    }
  }

  private handleRectangleClick(latlng: LatLng): void {
    if (!this.isDrawing) {
      // Start rectangle
      this.startDrawing();
      const id = this.generateId();
      this.currentShape = {
        id,
        type: 'rectangle',
        positions: [latlng, latlng],
        color: this.options.defaultColor,
        size: this.options.defaultSize,
        mapName: '',
      };
      this.temporaryPoints = [latlng];
      this.updateTemporaryShape();
      this.setActiveDrawingShape(id);
    } else {
      // Finish rectangle
      this.finishCurrentDrawing();
    }
  }

  private handlePolygonClick(latlng: LatLng, originalEvent: MouseEvent): void {
    if (!this.isDrawing) {
      // Start polygon
      this.startDrawing();
      const id = this.generateId();
      this.currentShape = {
        id,
        type: 'polygon',
        positions: [latlng],
        color: this.options.defaultColor,
        size: this.options.defaultSize,
        mapName: '',
      };
      this.temporaryPoints = [latlng];
      this.updateTemporaryShape();
      this.setActiveDrawingShape(id);
    } else {
      // Check if clicking on the last vertex to finish (need at least 3 points for polygon)
      if (this.temporaryPoints.length >= 3 && this.isClickNearLastVertex(originalEvent)) {
        // Finish the polygon without adding the clicked point
        if (this.currentShape && this.currentShape.positions) {
          this.currentShape.positions = [...this.temporaryPoints];
        }
        this.finishCurrentDrawing();
        return;
      }

      // Add point to polygon
      this.temporaryPoints.push(latlng);
      if (this.currentShape && this.currentShape.positions) {
        this.currentShape.positions = [...this.temporaryPoints];
        this.updateTemporaryShape();
      }
    }
  }

  private handleCircleClick(latlng: LatLng): void {
    if (!this.isDrawing) {
      // Start circle
      this.startDrawing();
      const id = this.generateId();
      this.currentShape = {
        id,
        type: 'circle',
        center: latlng,
        radius: 0,
        color: this.options.defaultColor,
        size: this.options.defaultSize,
        mapName: '',
      };
      this.updateTemporaryShape();
      this.setActiveDrawingShape(id);
    } else {
      // Finish circle
      this.finishCurrentDrawing();
    }
  }

  private handleTextClick(latlng: LatLng): void {
    // If already editing text, finish it first
    if (this.textInputElement) {
      this.finishTextInput();
    }

    this.currentTextPosition = latlng;

    // Create the text shape immediately
    const id = this.generateId();
    this.currentShape = {
      id,
      type: 'text',
      center: latlng,
      text: '',
      color: this.options.textColor,
      size: this.options.textSize,
      mapName: '',
    };
    this.isDrawing = true;

    // Add shape to layer
    this.drawingLayer.addShape(this.currentShape as DrawingShape);

    // Create text input on the map
    this.createTextInput(latlng);
  }

  private createTextInput(latlng: LatLng): void {
    if (!this.canvas) return;

    const state = this.map.getRenderState();
    if (!state) return;

    // Convert latlng to screen position
    const worldPos = state.projection(latlng);
    const view = state.viewMatrix;
    if (!view) return;

    const a = view[0], b = view[1];
    const c = view[3], d = view[4];
    const tx = view[6], ty = view[7];

    const clipX = a * worldPos.x + c * worldPos.y + tx;
    const clipY = b * worldPos.x + d * worldPos.y + ty;

    const rect = this.canvas.getBoundingClientRect();
    const screenX = (clipX * 0.5 + 0.5) * rect.width;
    const screenY = (1 - (clipY * 0.5 + 0.5)) * rect.height;

    // Create container for the input
    this.textInputContainer = document.createElement('div');
    this.textInputContainer.style.cssText = `
      position: absolute;
      left: ${screenX}px;
      top: ${screenY}px;
      transform: translate(-50%, -50%);
      z-index: 10001;
      pointer-events: auto;
    `;

    // Create the input element
    this.textInputElement = document.createElement('input');
    this.textInputElement.type = 'text';
    this.textInputElement.placeholder = 'Type text...';
    this.textInputElement.style.cssText = `
      font-size: ${this.options.textSize}px;
      font-family: system-ui, sans-serif;
      font-weight: bold;
      color: ${this.options.textColor};
      background: transparent;
      border: 1px dashed rgba(128, 128, 128, 0.5);
      border-radius: 4px;
      padding: 4px 8px;
      outline: none;
      text-align: center;
      min-width: 100px;
      caret-color: ${this.options.textColor};
    `;

    // Handle input events
    this.textInputElement.addEventListener('input', this.handleTextInputChange.bind(this));
    this.textInputElement.addEventListener('keydown', this.handleTextInputKeyDown.bind(this));
    this.textInputElement.addEventListener('blur', this.handleTextInputBlur.bind(this));

    this.textInputContainer.appendChild(this.textInputElement);
    this.canvas.parentElement?.appendChild(this.textInputContainer);

    // Focus the input
    this.textInputElement.focus();

    // Hide cursor tooltip while typing
    if (this.cursorTooltip) {
      this.cursorTooltip.style.display = 'none';
    }

    // Start animation loop to keep position in sync during zoom/pan
    this.startTextInputPositionLoop();
  }

  private startTextInputPositionLoop(): void {
    const updateLoop = () => {
      if (!this.textInputContainer || !this.currentTextPosition) return;

      this.updateTextInputPosition();
      this.textInputAnimationFrame = requestAnimationFrame(updateLoop);
    };
    this.textInputAnimationFrame = requestAnimationFrame(updateLoop);
  }

  private updateTextInputPosition(): void {
    if (!this.textInputContainer || !this.currentTextPosition || !this.canvas) return;

    const state = this.map.getRenderState();
    if (!state || !state.viewMatrix) return;

    const worldPos = state.projection(this.currentTextPosition);
    const view = state.viewMatrix;

    const a = view[0], b = view[1];
    const c = view[3], d = view[4];
    const tx = view[6], ty = view[7];

    const clipX = a * worldPos.x + c * worldPos.y + tx;
    const clipY = b * worldPos.x + d * worldPos.y + ty;

    const rect = this.canvas.getBoundingClientRect();
    const screenX = (clipX * 0.5 + 0.5) * rect.width;
    const screenY = (1 - (clipY * 0.5 + 0.5)) * rect.height;

    this.textInputContainer.style.left = `${screenX}px`;
    this.textInputContainer.style.top = `${screenY}px`;
  }

  private handleTextInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const text = input.value;

    // Update the shape with the current text
    if (this.currentShape && this.currentShape.id) {
      this.currentShape.text = text;
      this.drawingLayer.updateShape(this.currentShape.id, { text });
    }
  }

  private handleTextInputKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.finishTextInput();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.cancelTextInput();
    }
  }

  private handleTextInputBlur(): void {
    // Small delay to allow for map click to handle finishing first
    setTimeout(() => {
      if (this.textInputElement && !this.isFinishingText) {
        this.finishTextInput();
      }
    }, 50);
  }

  private finishTextInput(): void {
    if (!this.currentShape || !this.textInputElement || this.isFinishingText) return;

    this.isFinishingText = true;

    const text = this.textInputElement.value.trim();

    // Remove the input element
    this.removeTextInput();

    if (text) {
      // Update the final shape
      this.currentShape.text = text;
      this.drawingLayer.updateShape(this.currentShape.id!, { text });

      // Fire events
      const shape = this.currentShape as DrawingShape;
      this.fire('drawing:finish', { shape });
      this.fire('drawing:create', { shape });
    } else {
      // Remove empty text shape
      if (this.currentShape.id) {
        this.drawingLayer.removeShape(this.currentShape.id);
      }
    }

    this.isDrawing = false;
    this.currentShape = null;
    this.currentTextPosition = null;
    this.isFinishingText = false;
  }

  private cancelTextInput(): void {
    // Remove the shape
    if (this.currentShape?.id) {
      this.drawingLayer.removeShape(this.currentShape.id);
    }

    this.removeTextInput();
    this.isDrawing = false;
    this.currentShape = null;
    this.currentTextPosition = null;
  }

  private removeTextInput(): void {
    // Cancel animation frame
    if (this.textInputAnimationFrame) {
      cancelAnimationFrame(this.textInputAnimationFrame);
      this.textInputAnimationFrame = undefined;
    }

    if (this.textInputContainer && this.textInputContainer.parentNode) {
      this.textInputContainer.parentNode.removeChild(this.textInputContainer);
    }
    this.textInputContainer = null;
    this.textInputElement = null;
  }

  private updateRectanglePreview(latlng: LatLng): void {
    if (this.currentShape && this.temporaryPoints.length > 0) {
      this.currentShape.positions = [this.temporaryPoints[0], latlng];
      this.updateTemporaryShape();
    }
  }

  private updateLinePreview(latlng: LatLng): void {
    if (this.currentShape && this.temporaryPoints.length > 0) {
      // Show preview line extending to current mouse position
      this.currentShape.positions = [...this.temporaryPoints, latlng];
      this.updateTemporaryShape();
    }
  }

  private updatePolygonPreview(latlng: LatLng): void {
    if (this.currentShape && this.temporaryPoints.length > 0) {
      // Show preview polygon extending to current mouse position
      this.currentShape.positions = [...this.temporaryPoints, latlng];
      this.updateTemporaryShape();
    }
  }

  private updateCirclePreview(latlng: LatLng): void {
    if (this.currentShape && this.currentShape.center) {
      const [centerLat, centerLng] = this.currentShape.center;
      const [lat, lng] = latlng;
      const radius = Math.sqrt(
        Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2)
      );
      this.currentShape.radius = radius;
      this.updateTemporaryShape();
    }
  }

  private startDrawing(): void {
    this.isDrawing = true;
  }

  private setActiveDrawingShape(id: string | null): void {
    this.drawingLayer.setActiveShape(id);
  }

  private updateTemporaryShape(): void {
    if (this.currentShape && this.currentShape.id) {
      // Check if the shape already exists in the layer
      const existingShape = this.drawingLayer.getShape(this.currentShape.id);
      if (existingShape) {
        this.drawingLayer.updateShape(this.currentShape.id, this.currentShape);
      } else {
        this.drawingLayer.addShape(this.currentShape as DrawingShape);
      }
    } else if (this.currentShape) {
      this.drawingLayer.addShape(this.currentShape as DrawingShape);
    }
  }

  private finishCurrentDrawing(): void {
    if (this.currentShape && this.isDrawing) {
      const shape = this.currentShape as DrawingShape;

      // Clear vertex markers
      this.setActiveDrawingShape(null);

      // Validate shape before finishing
      if (this.isValidShape(shape)) {
        this.fire('drawing:finish', { shape });
        this.fire('drawing:create', { shape });
      } else {
        // Remove invalid shape
        if (shape.id) {
          this.drawingLayer.removeShape(shape.id);
        }
      }
    }

    this.isDrawing = false;
    this.currentShape = null;
    this.temporaryPoints = [];
  }

  private isValidShape(shape: DrawingShape): boolean {
    switch (shape.type) {
      case 'line':
        return (shape.positions?.length ?? 0) >= 2;
      case 'rectangle':
        return (shape.positions?.length ?? 0) >= 2;
      case 'polygon':
        return (shape.positions?.length ?? 0) >= 3;
      case 'circle':
        return (shape.radius ?? 0) > 0;
      case 'text':
        return !!shape.text && shape.text.length > 0;
      default:
        return false;
    }
  }

  finishLine(): void {
    if (this.currentMode === 'line' && this.isDrawing) {
      this.finishCurrentDrawing();
    }
  }

  finishPolygon(): void {
    if (this.currentMode === 'polygon' && this.isDrawing) {
      this.finishCurrentDrawing();
    }
  }

  // Shape management methods
  addShape(shape: DrawingShape): void {
    this.drawingLayer.addShape(shape);
  }

  removeShape(id: string): void {
    this.drawingLayer.removeShape(id);
    this.fire('drawing:remove', { id });
  }

  updateShape(id: string, updates: Partial<DrawingShape>): void {
    this.drawingLayer.updateShape(id, updates);
    const shape = this.drawingLayer.getShape(id);
    if (shape) {
      this.fire('drawing:edit', { shape });
    }
  }

  getShape(id: string): DrawingShape | undefined {
    return this.drawingLayer.getShape(id);
  }

  getAllShapes(): DrawingShape[] {
    return this.drawingLayer.getAllShapes();
  }

  clearShapes(): void {
    // Clear the drawing layer
    this.drawingLayer.clearShapes();

    // Reset internal drawing state
    this.currentShape = null;
    this.temporaryPoints = [];
    this.isDrawing = false;
  }

  // Event system
  on<K extends keyof DrawingManagerEventMap>(
    type: K,
    handler: EventHandler<DrawingManagerEventMap[K]>
  ): this {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type)!.push(handler);
    return this;
  }

  off<K extends keyof DrawingManagerEventMap>(
    type: K,
    handler?: EventHandler<DrawingManagerEventMap[K]>
  ): this {
    const handlers = this.eventHandlers.get(type);
    if (!handlers) return this;

    if (handler) {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    } else {
      this.eventHandlers.set(type, []);
    }
    return this;
  }

  private fire<K extends keyof DrawingManagerEventMap>(
    type: K,
    event: DrawingManagerEventMap[K]
  ): void {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (e) {
          console.error(`Error in ${type} event handler:`, e);
        }
      }
    }
  }

  private generateId(): string {
    return `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy(): void {
    this.disableDraw();
    this.removeCursorTooltip();
    this.removeTextInput();
    this.drawingLayer.destroy();
    this.eventHandlers.clear();
  }
}