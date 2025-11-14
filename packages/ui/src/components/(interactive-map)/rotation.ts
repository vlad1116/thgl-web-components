/**
 * Map rotation utilities for rotating marker coordinates
 *
 * Tiles are displayed without rotation.
 * Only marker positions (spawns, player, teammates) are rotated.
 */

import type { LeafletMap } from "./store";

/**
 * Rotate a coordinate around a center point
 * @param coord - [lat, lng] coordinate to rotate
 * @param angleDegrees - Rotation angle in degrees
 * @param center - [lat, lng] center point to rotate around
 * @returns Rotated [lat, lng] coordinate
 */
export function rotateCoordinate(
  coord: [number, number],
  angleDegrees: number,
  center: [number, number],
): [number, number] {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  // Translate to origin
  const x = coord[1] - center[1]; // lng
  const y = coord[0] - center[0]; // lat

  // Rotate
  const rotatedX = x * cos - y * sin;
  const rotatedY = x * sin + y * cos;

  // Translate back
  return [
    rotatedY + center[0], // lat
    rotatedX + center[1], // lng
  ];
}

/**
 * Inverse rotate a coordinate (from rotated back to original)
 * Used when saving user-placed coordinates that need to be stored in original coordinate system
 * @param coord - [lat, lng] rotated coordinate to inverse rotate
 * @param angleDegrees - Original rotation angle in degrees
 * @param center - [lat, lng] center point to rotate around
 * @returns Original (unrotated) [lat, lng] coordinate
 */
export function inverseRotateCoordinate(
  coord: [number, number],
  angleDegrees: number,
  center: [number, number],
): [number, number] {
  // Inverse rotation is just rotating by negative angle
  return rotateCoordinate(coord, -angleDegrees, center);
}

/**
 * Store rotation info on map instance for easy access
 */
export function setupMapRotation(
  map: LeafletMap,
  rotation: { angle: number; center: [number, number] },
) {
  map._rotationDegrees = rotation.angle;
  map._rotationRadians = (rotation.angle * Math.PI) / 180;
  map._rotationCenter = rotation.center;
}
