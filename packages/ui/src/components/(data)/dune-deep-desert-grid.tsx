"use client";
import { useMapStore } from "../(interactive-map)/store";
import { useEffect, useRef } from "react";
import { useT } from "../(providers)";
import { useSettingsStore } from "@repo/lib";
import { GridLayer, DrawingLayer } from "@repo/lib/web-map";

const deepDesertPadding = 0;
const deepDesertGrid = [
  [-1270399 - deepDesertPadding, -1270399 - deepDesertPadding],
  [1167999 + deepDesertPadding, 1167999 + deepDesertPadding],
] as [[number, number], [number, number]];

export function DuneDeepDesertGrid() {
  const t = useT();
  const map = useMapStore((state) => state.map);
  const lockedWindow = useSettingsStore((state) => state.lockedWindow);
  const gridLayerRef = useRef<GridLayer | null>(null);
  const pvpLayerRef = useRef<DrawingLayer | null>(null);

  useEffect(() => {
    if (!map) {
      return;
    }

    if (map.mapName !== "deepdesert_1") {
      return;
    }

    const gridLayer = new GridLayer({
      bounds: deepDesertGrid,
      divisions: 9,
      color: "#ffffff",
      opacity: 0.3,
      showLabels: true,
      labelOpacity: 0.9,
      labelFormatter: (row, col, divisions) =>
        `${String.fromCharCode(65 + divisions - 1 - col)}${row + 1}`,
    });

    map.addLayer(gridLayer, { zIndex: 30 });
    gridLayerRef.current = gridLayer;

    return () => {
      if (map && gridLayerRef.current) {
        map.removeLayer(gridLayerRef.current);
        gridLayerRef.current = null;
      }
    };
  }, [map]);

  // PvP danger zone: always shown on deep desert
  useEffect(() => {
    if (!map || map.mapName !== "deepdesert_1") return;

    const [minY, minX] = deepDesertGrid[0];
    const [maxY, maxX] = deepDesertGrid[1];
    const zoneSize = (maxY - minY) / 9;
    const pvpLineY = minY + 4.5 * zoneSize;

    if (!pvpLayerRef.current) {
      pvpLayerRef.current = new DrawingLayer({ interactive: false });
      map.addLayer(pvpLayerRef.current, { zIndex: 25 });
    }
    const layer = pvpLayerRef.current;
    layer.clearShapes();

    // Danger zone overlay (top half of the map)
    layer.addShape({
      id: "pvp-zone",
      type: "polygon",
      positions: [
        [minY, minX],
        [minY, maxX],
        [pvpLineY, maxX],
        [pvpLineY, minX],
      ],
      color: "#ff000000",
      fillColor: "#ff000018",
      size: 0,
      mapName: "deepdesert_1",
    });

    // PvP divider line
    layer.addShape({
      id: "pvp-line",
      type: "line",
      positions: [
        [pvpLineY, minX],
        [pvpLineY, maxX],
      ],
      color: "#ff0000AA",
      size: 2,
      mapName: "deepdesert_1",
    });

    return () => {
      if (map && pvpLayerRef.current) {
        map.removeLayer(pvpLayerRef.current);
        pvpLayerRef.current = null;
      }
    };
  }, [map]);

  if (lockedWindow) {
    return <></>;
  }
  if (map?.mapName === "deepdesert_1") {
    return (
      <div className="italic text-xs text-muted-foreground px-2.5 py-1 h-7">
        {t("dune.deepDesert.description")}
      </div>
    );
  }

  return <></>;
}
