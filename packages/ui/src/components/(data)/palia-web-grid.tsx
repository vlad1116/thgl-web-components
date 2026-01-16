"use client";
import { useEffect, useRef } from "react";
import { GridLayer } from "@repo/lib/web-map";
import { useSettingsStore } from "@repo/lib";
import type { SimpleWebMapRef } from "../(interactive-map)/simple-webmap";

// Grid bounds for each Palia map
const villagePadding = ((-68999 - -59999) / 2) * 0.6;
const villageGrid = [
  [-68999 - villagePadding, -59999 - villagePadding],
  [52999 + villagePadding, 61999 + villagePadding],
] as [[number, number], [number, number]];

const bayPadding = ((-129947 - 31292.997999999992) / 2) * 0.05;
const bayGrid = [
  [-129947 - bayPadding, 31292.997999999992 - bayPadding],
  [30307.002000000008 + bayPadding, 191547 + bayPadding],
] as [[number, number], [number, number]];

const fairgroundsGrid = [
  [-23099 * 0.98, -22429 * 0.98],
  [28499 * 0.98, 29169 * 0.98],
] as [[number, number], [number, number]];

const housingGrid = [
  [-46349 * 0.955, -45999 * 0.955],
  [45649 * 0.955, 45999 * 0.955],
] as [[number, number], [number, number]];

const elderwoodPadding = ((-68999 - -59999) / 2) * 0.6;
const elderwoodGrid = [
  [-29989 - elderwoodPadding, -55068 - elderwoodPadding],
  [52008 + elderwoodPadding, 26929 + elderwoodPadding],
] as [[number, number], [number, number]];

const gridBoundsMap: Record<string, [[number, number], [number, number]]> = {
  VillageWorld: villageGrid,
  AdventureZoneWorld: bayGrid,
  MajiMarket: fairgroundsGrid,
  HousingPlot: housingGrid,
  AZ2_Root: elderwoodGrid,
};

export function PaliaWebGrid({
  mapName,
  mapRef,
  force,
}: {
  mapName: string;
  mapRef: React.MutableRefObject<SimpleWebMapRef | null>;
  force?: boolean;
}) {
  const showGrid = force || useSettingsStore((state) => state.showGrid);
  const gridLayerRef = useRef<GridLayer | null>(null);

  useEffect(() => {
    const ref = mapRef.current;
    if (!ref?.webmap || !showGrid) {
      return;
    }

    const bounds = gridBoundsMap[mapName];
    if (!bounds) {
      return;
    }

    const gridLayer = new GridLayer({
      bounds,
      divisions: 10,
      color: "#ffffff",
      opacity: 0.6,
      showLabels: true,
      labelOpacity: 0.9,
    });

    ref.webmap.addLayer(gridLayer, { zIndex: 30 });
    gridLayerRef.current = gridLayer;

    return () => {
      if (ref.webmap && gridLayerRef.current) {
        ref.webmap.removeLayer(gridLayerRef.current);
        gridLayerRef.current = null;
      }
    };
  }, [mapRef.current?.webmap, mapName, showGrid]);

  return null;
}
