export interface MarkerOptions {
  radius: number;
  playerIcon?: string;
  imageSprite?: boolean;
  zPos?: {
    xyMaxDistance: number;
    zDistance: number;
  };
  /**
   * Template string for coordinate copy format.
   * Placeholders: {x}, {y}, {z}
   * Example: "({x},{y})" produces "(123,456)"
   * Default: "[{x}, {y}]" or "[{x}, {y}, {z}]" for 3D
   */
  coordinateCopyFormat?: string;
}
