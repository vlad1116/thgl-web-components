import { ActorPlayer } from "@repo/lib/overwolf";
import leaflet from "leaflet";

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

export class PlayerMarker extends leaflet.Marker {
  declare options: leaflet.MarkerOptions & {
    rotation: number;
    rotationOffset?: number;
  };
  private _icon: HTMLElement | undefined = undefined;
  private _lastRawRotation: number = 0;
  private _accumulatedSpins: number = 0;

  constructor(
    latLng: leaflet.LatLngExpression,
    options: leaflet.MarkerOptions & {
      rotation: number;
      rotationOffset?: number;
    },
  ) {
    super(latLng, options);
    this._lastRawRotation = options.rotation;
  }

  _setPos(pos: leaflet.Point): void {
    if (!this._icon) {
      return;
    }
    // Set transition only once, not on every position update
    // 500ms duration matches map pan duration for synchronized smooth movement
    if (!this._icon.style.transition) {
      this._icon.style.transition = "transform 0.5s linear";
      this._icon.style.transformOrigin = "center";
    }

    this._icon.style.transform = `translate3d(${pos.x}px,${pos.y}px,0) rotate(${this.options.rotation}deg)`;
    return;
  }

  updatePosition({ x, y, r }: ActorPlayer) {
    const latLng = this.getLatLng();
    const newLatLng = [x, y] as leaflet.LatLngTuple;

    // Only recalculate rotation when r actually changes
    if (r !== this._lastRawRotation) {
      // Check if we crossed the 180/-180 boundary
      const diff = r - this._lastRawRotation;
      if (diff > 180) {
        // Crossed from positive to negative (e.g., 170 -> -170)
        this._accumulatedSpins -= 1;
      } else if (diff < -180) {
        // Crossed from negative to positive (e.g., -170 -> 170)
        this._accumulatedSpins += 1;
      }

      // Calculate rotation with accumulated spins
      let playerRotation = r + 360 * this._accumulatedSpins;

      // Apply rotation offset if configured
      if (this.options.rotationOffset) {
        playerRotation += this.options.rotationOffset;
      }

      this.options.rotation = playerRotation;
      this._lastRawRotation = r;
    }

    // Update position if changed
    if (!latLng.equals(newLatLng)) {
      this.setLatLng(newLatLng);
    }
  }
}
