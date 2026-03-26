export interface MarkerOptions {
  radius: number;
  playerIcon: string;
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
  /**
   * Round coordinates to this precision when clustering spawns.
   * Spawns within this distance will be grouped into a single marker.
   * Default: 0 (exact coordinate match)
   */
  clusterPrecision?: number;
}
