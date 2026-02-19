"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMap } from "./store";
import { PlayerMarker } from "./player-marker";
import leaflet, { PointExpression } from "leaflet";
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
  const rangeCircle = useRef<leaflet.Marker | null>(null);
  const rangeCircleVisualRef = useRef<HTMLElement | null>(null);
  const followPlayerPosition = useSettingsStore((state) => state.followPlayer);
  const setMapName = useUserStore((state) => state.setMapName);
  const t = useT();
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const playerIconSize = useSettingsStore((state) => state.playerIconSize);
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity,
  );
  const audioAlertRange = useSettingsStore((state) => state.audioAlertRange);
  const showAudioAlertRange = useSettingsStore(
    (state) => state.showAudioAlertRange,
  );

  const iconCache = useRef<Map<string, string>>(new Map());

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

  async function buildIcon(
    iconUrl: string,
    size: number[],
    mode: ColorBlindMode,
    severity: number,
  ) {
    const cacheKey = `${iconUrl}@${size[0]}x${size[1]}:${mode}:${severity.toFixed(2)}`;
    const cached = iconCache.current.get(cacheKey);
    if (cached) {
      return leaflet.icon({
        iconUrl: cached,
        className: "player",
        iconSize: size as PointExpression,
      });
    }
    if (mode === "none" || severity <= 0) {
      return leaflet.icon({
        iconUrl,
        className: "player",
        iconSize: size as PointExpression,
      });
    }
    try {
      // Load image once and reuse it for canvas drawing
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("player-icon-load"));
        image.src = iconUrl;
      });

      const canvas = document.createElement("canvas");
      const [w, h] = size;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      applyColorBlindTransform(
        imageData.data,
        mode as Exclude<ColorBlindMode, "none">,
        severity,
      );
      ctx.putImageData(imageData, 0, 0);
      const dataUrl = canvas.toDataURL();
      iconCache.current.set(cacheKey, dataUrl);
      return leaflet.icon({
        iconUrl: dataUrl,
        className: "player",
        iconSize: size as PointExpression,
      });
    } catch (e) {
      // Fallback to unprocessed icon on error
      return leaflet.icon({
        iconUrl,
        className: "player",
        iconSize: size as PointExpression,
      });
    }
  }

  useEffect(() => {
    if (!map?.mapName) {
      return;
    }

    const isOnMap = !player.mapName || player.mapName === map.mapName;
    if (!isOnMap) {
      return;
    }

    const run = async () => {
      const icon = await buildIcon(
        iconUrl,
        iconSize,
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

      if (!marker.current) {
        marker.current = new PlayerMarker(playerPosition, {
          icon,
          interactive: false,
          rotation: player.r,
          pane: "tooltipPane",
          rotationOffset,
        });
      } else {
        marker.current.setIcon(icon);
        // Create a modified player object with rotated coordinates
        marker.current.updatePosition({
          ...player,
          x: playerPosition[0],
          y: playerPosition[1],
        });
      }

      try {
        marker.current.addTo(map);
        map.panTo(playerPosition, {
          animate: false,
          duration: 0,
          easeLinearity: 1,
          noMoveStart: true,
        });
      } catch (e) {}
    };

    run();

    return () => {
      try {
        marker.current?.remove();
        marker.current = null;
      } catch (e) {}
    };
  }, [map?.mapName, player?.mapName]);

  // Update icon when size or color-blind mode changes
  useEffect(() => {
    if (!marker.current) return;
    const run = async () => {
      const newIcon = await buildIcon(
        iconUrl,
        iconSize,
        colorBlindMode,
        colorBlindSeverity,
      );
      try {
        marker.current?.setIcon(newIcon);
      } catch (e) {}
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

      const now = performance.now();
      const shouldPan =
        followPlayerPosition &&
        now - lastPanTimeRef.current >= PAN_INTERVAL;

      // Always update range circle position (DOM-based with CSS transition, no canvas redraws)
      if (rangeCircle.current) {
        rangeCircle.current.setLatLng(playerPosition);
      }

      if (shouldPan) {
        lastPanTimeRef.current = now;
        map.panTo(playerPosition, {
          animate: true,
          duration: PAN_INTERVAL / 1000,
          easeLinearity: 1,
          noMoveStart: true,
        });
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

  // Audio alert range circle — DOM-based marker with CSS transition for smooth movement.
  // Uses a DivIcon styled as a circle instead of Leaflet Circle (vector layer) so that
  // setLatLng only updates CSS transform (no canvas redraws) and the CSS transition
  // smoothly interpolates position, matching the player marker's movement.
  useEffect(() => {
    if (!map || !showAudioAlertRange) {
      if (rangeCircle.current) {
        rangeCircle.current.remove();
        rangeCircle.current = null;
        rangeCircleVisualRef.current = null;
      }
      return;
    }

    // Calculate pixel radius from game-unit radius at current zoom
    const updateSize = () => {
      const visual = rangeCircleVisualRef.current;
      if (!visual || !map || !rangeCircle.current) return;
      const latlng = rangeCircle.current.getLatLng();
      const centerPx = map.latLngToLayerPoint(latlng);
      const edgePx = map.latLngToLayerPoint(
        leaflet.latLng(latlng.lat + audioAlertRange, latlng.lng),
      );
      const pixelRadius = Math.abs(centerPx.y - edgePx.y);
      const size = pixelRadius * 2;
      visual.style.width = `${size}px`;
      visual.style.height = `${size}px`;
    };

    if (!rangeCircle.current) {
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

      rangeCircle.current = leaflet.marker(playerPosition, {
        icon: leaflet.divIcon({
          className: "",
          iconSize: [0, 0],
          html: `<div class="range-circle-visual" style="position:absolute;border-radius:50%;border:2px dashed rgba(34,197,94,0.8);background:rgba(34,197,94,0.1);box-sizing:border-box;pointer-events:none;transform:translate(-50%,-50%)"></div>`,
        }),
        interactive: false,
        pane: "overlayPane",
      });
      rangeCircle.current.addTo(map);

      // CSS transition for smooth movement matching player marker (0.2s linear)
      const el = rangeCircle.current.getElement();
      if (el) {
        el.style.transition = "transform 0.2s linear";
      }
      rangeCircleVisualRef.current = el?.querySelector(
        ".range-circle-visual",
      ) as HTMLElement;
    }

    // Update size for current zoom and when audioAlertRange changes
    updateSize();
    map.on("zoomend", updateSize);

    return () => {
      map.off("zoomend", updateSize);
      if (rangeCircle.current) {
        rangeCircle.current.remove();
        rangeCircle.current = null;
        rangeCircleVisualRef.current = null;
      }
    };
  }, [map, showAudioAlertRange, audioAlertRange]);

  return <></>;
}
