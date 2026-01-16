"use client";

import { useEffect, useRef } from "react";
import { useMap } from "./store";
import { PlayerMarker } from "./player-marker";
import { rotateCoordinate } from "./rotation";
import { getIconsUrl, MarkerOptions, TilesConfig } from "@repo/lib";
import { useSettingsStore } from "@repo/lib";
import { applyColorBlindTransform } from "./color-blind";
import type { ColorBlindMode } from "@repo/lib";
import { useThrottledEffect } from "../ui/useThrottleEffect";
import type { RemotePlayer } from "../(providers)/peers-store";

export function Teammate({
  appName,
  player,
  markerOptions,
  iconsPath,
  tilesConfig,
}: {
  appName: string;
  player: RemotePlayer;
  markerOptions: MarkerOptions;
  iconsPath: string;
  tilesConfig: TilesConfig;
}): JSX.Element {
  const map = useMap();
  const marker = useRef<PlayerMarker | null>(null);
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const playerIconSize = useSettingsStore((state) => state.playerIconSize);
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity,
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
      image.onerror = () => reject(new Error("teammate-icon-load"));
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
        image.onerror = () => reject(new Error("teammate-icon-process"));
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
      // Use a different icon for teammates
      const iconName = markerOptions.playerIcon
        ? `/icons/${markerOptions.playerIcon}`
        : "https://th.gl/global_icons/player.png";
      const iconUrl = getIconsUrl(appName, iconName, iconsPath);

      const iconImage = await buildIconImage(
        iconUrl,
        colorBlindMode,
        colorBlindSeverity,
      );

      const tile = tilesConfig[map.mapName];
      const rotationOffset = tile?.rotation?.angle;

      // Apply rotation to teammate position if configured
      let teammatePosition: [number, number] = [player.x, player.y];
      const rotationDegrees = map._rotationDegrees;
      const rotationCenter = map._rotationCenter;
      if (rotationDegrees && rotationCenter) {
        teammatePosition = rotateCoordinate(
          [player.x, player.y],
          rotationDegrees,
          rotationCenter,
        );
      }

      // Slightly smaller size for teammates (30px base instead of 36px)
      const size = Math.max(10, Math.round(30 * baseIconSize * playerIconSize));

      if (!marker.current) {
        // Use a unique ID for each teammate based on their peer ID or name
        const markerId = `teammate-${player.name || player.id || "unknown"}`;
        marker.current = new PlayerMarker(teammatePosition, {
          id: markerId,
          rotation: player.r,
          rotationOffset,
          size,
        });
        marker.current.setIcon(iconImage);
        marker.current.addTo(map.markerLayer!);
      } else {
        marker.current.setIcon(iconImage);
        marker.current.setSize(size);
        marker.current.updatePosition({
          ...player,
          x: teammatePosition[0],
          y: teammatePosition[1],
        });
      }
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
      const iconName = markerOptions.playerIcon
        ? `/icons/${markerOptions.playerIcon}`
        : "https://th.gl/global_icons/player.png";
      const iconUrl = getIconsUrl(appName, iconName, iconsPath);

      const iconImage = await buildIconImage(
        iconUrl,
        colorBlindMode,
        colorBlindSeverity,
      );
      marker.current?.setIcon(iconImage);
      const size = Math.max(10, Math.round(30 * baseIconSize * playerIconSize));
      marker.current?.setSize(size);
    };
    run();
  }, [baseIconSize, playerIconSize, colorBlindMode]);

  useThrottledEffect(
    () => {
      if (!map?.mapName || !player || !marker.current) {
        return;
      }

      // Apply rotation to teammate position if configured
      let teammatePosition: [number, number] = [player.x, player.y];
      const rotationDegrees = map._rotationDegrees;
      const rotationCenter = map._rotationCenter;
      if (rotationDegrees && rotationCenter) {
        teammatePosition = rotateCoordinate(
          [player.x, player.y],
          rotationDegrees,
          rotationCenter,
        );
      }

      marker.current.updatePosition({
        ...player,
        x: teammatePosition[0],
        y: teammatePosition[1],
      });
    },
    [map?.mapName, player],
    50,
  );

  return <></>;
}
