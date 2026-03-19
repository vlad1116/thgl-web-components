"use client";

import { useEffect, useRef } from "react";
import { useMap } from "./store";
import { rotateCoordinate } from "./rotation";
import { useSettingsStore, useGameState } from "@repo/lib";
import { DrawingLayer } from "@repo/lib/web-map";

export function TraceLine() {
  const map = useMap();
  const showTraceLine = useSettingsStore((state) => state.showTraceLine);
  const traceLineLength = useSettingsStore((state) => state.traceLineLength);
  const traceLineRate = useSettingsStore((state) => state.traceLineRate);
  const traceLineColor = useSettingsStore((state) => state.traceLineColor);
  const traceLineStyle = useSettingsStore((state) => state.traceLineStyle);
  const player = useGameState((state) => state.player);

  const layerRef = useRef<DrawingLayer | null>(null);
  const positionsRef = useRef<[number, number][]>([]);
  const updateCountRef = useRef(0);
  const lastPlayerPosRef = useRef<string>("");

  // Reset positions and clear shapes when toggled off or map changes
  useEffect(() => {
    positionsRef.current = [];
    if (layerRef.current) {
      layerRef.current.clearShapes();
    }
  }, [map?.mapName, showTraceLine]);

  // Main effect: record positions and render line
  useEffect(() => {
    if (!map || !showTraceLine || !player) return;

    const isOnMap = !player.mapName || player.mapName === map.mapName;
    if (!isOnMap) return;

    // Only count actual player position changes for rate limiting
    const posKey = `${player.x},${player.y}`;
    if (posKey === lastPlayerPosRef.current) return;
    lastPlayerPosRef.current = posKey;

    updateCountRef.current += 1;
    if (updateCountRef.current < traceLineRate) return;
    updateCountRef.current = 0;

    // Apply rotation to player position if configured
    let playerPosition: [number, number] = [player.x, player.y];
    const rotationDegrees = map._rotationDegrees;
    const rotationCenter = map._rotationCenter;
    if (rotationDegrees && rotationCenter) {
      playerPosition = rotateCoordinate(
        [player.x, player.y],
        rotationDegrees,
        rotationCenter,
      );
    }

    // Add new position
    const positions = positionsRef.current;
    positions.push(playerPosition);

    // Cap at max length
    while (positions.length > traceLineLength) {
      positions.shift();
    }

    // Create layer if needed
    if (!layerRef.current) {
      layerRef.current = new DrawingLayer({ interactive: false });
      map.addLayer(layerRef.current, { zIndex: 30 });
    }

    // Update trace shapes
    layerRef.current.clearShapes();
    if (traceLineStyle === "line") {
      if (positions.length >= 2) {
        layerRef.current.addShape({
          id: "trace-line",
          type: "line",
          positions: [...positions],
          color: traceLineColor,
          size: 3,
          mapName: map.mapName,
        });
      }
    } else {
      // Dots mode — render each position as a small filled circle
      // Scale radius so dots appear as consistent ~4px circles on screen
      const dotRadius = 4 / Math.pow(2, map.getZoom());
      for (let i = 0; i < positions.length; i++) {
        layerRef.current.addShape({
          id: `trace-dot-${i}`,
          type: "circle",
          center: positions[i],
          radius: dotRadius,
          fillColor: traceLineColor,
          color: traceLineColor,
          size: 1,
          mapName: map.mapName,
        });
      }
    }
  }, [map, player, showTraceLine, traceLineLength, traceLineRate, traceLineColor, traceLineStyle]);

  // Cleanup on unmount or when disabled
  useEffect(() => {
    return () => {
      if (layerRef.current && map) {
        layerRef.current.clearShapes();
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map]);

  return null;
}
