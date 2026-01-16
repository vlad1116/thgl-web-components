import type { WebMap } from "@repo/lib/web-map";
import { create } from "zustand";

import type { IconMarkerLayer } from "@repo/lib/web-map";

// Game-specific map extensions (attached to WebMap instance at runtime)
export interface GameMapExtensions {
  mapName: string;
  bounds: [[number, number], [number, number]];
  rotationRadians?: number;
  rotationDegrees?: number;
  rotationCenter?: [number, number];
  // Marker layer reference for use by Markers component
  markerLayer?: IconMarkerLayer;
  // Legacy aliases for backward compatibility during migration
  _rotationRadians?: number;
  _rotationDegrees?: number;
  _rotationCenter?: [number, number];
  _mapPane?: HTMLElement;
}

// Combined type: WebMap + game-specific properties
export type GameMap = WebMap & GameMapExtensions;

// Legacy alias for compatibility during migration
export type LeafletMap = GameMap;

export const useMapStore = create<{
  map: GameMap | null;
  setMap: (map: GameMap | null) => void;
}>((set) => ({
  map: null,
  setMap: (map) => {
    set({ map });
  },
}));

export function useMap(): GameMap | null {
  return useMapStore((store) => store.map);
}
