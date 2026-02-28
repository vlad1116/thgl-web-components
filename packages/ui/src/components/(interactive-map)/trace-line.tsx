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
  const player = useGameState((state) => state.player);

  const layerRef = useRef<DrawingLayer | null>(null);
  const positionsRef = useRef<[number, number][]>([]);
  const frameCountRef = useRef(0);

  // Reset positions when settings change or map changes
  useEffect(() => {
    positionsRef.current = [];
  }, [map?.mapName, showTraceLine]);

  // Main effect: record positions and render line
  useEffect(() => {
    if (!map || !showTraceLine || !player) return;

    const isOnMap = !player.mapName || player.mapName === map.mapName;
    if (!isOnMap) return;

    // Rate limit: only record every N frames
    frameCountRef.current += 1;
    if (frameCountRef.current < traceLineRate) return;
    frameCountRef.current = 0;

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

    // Update the line shape
    layerRef.current.clearShapes();
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
  }, [map, player, showTraceLine, traceLineLength, traceLineRate, traceLineColor]);

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
