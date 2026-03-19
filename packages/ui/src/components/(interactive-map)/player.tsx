"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMap } from "./store";
import { PlayerMarker } from "./player-marker";
import { rotateCoordinate } from "./rotation";
import type { ActorPlayer } from "@repo/lib/overwolf";
import {
  getIconsUrl,
  MarkerOptions,
  TilesConfig,
  useUserStore,
} from "@repo/lib";
import { useSettingsStore } from "@repo/lib";
import { useT } from "../(providers)";
import { applyColorBlindTransform } from "./color-blind";
import type { ColorBlindMode } from "@repo/lib";
import { DrawingLayer } from "@repo/lib/web-map";


export function Player({
  appName,
  player,
  markerOptions,
  iconsPath,
  tilesConfig,
}: {
  appName: string;
  player: ActorPlayer;
  markerOptions: MarkerOptions;
  iconsPath: string;
  tilesConfig: TilesConfig;
}): JSX.Element {
  const map = useMap();
  const marker = useRef<PlayerMarker | null>(null);
  const followPlayerPosition = useSettingsStore((state) => state.followPlayer);
  const setMapName = useUserStore((state) => state.setMapName);
  const t = useT();
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const playerIconSize = useSettingsStore((state) => state.playerIconSize);
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity,
  );

  // Memoize icon URL and size to avoid recalculating on every render
  const iconUrl = useMemo(() => {
    const iconName = markerOptions.playerIcon
      ? `/icons/${markerOptions.playerIcon}`
      : "https://th.gl/global_icons/player.png";
    return getIconsUrl(appName, iconName, iconsPath);
  }, [appName, markerOptions.playerIcon, iconsPath]);

  const iconSize = useMemo(
    () => [
      36 * baseIconSize * playerIconSize,
      36 * baseIconSize * playerIconSize,
    ],
    [baseIconSize, playerIconSize],
  );

  const iconImageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  async function buildIconImage(
    iconUrl: string,
    mode: ColorBlindMode,
    severity: number,
  ): Promise<HTMLImageElement> {
    const cacheKey = `${iconUrl}:${mode}:${severity.toFixed(2)}`;
    const cached = iconImageCache.current.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Load the source image
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("player-icon-load"));
      image.src = iconUrl;
    });

    // If no color blind transform needed, return original
    if (mode === "none" || severity <= 0) {
      iconImageCache.current.set(cacheKey, img);
      return img;
    }

    // Apply color blind transform
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyColorBlindTransform(
      imageData.data,
      mode as Exclude<ColorBlindMode, "none">,
      severity,
    );
    ctx.putImageData(imageData, 0, 0);

    // Create a new image from the processed canvas
    const processedImg = await new Promise<HTMLImageElement>(
      (resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("player-icon-process"));
        image.src = canvas.toDataURL();
      },
    );

    iconImageCache.current.set(cacheKey, processedImg);
    return processedImg;
  }

  useEffect(() => {
    if (!map?.mapName || !map.markerLayer) {
      return;
    }

    const isOnMap = !player.mapName || player.mapName === map.mapName;
    if (!isOnMap) {
      return;
    }

    const run = async () => {
      const iconImage = await buildIconImage(
        iconUrl,
        colorBlindMode,
        colorBlindSeverity,
      );

      const tile = tilesConfig[map.mapName];
      const rotationOffset = tile?.rotation?.angle;

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

      // Calculate pixel size
      const size = Math.max(10, Math.round(iconSize[0]));

      if (!marker.current) {
        marker.current = new PlayerMarker(playerPosition, {
          id: "player",
          rotation: player.r,
          rotationOffset,
          size,
        });
        marker.current.setIcon(iconImage);
        marker.current.addTo(map.markerLayer!);
      } else {
        marker.current.setIcon(iconImage);
        marker.current.setSize(size);
        // Create a modified player object with rotated coordinates
        marker.current.updatePosition({
          ...player,
          x: playerPosition[0],
          y: playerPosition[1],
        });
      }

      // Pan to player position
      map.setCenter(playerPosition);
    };

    run();

    return () => {
      marker.current?.remove();
      marker.current = null;
    };
  }, [map?.mapName, player?.mapName]);

  // Update icon when size or color-blind mode changes
  useEffect(() => {
    if (!marker.current) return;
    const run = async () => {
      const iconImage = await buildIconImage(
        iconUrl,
        colorBlindMode,
        colorBlindSeverity,
      );
      marker.current?.setIcon(iconImage);
      const size = Math.max(10, Math.round(iconSize[0]));
      marker.current?.setSize(size);
    };
    run();
  }, [iconUrl, iconSize, colorBlindMode, colorBlindSeverity]);

  // Use rAF to coalesce position updates into a single frame update.
  // This prevents effects from piling up when multiple player positions
  // arrive within the same animation frame.
  const latestPlayerRef = useRef(player);
  const rafRef = useRef<number>(0);
  const lastPanTimeRef = useRef<number>(0);
  latestPlayerRef.current = player;

  // Interval between panTo calls. Each panTo animation runs for this duration,
  // ensuring it completes before the next one starts. During animation, Leaflet
  // moves the canvas via CSS (GPU-accelerated) without redrawing markers.
  // Canvas markers only redraw once on moveend (~5 redraws/sec instead of ~60).
  const PAN_INTERVAL = 200;

  useEffect(() => {
    if (!map?.mapName || !player || !marker.current) {
      return;
    }

    // Cancel any pending rAF to prevent piling up
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      // Always read the latest player position (coalesces multiple updates)
      const p = latestPlayerRef.current;
      if (!p || !marker.current) return;

      // Apply rotation to player position if configured
      let playerPosition: [number, number] = [p.x, p.y];
      const rotationDegrees = map._rotationDegrees;
      const rotationCenter = map._rotationCenter;
      if (rotationDegrees && rotationCenter) {
        playerPosition = rotateCoordinate(
          [p.x, p.y],
          rotationDegrees,
          rotationCenter,
        );
      }

      // Always update player marker position (DOM marker with CSS transition, cheap)
      marker.current.updatePosition({
        ...p,
        x: playerPosition[0],
        y: playerPosition[1],
      });

      const isOnMap = !p.mapName || p.mapName === map.mapName;
      if (!isOnMap) {
        return;
      }

      if (followPlayerPosition) {
        // Smoothly pan to player position
        map.panTo(playerPosition);
      }
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [map?.mapName, player, followPlayerPosition]);

  useEffect(() => {
    if (!player?.mapName || !map) {
      return;
    }
    // Use 'in' operator for efficient object property check instead of Object.keys
    if (!(player.mapName in tilesConfig)) {
      return;
    }
    if (player.mapName !== map.mapName) {
      console.log("Setting map name", player.mapName);
      setMapName(player.mapName, [player.x, player.y], map.getZoom());
      if (location.pathname.includes("/maps/")) {
        window.history.pushState({}, "", `/maps/${t(player.mapName)}`);
      }
    }
  }, [player?.mapName]);

  // Audio alert range circle
  const showAudioAlertRange = useSettingsStore(
    (state) => state.showAudioAlertRange,
  );
  const audioAlertRange = useSettingsStore((state) => state.audioAlertRange);
  const audioAlertsMuted = useSettingsStore((state) => state.audioAlertsMuted);
  const alertCircleLayerRef = useRef<DrawingLayer | null>(null);
  const alertCircleRafRef = useRef<number>(0);
  const alertCircleTargetRef = useRef<[number, number] | null>(null);
  const alertCircleDisplayRef = useRef<[number, number] | null>(null);

  // Set up / tear down range circle layer
  useEffect(() => {
    if (!map) return;
    const shouldShow = showAudioAlertRange && !audioAlertsMuted;
    if (!shouldShow) {
      if (alertCircleLayerRef.current) {
        alertCircleLayerRef.current.clearShapes();
        map.removeLayer(alertCircleLayerRef.current);
        alertCircleLayerRef.current = null;
      }
      if (alertCircleRafRef.current) {
        cancelAnimationFrame(alertCircleRafRef.current);
        alertCircleRafRef.current = 0;
      }
      return;
    }
    if (!alertCircleLayerRef.current) {
      alertCircleLayerRef.current = new DrawingLayer({ interactive: false });
      map.addLayer(alertCircleLayerRef.current, { zIndex: 90 });
    }
    return () => {
      if (alertCircleRafRef.current) {
        cancelAnimationFrame(alertCircleRafRef.current);
        alertCircleRafRef.current = 0;
      }
      if (alertCircleLayerRef.current) {
        alertCircleLayerRef.current.clearShapes();
        map.removeLayer(alertCircleLayerRef.current);
        alertCircleLayerRef.current = null;
      }
    };
  }, [map, showAudioAlertRange, audioAlertsMuted]);

  // Update range circle position with smooth interpolation
  useEffect(() => {
    if (!map || !player || !showAudioAlertRange || audioAlertsMuted) return;
    const isOnMap = !player.mapName || player.mapName === map.mapName;
    if (!isOnMap) return;

    let pos: [number, number] = [player.x, player.y];
    const rotationDegrees = map._rotationDegrees;
    const rotationCenter = map._rotationCenter;
    if (rotationDegrees && rotationCenter) {
      pos = rotateCoordinate([player.x, player.y], rotationDegrees, rotationCenter);
    }
    alertCircleTargetRef.current = pos;
    if (!alertCircleDisplayRef.current) {
      alertCircleDisplayRef.current = [...pos] as [number, number];
    }

    // Start animation loop if not running
    if (alertCircleRafRef.current) return;
    let lastTs = performance.now();
    const tick = () => {
      const layer = alertCircleLayerRef.current;
      const target = alertCircleTargetRef.current;
      const display = alertCircleDisplayRef.current;
      if (!layer || !target || !display) { alertCircleRafRef.current = 0; return; }

      const now = performance.now();
      const dt = Math.min(100, now - lastTs);
      lastTs = now;
      const alpha = 1 - Math.exp(-dt / 100);

      const dlat = target[0] - display[0];
      const dlng = target[1] - display[1];
      const settled = Math.abs(dlat) < 0.001 && Math.abs(dlng) < 0.001;
      if (settled) {
        display[0] = target[0];
        display[1] = target[1];
      } else {
        display[0] += dlat * alpha;
        display[1] += dlng * alpha;
      }

      const existing = layer.getShape("audio-alert-range");
      if (existing) {
        layer.updateShape("audio-alert-range", { center: [...display] as [number, number] });
      } else {
        layer.addShape({
          id: "audio-alert-range",
          type: "circle",
          center: [...display] as [number, number],
          radius: audioAlertRange,
          color: "#00FF0066",
          size: 2,
          mapName: map.mapName,
        });
      }

      if (settled) {
        alertCircleRafRef.current = 0;
        return;
      }
      alertCircleRafRef.current = requestAnimationFrame(tick);
    };
    alertCircleRafRef.current = requestAnimationFrame(tick);
  }, [map, player, showAudioAlertRange, audioAlertsMuted, audioAlertRange]);

  return <></>;
}
