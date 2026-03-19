import type { ActorPlayer } from "@repo/lib/overwolf";
import type { IconMarkerLayer, IconMarkerInstance } from "@repo/lib/web-map";

const SCALE = 0.083492;
const DEG_45 = Math.PI / 4; // 45 degrees in radians
const OFFSET = {
  x: 113.2,
  y: -227.4,
};

export const normalizePoint = ({
  x,
  y,
  z,
}: {
  x: number;
  y: number;
  z: number;
}) => {
  const scaledX = x * SCALE;
  const scaledY = y * SCALE;
  const rotatedX = scaledX * Math.cos(DEG_45) - scaledY * Math.sin(DEG_45);
  const rotatedY = scaledX * Math.sin(DEG_45) + scaledY * Math.cos(DEG_45);
  return {
    x: (-rotatedX + OFFSET.x) / 1.65,
    y: (-rotatedY + OFFSET.y) / 1.65,
    z,
  };
};

export interface PlayerMarkerOptions {
  id: string;
  rotation: number;
  rotationOffset?: number;
  size: number;
  iconUrl?: string;
}

/**
 * Player marker for WebMap - manages a player icon marker instance
 */
export class PlayerMarker {
  private _id: string;
  private _latLng: [number, number] = [0, 0];
  private _rotation: number = 0;
  private _rotationOffset: number = 0;
  private _size: number;
  private _lastRawRotation: number = 0;
  private _accumulatedSpins: number = 0;
  private _markerLayer: IconMarkerLayer | null = null;
  private _iconUrl?: string;
  private _iconSheet?: HTMLCanvasElement;
  private _iconWidth: number = 36;
  private _iconHeight: number = 36;
  private _targetRotation: number = 0;
  private _displayRotation: number = 0;
  private _animRaf: number = 0;
  private _lastAnimTs: number = 0;

  constructor(
    latLng: [number, number],
    options: PlayerMarkerOptions,
  ) {
    this._id = options.id;
    this._latLng = latLng;
    this._rotation = options.rotation;
    this._rotationOffset = options.rotationOffset ?? 0;
    this._displayRotation = options.rotation;
    this._targetRotation = options.rotation;
    this._size = options.size;
    this._lastRawRotation = options.rotation;
    this._iconUrl = options.iconUrl;
  }

  get id(): string {
    return this._id;
  }

  getLatLng(): [number, number] {
    return this._latLng;
  }

  setLatLng(latLng: [number, number]) {
    this._latLng = latLng;
    this._updateMarker();
  }

  getRotation(): number {
    return this._rotation;
  }

  setSize(size: number) {
    this._size = size;
    this._updateMarker();
  }

  /**
   * Set the icon image for the player marker.
   * Adds padding to prevent WebGL bilinear filtering bleed at edges.
   */
  setIcon(image: HTMLImageElement) {
    const pad = 4;
    const w = image.naturalWidth || image.width;
    const h = image.naturalHeight || image.height;
    const canvas = document.createElement("canvas");
    canvas.width = w + pad * 2;
    canvas.height = h + pad * 2;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(image, pad, pad);
    }
    this._iconSheet = canvas;
    this._iconWidth = canvas.width;
    this._iconHeight = canvas.height;
    if (this._markerLayer) {
      this._markerLayer.setSheet("player", canvas);
    }
    this._updateMarker();
  }

  /**
   * Add this marker to a marker layer
   */
  addTo(markerLayer: IconMarkerLayer) {
    this._markerLayer = markerLayer;

    // Set up the player icon sheet if we have one
    if (this._iconSheet) {
      markerLayer.setSheet("player", this._iconSheet);
    }

    // Add the marker instance
    const instance = this._createInstance();
    markerLayer.add(instance);
  }

  /**
   * Remove this marker from its layer
   */
  remove() {
    if (this._animRaf) {
      cancelAnimationFrame(this._animRaf);
      this._animRaf = 0;
    }
    if (this._markerLayer) {
      this._markerLayer.remove(this._id);
      this._markerLayer = null;
    }
  }

  /**
   * Update player position and rotation
   */
  updatePosition({ x, y, r }: ActorPlayer) {
    // Only recalculate rotation when r actually changes
    if (r !== this._lastRawRotation) {
      // Check if we crossed the 180/-180 boundary
      const diff = r - this._lastRawRotation;
      if (diff > 180) {
        this._accumulatedSpins -= 1;
      } else if (diff < -180) {
        this._accumulatedSpins += 1;
      }

      let playerRotation = r + 360 * this._accumulatedSpins;
      if (this._rotationOffset) {
        playerRotation += this._rotationOffset;
      }

      this._targetRotation = playerRotation;
      this._lastRawRotation = r;
      this._startRotationAnim();
    }

    // Update position
    const newLatLng: [number, number] = [x, y];
    if (this._latLng[0] !== newLatLng[0] || this._latLng[1] !== newLatLng[1]) {
      this._latLng = newLatLng;
    }

    this._updateMarker();
  }

  private _startRotationAnim() {
    if (this._animRaf) return; // Already running
    this._lastAnimTs = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(100, now - this._lastAnimTs);
      this._lastAnimTs = now;
      const alpha = 1 - Math.exp(-dt / 100); // ~100ms smoothing
      const diff = this._targetRotation - this._displayRotation;
      if (Math.abs(diff) < 0.1) {
        this._displayRotation = this._targetRotation;
        this._rotation = this._displayRotation;
        this._animRaf = 0;
        this._updateMarker();
        return;
      }
      this._displayRotation += diff * alpha;
      this._rotation = this._displayRotation;
      this._updateMarker();
      this._animRaf = requestAnimationFrame(tick);
    };
    this._animRaf = requestAnimationFrame(tick);
  }

  /**
   * Create an IconMarkerInstance for this player
   */
  private _createInstance(): IconMarkerInstance {
    const dpr = window.devicePixelRatio || 1;
    return {
      id: this._id,
      latLng: this._latLng,
      size: this._size * dpr,
      sheet: "player",
      rect: { x: 0, y: 0, width: this._iconWidth, height: this._iconHeight },
      rotation: (this._rotation * Math.PI) / 180, // Convert to radians
      keepUpright: true, // Player icon should always face up
      isHighlighted: false,
      alwaysOnTop: true,
    };
  }

  /**
   * Update the marker in the layer
   */
  private _updateMarker() {
    if (!this._markerLayer) return;

    const dpr = window.devicePixelRatio || 1;
    this._markerLayer.updateMarker(this._id, {
      latLng: this._latLng,
      size: this._size * dpr,
      rect: { x: 0, y: 0, width: this._iconWidth, height: this._iconHeight },
      rotation: (this._rotation * Math.PI) / 180,
    });
  }
}
