"use client";

import type { TilesConfig } from "@repo/lib";
import { cn, getAppUrl, useSettingsStore, useUserStore } from "@repo/lib";
import {
  WebMap,
  TileLayer,
  createAffineProjection,
  IconMarkerLayer,
} from "@repo/lib/web-map";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMapStore, type GameMap } from "./store";
import { ContextMenu } from "./context-menu";
import { useT } from "../(providers)";

// Extended ref to hold WebMap layers
interface MapRefs {
  webmap: WebMap | null;
  tileLayer: TileLayer | null;
  markerLayer: IconMarkerLayer | null;
  canvas: HTMLCanvasElement | null;
}

export function InteractiveMap({
  appTitle,
  appName,
  tileOptions,
  isOverlay = false,
  domain,
}: {
  appTitle: string;
  appName: string;
  tileOptions: TilesConfig;
  isOverlay?: boolean;
  domain: string;
}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRefsRef = useRef<MapRefs>({
    webmap: null,
    tileLayer: null,
    markerLayer: null,
    canvas: null,
  });
  const { map, setMap } = useMapStore();
  const isHydrated = useUserStore((state) => state._hasHydrated);
  const mapFilter = useSettingsStore((state) => state.mapFilter);
  const mapName = useUserStore((state) => state.mapName);
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity,
  );
  const t = useT();

  const mapTileOptions = tileOptions[mapName];

  const [contextMenuData, setContextMenuData] = useState<{
    x: number;
    y: number;
    p: [number, number];
  } | null>(null);

  // Initialize WebMap
  useLayoutEffect(() => {
    if (!isHydrated || !mapTileOptions) {
      return;
    }
    if (!containerRef.current) {
      throw new Error("Map ref is not defined");
    }

    const { viewByMap, setViewByMap } = useUserStore.getState();
    const view = viewByMap[mapName] ?? {};

    document.title = t("map.pageTitle", {
      vars: { title: appTitle, map: t(mapName) },
    });

    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    containerRef.current.appendChild(canvas);
    mapRefsRef.current.canvas = canvas;

    // Create projection if transformation is specified
    const projection = mapTileOptions.transformation
      ? createAffineProjection({
          a: mapTileOptions.transformation[0],
          b: mapTileOptions.transformation[1],
          c: mapTileOptions.transformation[2],
          d: mapTileOptions.transformation[3],
        })
      : undefined;

    // Calculate initial view
    const minZoom = mapTileOptions.minZoom ?? 0;
    const maxZoom = mapTileOptions.maxZoom ?? 10;
    let center: [number, number] = [0, 0];
    let zoom = minZoom;

    // Helper to calculate zoom that fits bounds
    const calculateFitZoom = (
      bounds: [[number, number], [number, number]],
      containerWidth: number,
      containerHeight: number,
    ): number => {
      const [[lat1, lng1], [lat2, lng2]] = bounds;
      const proj = projection ?? {
        project: (ll: [number, number], z: number) => ({
          x: ll[1] * Math.pow(2, z),
          y: ll[0] * Math.pow(2, z),
        }),
      };

      const refZoom = 0;
      const p1 = proj.project([lat1, lng1], refZoom);
      const p2 = proj.project([lat2, lng2], refZoom);

      const boundsWidth = Math.abs(p2.x - p1.x);
      const boundsHeight = Math.abs(p2.y - p1.y);

      if (boundsWidth === 0 || boundsHeight === 0) {
        return minZoom;
      }

      const scaleX = containerWidth / boundsWidth;
      const scaleY = containerHeight / boundsHeight;
      const scale = Math.min(scaleX, scaleY);
      const calculatedZoom = refZoom + Math.log2(scale);

      return Math.max(minZoom, Math.min(maxZoom, calculatedZoom));
    };

    // Determine initial view
    if (view.center) {
      center = view.center;
      zoom = view.zoom ?? zoom;
    } else if (mapTileOptions.fitBounds) {
      const [[lat1, lng1], [lat2, lng2]] = mapTileOptions.fitBounds;
      center = [(lat1 + lat2) / 2, (lng1 + lng2) / 2];
      const containerWidth = containerRef.current.clientWidth || 300;
      const containerHeight = containerRef.current.clientHeight || 200;
      zoom = calculateFitZoom(
        mapTileOptions.fitBounds,
        containerWidth,
        containerHeight,
      );
    } else if (mapTileOptions.view?.center) {
      center = mapTileOptions.view.center;
      zoom = mapTileOptions.view.zoom ?? zoom;
    }

    // Create WebMap instance
    const webmap = new WebMap({
      canvas,
      center,
      zoom,
      minZoom,
      maxZoom,
      projection,
    });
    mapRefsRef.current.webmap = webmap;

    // Create and add marker layer
    const markerLayer = new IconMarkerLayer();
    markerLayer.setColorBlindMode(colorBlindMode);
    markerLayer.setColorBlindSeverity(colorBlindSeverity);
    webmap.addLayer(markerLayer, { zIndex: 100 });
    mapRefsRef.current.markerLayer = markerLayer;

    // Create GameMap by extending WebMap with game-specific properties
    const gameMap = webmap as GameMap;
    gameMap.mapName = mapName;
    gameMap.bounds = mapTileOptions.options?.bounds ?? [
      [0, 0],
      [0, 0],
    ];
    gameMap.markerLayer = markerLayer;

    // Apply rotation if specified (store on map instance for coordinate transforms)
    if (mapTileOptions.rotation) {
      gameMap.rotationDegrees = mapTileOptions.rotation.angle;
      gameMap.rotationRadians = (mapTileOptions.rotation.angle * Math.PI) / 180;
      gameMap.rotationCenter = mapTileOptions.rotation.center;
      // Legacy aliases for backward compatibility
      gameMap._rotationDegrees = mapTileOptions.rotation.angle;
      gameMap._rotationRadians = (mapTileOptions.rotation.angle * Math.PI) / 180;
      gameMap._rotationCenter = mapTileOptions.rotation.center;
    }
    // Legacy alias for canvas (used in markers.tsx)
    gameMap._mapPane = canvas;

    // Set map in store
    setMap(gameMap);

    // Save initial view
    const mapCenter = webmap.getCenter();
    setViewByMap(mapName, [mapCenter.lat, mapCenter.lng], webmap.getZoom());

    // Handle context menu
    webmap.on("contextmenu", (event) => {
      if (location.href.includes("embed")) {
        return;
      }
      setContextMenuData({
        x: event.layerPoint.x,
        y: event.layerPoint.y,
        p: [event.latlng[0], event.latlng[1]],
      });
    });

    // Save view on move (debounced)
    let timeoutId: NodeJS.Timeout | null = null;
    webmap.on("moveend", () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        const c = webmap.getCenter();
        setViewByMap(mapName, [c.lat, c.lng], webmap.getZoom());
      }, 3000);
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setMap(null);
      webmap.destroy();
      if (
        containerRef.current &&
        canvas.parentNode === containerRef.current
      ) {
        containerRef.current.removeChild(canvas);
      }
      mapRefsRef.current = {
        webmap: null,
        tileLayer: null,
        markerLayer: null,
        canvas: null,
      };
    };
  }, [isHydrated, mapTileOptions?.url, mapName]);

  // Add/update tile layer
  useEffect(() => {
    const webmap = mapRefsRef.current.webmap;
    if (!webmap || !mapTileOptions?.url) {
      return;
    }
    // Skip tile layer for overlay mode with full filter
    if (isOverlay && mapFilter === "full") {
      return;
    }

    // Remove existing tile layer if any
    if (mapRefsRef.current.tileLayer) {
      webmap.removeLayer(mapRefsRef.current.tileLayer);
      mapRefsRef.current.tileLayer = null;
    }

    const url = getAppUrl(appName, mapTileOptions.url);

    const tileLayer = new TileLayer({
      url,
      tileSize: mapTileOptions.options?.tileSize ?? 256,
      minNativeZoom: mapTileOptions.options?.minNativeZoom,
      maxNativeZoom: mapTileOptions.options?.maxNativeZoom,
      bounds: mapTileOptions.options?.bounds,
      transformation: mapTileOptions.transformation,
      colorBlind:
        colorBlindMode !== "none"
          ? { mode: colorBlindMode, severity: colorBlindSeverity }
          : null,
    });

    webmap.addLayer(tileLayer, { zIndex: 0 });
    mapRefsRef.current.tileLayer = tileLayer;

    return () => {
      if (mapRefsRef.current.webmap && mapRefsRef.current.tileLayer) {
        mapRefsRef.current.webmap.removeLayer(mapRefsRef.current.tileLayer);
        mapRefsRef.current.tileLayer = null;
      }
    };
  }, [map, mapTileOptions, colorBlindMode, colorBlindSeverity, isOverlay, mapFilter]);

  // Update color blind mode on marker layer
  useEffect(() => {
    if (mapRefsRef.current.markerLayer) {
      mapRefsRef.current.markerLayer.setColorBlindMode(colorBlindMode);
      mapRefsRef.current.markerLayer.setColorBlindSeverity(colorBlindSeverity);
    }
  }, [colorBlindMode, colorBlindSeverity]);

  return (
    <>
      <div
        className={cn(`h-full !bg-inherit outline-none relative`)}
        ref={containerRef}
      />
      <ContextMenu
        domain={domain}
        contextMenuData={contextMenuData}
        onClose={() => setContextMenuData(null)}
      />
    </>
  );
}
