"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Spawns, useCoordinates, useT } from "../(providers)";
import { useMap } from "./store";
import { rotateCoordinate } from "./rotation";
import {
  buildDiscoveryLookup,
  checkNodeDiscovered,
  getAppUrl,
  getIconsUrl,
  getNodeId,
  MarkerOptions,
  Spawn,
  useConnectionStore,
  useGameState,
  useSettingsStore,
  useUserStore,
  devLog,
  type LabelMode,
} from "@repo/lib";
import { IconMarkerLayer, type IconMarkerInstance, DEFAULT_CIRCLE_SHEET, DrawingLayer } from "@repo/lib/web-map";
import { SpatialGrid } from "./spatial-grid";
import { MarkerTooltip, TooltipItems } from "./marker-tooltip";
import { useThrottle } from "@uidotdev/usehooks";
import { AdditionalTooltipType } from "../(content)";
import { playAlertSound } from "../(controls)/audio-alert";
import {
  getSourceImage,
  setSourceImage,
  getProcessedImage,
  setProcessedImage,
  createProcessedImageKey,
} from "./icon-cache";

export function Markers({
  appName,
  markerOptions,
  hideComments,
  iconsPath,
  additionalTooltip,
}: {
  appName: string;
  markerOptions: MarkerOptions;
  hideComments?: boolean;
  iconsPath: string;
  additionalTooltip?: AdditionalTooltipType;
}): JSX.Element {
  const map = useMap();
  const [tooltipIsOpen, setTooltipIsOpen] = useState(false);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    radius: number;
    latLng: [number, number] | [number, number, number];
    items: TooltipItems;
  } | null>(null);
  const isDrawing = useSettingsStore((state) => !!state.tempPrivateDrawing);
  const setSelectedNodeId = useUserStore((state) => state.setSelectedNodeId);

  const containerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const isHoverCardVisible = tooltipIsOpen && !isDrawing;

  // Forward wheel events from tooltip to map canvas for zooming
  const tooltipWheelRef = useCallback(
    (node: HTMLDivElement | null) => {
      tooltipRef.current = node;
      if (!node) return;

      const canvas = map?.getContainer();
      if (!canvas) return;

      const handleWheel = (e: WheelEvent) => {
        // Check if the event target is inside a scrollable container
        let el = e.target as HTMLElement | null;
        while (el && el !== node) {
          if (el.scrollHeight > el.clientHeight) {
            const atTop = el.scrollTop <= 0;
            const atBottom =
              el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
            // Let the scroll area handle it if not at boundary
            if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
              return;
            }
          }
          el = el.parentElement;
        }

        e.preventDefault();
        e.stopPropagation();
        canvas.dispatchEvent(
          new WheelEvent("wheel", {
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            deltaZ: e.deltaZ,
            deltaMode: e.deltaMode,
            clientX: e.clientX,
            clientY: e.clientY,
            screenX: e.screenX,
            screenY: e.screenY,
            bubbles: true,
            cancelable: true,
          }),
        );
      };

      node.addEventListener("wheel", handleWheel, {
        passive: false,
        capture: true,
      });
    },
    [map],
  );

  // Track if mouse is in the "safe zone" (marker, tooltip, or between them)
  useEffect(() => {
    if (!tooltipIsOpen || !tooltipData || !containerRef.current) return;

    const container = containerRef.current;

    const isInSafeZone = (e: MouseEvent): boolean => {
      const { x, y, radius } = tooltipData;

      // Get mouse position relative to container
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Check if mouse is over the tooltip element
      if (tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        if (
          e.clientX >= tooltipRect.left &&
          e.clientX <= tooltipRect.right &&
          e.clientY >= tooltipRect.top &&
          e.clientY <= tooltipRect.bottom
        ) {
          return true;
        }
      }

      // Check if mouse is within expanded marker radius (with padding)
      const markerPadding = 10;
      const dx = mouseX - x;
      const dy = mouseY - y;
      const distToMarker = Math.sqrt(dx * dx + dy * dy);
      if (distToMarker <= radius + markerPadding) {
        return true;
      }

      // Check if mouse is in the corridor between marker and tooltip
      // The tooltip is positioned above the marker
      const tooltipBottom = y - radius - 8; // 8px gap
      if (mouseY < y && mouseY > tooltipBottom - 10) {
        // Check if within horizontal bounds (tooltip width centered on x)
        const corridorHalfWidth = Math.max(radius + 20, 100);
        if (Math.abs(mouseX - x) <= corridorHalfWidth) {
          return true;
        }
      }

      return false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isInSafeZone(e)) {
        setTooltipIsOpen(false);
      }
    };

    // Small delay before adding listener to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousemove", handleMouseMove);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [tooltipIsOpen, tooltipData]);

  // Get container for tooltip portal
  useEffect(() => {
    if (map) {
      containerRef.current = map.getContainer()?.parentElement ?? null;
    }
  }, [map]);

  return (
    <>
      <MarkersContent
        appName={appName}
        markerOptions={markerOptions}
        iconsPath={iconsPath}
        onTooltipData={setTooltipData}
        onTooltipOpen={setTooltipIsOpen}
        onClick={setSelectedNodeId}
      />
      {containerRef.current && tooltipData && isHoverCardVisible
        ? createPortal(
            <div
              ref={tooltipWheelRef}
              className="cursor-default z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none max-w-xs"
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: `translate3d(calc(${tooltipData.x}px - 50%), calc(${tooltipData.y}px - 100% - ${tooltipData.radius}px - 8px), 0px)`,
                pointerEvents: "auto",
              }}
            >
              <MarkerTooltip
                appName={appName}
                latLng={tooltipData.latLng}
                items={tooltipData.items}
                onClick={setSelectedNodeId}
                onClose={() => setTooltipIsOpen(false)}
                hideComments={hideComments}
                additionalTooltip={additionalTooltip}
                coordinateCopyFormat={markerOptions.coordinateCopyFormat}
              />
            </div>,
            containerRef.current
          )
        : null}
    </>
  );
}

function MarkersContent({
  appName,
  markerOptions,
  iconsPath,
  onTooltipData,
  onTooltipOpen,
  onClick,
}: {
  appName: string;
  markerOptions: MarkerOptions;
  iconsPath: string;
  onTooltipData: (data: {
    x: number;
    y: number;
    radius: number;
    latLng: [number, number] | [number, number, number];
    items: TooltipItems;
  }) => void;
  onTooltipOpen: (open: boolean) => void;
  onClick: (id: string | null) => void;
}) {
  const map = useMap();
  const t = useT();
  const { spawns, icons, filters } = useCoordinates();
  const hideDiscoveredNodes = useSettingsStore(
    (state) => state.hideDiscoveredNodes
  );
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);
  const discoveryLookup = useMemo(
    () => buildDiscoveryLookup(discoveredNodes),
    [discoveredNodes]
  );
  const setDiscoverNode = useSettingsStore((state) => state.setDiscoverNode);
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const iconSizeByGroup = useSettingsStore((state) => state.iconSizeByGroup);
  const iconSizeByFilter = useSettingsStore((state) => state.iconSizeByFilter);
  const sharedMyFilters = useConnectionStore((state) => state.myFilters);
  const liveMode = useSettingsStore((state) => state.liveMode);
  const audioAlertsMuted = useSettingsStore((state) => state.audioAlertsMuted);
  const audioAlertRange = useSettingsStore((state) => state.audioAlertRange);
  const audioAlertByFilter = useSettingsStore(
    (state) => state.audioAlertByFilter,
  );
  const audioAlertSound = useSettingsStore((state) => state.audioAlertSound);
  const audioAlertVolume = useSettingsStore((state) => state.audioAlertVolume);
  const selectedNodeId = useUserStore((state) => state.selectedNodeId);
  const fitBoundsOnChange = useSettingsStore(
    (state) => state.fitBoundsOnChange
  );
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity
  );
  const highContrastMode = useSettingsStore((state) => state.highContrastMode);
  const highContrastColor = useSettingsStore((state) => state.highContrastColor);
  const highContrastThickness = useSettingsStore(
    (state) => state.highContrastThickness
  );
  const labelModeByFilter = useSettingsStore(
    (state) => state.labelModeByFilter,
  );
  const labelTextSize = useSettingsStore((state) => state.labelTextSize);
  const tempPrivateNodeId = useSettingsStore(
    (state) => state.tempPrivateNode?.id
  );
  const highlightSpawnIDs = useGameState((state) => state.highlightSpawnIDs);
  const player = useGameState((state) => state.player);
  const throttledPlayer = useThrottle(player, 1000);
  const firstRender = useRef(true);

  // Track which marker IDs this component owns
  const spawnMapRef = useRef<Map<string, Spawn>>(new Map());
  const justClickedMarkerRef = useRef(false);
  const tooltipDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cache for colored circle images (for private nodes without icons)
  const coloredCircleCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Counter to trigger re-render when images finish loading
  const [iconLoadVersion, setIconLoadVersion] = useState(0);


  // Spatial grid for efficient proximity queries (audio alerts, z-position)
  const spatialGridRef = useRef<SpatialGrid<{ id: string; spawn: Spawn; latLng: [number, number] }>>();

  // Audio alert tracking - tracks if we've already alerted for current in-range spawns
  const hasAlertedRef = useRef<boolean>(false);

  // Hotkey state for showing all labels temporarily (set by MapHotkeys in Overwolf/THGL apps)
  const showLabelsActive = useGameState((state) => state.showLabelsActive);

  // Label layer for rendering per-marker text labels
  const labelLayerRef = useRef<DrawingLayer | null>(null);

  // Helper function to determine if label should show for a marker
  const shouldShowLabel = useCallback(
    (
      typeId: string,
      labelMode: LabelMode | undefined,
      isInRange: boolean,
    ): boolean => {
      if (!labelMode || labelMode === "off") return false;
      if (labelMode === "always") return true;
      if (labelMode === "inRange") return isInRange;
      if (labelMode === "hotkey") return showLabelsActive;
      return false;
    },
    [showLabelsActive],
  );

  const appIconsByName = useMemo(() => {
    const map = new Map<
      string,
      { x: number; y: number; width: number; height: number }
    >();
    for (const filter of filters) {
      for (const value of filter.values) {
        if (typeof value.icon !== "string") {
          const name = t(value.id);
          if (!map.has(name)) {
            map.set(name, value.icon);
          }
        }
      }
    }
    return map;
  }, [filters, t]);

  // Helper to extract RGB (without alpha) from color string
  const getRgbFromColor = (colorStr: string): string => {
    if (colorStr.length === 9 && colorStr.startsWith("#")) {
      return colorStr.slice(0, 7); // #RRGGBB from #RRGGBBAA
    } else if (colorStr.length === 5 && colorStr.startsWith("#")) {
      return `#${colorStr[1]}${colorStr[1]}${colorStr[2]}${colorStr[2]}${colorStr[3]}${colorStr[3]}`;
    }
    return colorStr;
  };

  // Helper to extract alpha from color string
  const getAlphaFromColor = (colorStr: string): number => {
    if (colorStr.length === 9 && colorStr.startsWith("#")) {
      return parseInt(colorStr.slice(7, 9), 16) / 255;
    } else if (colorStr.length === 5 && colorStr.startsWith("#")) {
      return parseInt(colorStr[4] + colorStr[4], 16) / 255;
    }
    return 1;
  };

  // Helper to process an icon with glow effect for private nodes
  // Returns the image and its dimensions (since img.width may not be set immediately from data URL)
  const processIconWithGlow = (
    sourceImg: HTMLImageElement,
    iconRect: { x: number; y: number; width: number; height: number } | null,
    color: string,
    isGameIcon: boolean
  ): { img: HTMLImageElement; width: number; height: number } => {
    const width = iconRect?.width ?? sourceImg.naturalWidth;
    const height = iconRect?.height ?? sourceImg.naturalHeight;
    const srcX = iconRect?.x ?? 0;
    const srcY = iconRect?.y ?? 0;
    const rgbColor = getRgbFromColor(color);
    const alpha = getAlphaFromColor(color);

    const canvas = document.createElement("canvas");
    const outputCanvas = document.createElement("canvas");
    let outputWidth: number;
    let outputHeight: number;

    if (isGameIcon) {
      // Game icons: Fill with the selected color, use icon as mask
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = rgbColor;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(sourceImg, srcX, srcY, width, height, 0, 0, width, height);

      // Apply opacity
      outputCanvas.width = width;
      outputCanvas.height = height;
      outputWidth = width;
      outputHeight = height;
      const outCtx = outputCanvas.getContext("2d")!;
      outCtx.globalAlpha = alpha;
      outCtx.drawImage(canvas, 0, 0);
    } else {
      // App icons: Draw original with colored glow effect
      const glowSize = 8;
      const totalSize = Math.max(width, height) + glowSize * 2;

      canvas.width = totalSize;
      canvas.height = totalSize;
      const ctx = canvas.getContext("2d")!;

      const iconX = (totalSize - width) / 2;
      const iconY = (totalSize - height) / 2;

      // Only apply glow if color is not white (default)
      const isWhite = rgbColor.toUpperCase() === "#FFFFFF";
      if (!isWhite) {
        // Draw colored glow using shadow
        ctx.shadowColor = rgbColor;
        ctx.shadowBlur = glowSize;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        // Draw icon multiple times to intensify the glow
        for (let i = 0; i < 3; i++) {
          ctx.drawImage(sourceImg, srcX, srcY, width, height, iconX, iconY, width, height);
        }
        // Reset shadow for final clean draw
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      // Draw the original icon on top
      ctx.drawImage(sourceImg, srcX, srcY, width, height, iconX, iconY, width, height);

      // Apply opacity
      outputCanvas.width = totalSize;
      outputCanvas.height = totalSize;
      outputWidth = totalSize;
      outputHeight = totalSize;
      const outCtx = outputCanvas.getContext("2d")!;
      outCtx.globalAlpha = alpha;
      outCtx.drawImage(canvas, 0, 0);
    }

    const img = new Image();
    img.src = outputCanvas.toDataURL();
    return { img, width: outputWidth, height: outputHeight };
  };

  // Helper to process a sprite sheet icon using canvas 2D.
  // Isolates each icon from the atlas to prevent cross-icon bleeding in WebGL,
  // and applies a subtle shadow like the old Leaflet canvas-marker approach.
  // Returns a canvas element directly (no data URL conversion needed).
  // Padding accommodates shadow blur (2px) + max high contrast outline (6px).
  const ICON_PADDING = 8;
  const processedIconCache = useRef<Map<string, { canvas: HTMLCanvasElement; width: number; height: number }>>(new Map());
  const processSheetIcon = (
    sourceImg: HTMLImageElement,
    rect: { x: number; y: number; width: number; height: number },
  ): { canvas: HTMLCanvasElement; width: number; height: number } => {
    const canvasW = rect.width + ICON_PADDING * 2;
    const canvasH = rect.height + ICON_PADDING * 2;
    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d")!;

    // Apply subtle shadow like old Leaflet canvas-marker.ts
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = "black";
    ctx.shadowBlur = 1;

    // Draw icon cropped from sprite sheet at full resolution.
    // This isolates the icon from the atlas, preventing WebGL bilinear
    // filtering from bleeding adjacent icon pixels across boundaries.
    ctx.drawImage(
      sourceImg,
      rect.x, rect.y, rect.width, rect.height,
      ICON_PADDING, ICON_PADDING,
      rect.width, rect.height,
    );

    return { canvas, width: canvasW, height: canvasH };
  };

  // Helper to create a colored circle image for private nodes
  const createColoredCircleImage = (color: string): HTMLImageElement => {
    const cacheKey = `__circle_${color}__`;
    const cached = coloredCircleCache.current.get(cacheKey);
    if (cached && cached.complete) {
      return cached;
    }

    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Draw colored circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Add a subtle border
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const img = new Image();
    img.src = canvas.toDataURL();
    coloredCircleCache.current.set(cacheKey, img);
    return img;
  };

  // Keep refs for latest values to avoid stale closures
  const discoveryLookupRef = useRef(discoveryLookup);
  discoveryLookupRef.current = discoveryLookup;

  const typeToGroup = useMemo(() => {
    const mapTypeToGroup = new Map<string, string>();
    filters.forEach((g) => {
      g.values.forEach((v) => mapTypeToGroup.set(v.id, g.group));
    });
    return mapTypeToGroup;
  }, [filters]);

  // Cache rotated coordinates to avoid recalculating on every render
  const rotationCache = useMemo(() => {
    const rotationDegrees = map?.rotationDegrees ?? map?._rotationDegrees;
    const rotationCenter = map?.rotationCenter ?? map?._rotationCenter;

    if (!rotationDegrees || !rotationCenter) {
      return null;
    }

    const cache = new Map<string, [number, number]>();

    return {
      getRotated: (x: number, y: number): [number, number] => {
        const key = `${x}:${y}`;
        let rotated = cache.get(key);
        if (!rotated) {
          rotated = rotateCoordinate([x, y], rotationDegrees, rotationCenter);
          cache.set(key, rotated);
        }
        return rotated;
      },
    };
  }, [map, map?.rotationDegrees, map?._rotationDegrees, map?.rotationCenter, map?._rotationCenter]);

  // Memoize rotated player position for label rendering
  const rotatedPlayer = useMemo(() => {
    if (!throttledPlayer) return null;
    if (!rotationCache) return { x: throttledPlayer.x, y: throttledPlayer.y };
    const rotated = rotationCache.getRotated(throttledPlayer.x, throttledPlayer.y);
    return { x: rotated[0], y: rotated[1] };
  }, [throttledPlayer, rotationCache]);

  // Track effect runs for debugging
  const effectRunCount = useRef(0);

  // Main effect: add/update/remove markers
  useEffect(() => {
    const markerLayer = map?.markerLayer;
    if (!map || !markerLayer) return;

    effectRunCount.current += 1;
    const runId = effectRunCount.current;
    devLog.info("Markers", "Effect run started", {
      runId,
      spawnCount: spawns.length,
      hasPlayer: !!throttledPlayer,
    });

    // Load the icon sprite sheet
    const iconUrl = getIconsUrl(appName, "icons.webp", iconsPath);
    markerLayer.addSheet("icons", iconUrl);

    // Load sprite sheet source image for CPU-side icon processing.
    // When loaded, each icon is individually processed using canvas 2D's
    // high-quality downsampling (replicating the old Leaflet canvas approach).
    const spriteSheetSource = getSourceImage(iconUrl);
    if (!spriteSheetSource) {
      const spriteImg = new Image();
      spriteImg.crossOrigin = "anonymous";
      spriteImg.onload = () => {
        setSourceImage(iconUrl, spriteImg);
        setIconLoadVersion((v) => v + 1);
      };
      spriteImg.src = iconUrl;
    }

    // Set color blind mode
    markerLayer.setColorBlindMode(colorBlindMode);
    markerLayer.setColorBlindSeverity(colorBlindSeverity);


    // Set high contrast mode
    markerLayer.setHighContrastMode(highContrastMode);
    markerLayer.setHighContrastColor(highContrastColor);
    markerLayer.setHighContrastThickness(highContrastThickness);

    const baseRadius = 12;
    const dpr = window.devicePixelRatio || 1;
    const markerInstances: IconMarkerInstance[] = [];
    const newSpawnMap = new Map<string, Spawn>();
    // Track raw Z values for height visualization without player
    const markerZValues = new Map<number, number>(); // index in markerInstances -> raw Z
    const newSpatialGrid = new SpatialGrid<{ id: string; spawn: Spawn; latLng: [number, number] }>(100);

    const handleSpawn = (spawn: Spawn) => {
      if (spawn.mapName && spawn.mapName !== map.mapName) {
        return;
      }
      if (tempPrivateNodeId && tempPrivateNodeId === spawn.id?.split("@")[0]) {
        return;
      }

      const isStacked = Boolean(spawn.cluster && spawn.cluster.length > 0);
      const nodeId = getNodeId(spawn);
      let isDiscovered = checkNodeDiscovered(nodeId, discoveryLookup);

      if (isStacked && isDiscovered) {
        if (
          spawn.cluster!.some(
            (a) =>
              !checkNodeDiscovered(
                a.id?.includes("@")
                  ? a.id
                  : `${a.id || a.type}@${a.p[0]}:${a.p[1]}`,
                discoveryLookup
              )
          )
        ) {
          isDiscovered = false;
        }
      }

      if (isDiscovered && hideDiscoveredNodes) {
        return;
      }

      const id = String(spawn.address ?? (isStacked ? `${nodeId}:${isStacked}` : nodeId));
      newSpawnMap.set(id, spawn);

      const isHighlighted =
        highlightSpawnIDs.includes(nodeId) || selectedNodeId === nodeId;

      const icon = icons.get(spawn.type);
      const iconBaseSize = icon?.size ?? 1;
      const groupId = typeToGroup.get(spawn.type);
      const groupMultiplier = groupId ? (iconSizeByGroup[groupId] ?? 1) : 1;
      const typeMultiplier = iconSizeByFilter[spawn.type] ?? 1;
      const spawnRadius = spawn.radius ?? markerOptions.radius * iconBaseSize;
      let size = (spawnRadius * 4 - 1) * baseIconSize * groupMultiplier * typeMultiplier * dpr;

      // Get icon from filter config (NOT resolved to URL yet - we need the raw icon data)
      const markerIcon =
        spawn.icon ||
        (typeof icon?.icon === "string" ? null : icon?.icon) ||
        null;
      // String icons are direct image filenames (e.g. "sifuu.webp")
      const stringIcon = !spawn.icon && typeof icon?.icon === "string" ? icon.icon : null;

      let rect = { x: 0, y: 0, width: 64, height: 64 };
      let sheet = "icons"; // Default to the main sprite sheet
      let useProcessedIcon = false; // Track if we're using a processed icon (glow already applied)

      if (stringIcon) {
        // Direct image URL icon (e.g. NPC villager icons)
        const fullUrl = getIconsUrl(appName, stringIcon, iconsPath);
        sheet = fullUrl;
        markerLayer.addSheet(sheet, fullUrl);
        rect = { x: 0, y: 0, width: 64, height: 64 };
      } else if (markerIcon && "url" in markerIcon && markerIcon.url) {
        // Custom URL-based icon (from spawn.icon or custom filters)
        const iconUrlStr = markerIcon.url as string;

        // Check if this is a standalone icon (single image) or a sprite sheet
        const hasValidSpriteCoords =
          "x" in markerIcon &&
          typeof markerIcon.x === "number" &&
          typeof markerIcon.y === "number";

        // Check if this is from the game-icons sprite sheets (local paths)
        const isGameIconsSprite = iconUrlStr.includes("/game-icons/") && hasValidSpriteCoords;

        // Treat as standalone only if it's a data URL, external URL, or has no sprite coords
        const isStandaloneIcon =
          iconUrlStr.startsWith("data:") ||
          iconUrlStr.includes("game-icons.net") ||
          (!hasValidSpriteCoords && iconUrlStr.includes("/my_"));

        // For private nodes with icons, apply glow/color effect
        if (spawn.isPrivate && spawn.color) {
          const nodeColor = spawn.color;
          const fullIconUrl = getIconsUrl(appName, iconUrlStr, iconsPath);
          const iconRect = hasValidSpriteCoords
            ? {
                x: markerIcon.x as number,
                y: markerIcon.y as number,
                width: markerIcon.width as number,
                height: markerIcon.height as number,
              }
            : null;
          // Include iconRect in cache key so different icons on same sprite sheet have different cache entries
          const cacheKey = createProcessedImageKey(fullIconUrl, nodeColor, iconRect);

          // Check if we have a cached processed image (shared cache)
          const cachedProcessed = getProcessedImage(cacheKey);
          if (cachedProcessed) {
            // Use cached processed image with stored dimensions
            sheet = cacheKey;
            markerLayer.setSheet(sheet, cachedProcessed.img);
            rect = { x: 0, y: 0, width: cachedProcessed.width, height: cachedProcessed.height };
            useProcessedIcon = true; // Color is already baked in
          } else {
            // Check if source image is loaded (shared cache)
            const cachedSource = getSourceImage(fullIconUrl);
            if (cachedSource) {
              // Process the image
              const { img: processedImg, width: procWidth, height: procHeight } = processIconWithGlow(cachedSource, iconRect, nodeColor, isGameIconsSprite);
              setProcessedImage(cacheKey, processedImg, procWidth, procHeight);
              sheet = cacheKey;
              markerLayer.setSheet(sheet, processedImg);
              rect = { x: 0, y: 0, width: procWidth, height: procHeight };
              useProcessedIcon = true; // Color is already baked in
            } else {
              // Start loading source image
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                setSourceImage(fullIconUrl, img);
                // Trigger re-render so the processed icon gets created
                setIconLoadVersion((v) => v + 1);
              };
              img.src = fullIconUrl;
              // Use fallback for now - plain icon without glow (tint will be applied)
              sheet = fullIconUrl;
              markerLayer.addSheet(sheet, fullIconUrl);
              rect = iconRect ?? { x: 0, y: 0, width: 64, height: 64 };
            }
          }
        } else if (isGameIconsSprite) {
          // Game-icons sprite sheet - use full URL as sheet name and register it
          sheet = getIconsUrl(appName, iconUrlStr, iconsPath);
          markerLayer.addSheet(sheet, sheet);
          rect = {
            x: markerIcon.x as number,
            y: markerIcon.y as number,
            width: markerIcon.width as number,
            height: markerIcon.height as number,
          };
        } else if (isStandaloneIcon) {
          // Standalone icon - use full URL as sheet name
          sheet = getIconsUrl(appName, iconUrlStr, iconsPath);
          markerLayer.addSheet(sheet, sheet);
          rect = {
            x: 0,
            y: 0,
            width: (markerIcon as any).width ?? 64,
            height: (markerIcon as any).height ?? 64,
          };
        } else if (hasValidSpriteCoords) {
          // Other sprite sheet with coords - use default "icons" sheet
          rect = {
            x: markerIcon.x as number,
            y: markerIcon.y as number,
            width: markerIcon.width as number,
            height: markerIcon.height as number,
          };
        }
      } else if (markerIcon && "x" in markerIcon) {
        // Icon sprite from default sheet (has x,y but no url)
        rect = {
          x: markerIcon.x as number,
          y: markerIcon.y as number,
          width: markerIcon.width as number,
          height: markerIcon.height as number,
        };
      } else if (spawn.isPrivate && !markerIcon) {
        // Private node without icon - use colored circle
        const nodeColor = spawn.color ?? "#FFFFFFCC";
        const circleSheetName = `__circle_${nodeColor}__`;
        const circleImg = createColoredCircleImage(nodeColor);
        markerLayer.setSheet(circleSheetName, circleImg);
        sheet = circleSheetName;
        rect = { x: 0, y: 0, width: 64, height: 64 };
      } else if (!markerIcon) {
        // No icon at all - use default circle sheet
        sheet = DEFAULT_CIRCLE_SHEET;
        rect = { x: 0, y: 0, width: 64, height: 64 };
      }

      // Log custom filter/private nodes for debugging
      if (spawn.isPrivate) {
        devLog.info("Markers", "Processing private spawn", {
          id: spawn.id,
          type: spawn.type,
          color: spawn.color,
          spawnIcon: spawn.icon,
          markerIcon,
          sheet,
          rect,
        });
      }

      // Pre-process sprite sheet icons using canvas 2D.
      // This isolates each icon from the atlas (preventing cross-icon bleeding
      // in WebGL bilinear filtering) and applies a subtle shadow.
      if (sheet === "icons" && !useProcessedIcon && spriteSheetSource) {
        const processedKey = `__processed_icon_${rect.x}_${rect.y}_${rect.width}_${rect.height}__`;
        const cached = processedIconCache.current.get(processedKey);
        if (cached) {
          // Scale size up to compensate for padding so icon appears at correct visual size
          size *= cached.width / rect.width;
          sheet = processedKey;
          markerLayer.setSheet(sheet, cached.canvas);
          rect = { x: 0, y: 0, width: cached.width, height: cached.height };
        } else {
          const processed = processSheetIcon(spriteSheetSource, rect);
          processedIconCache.current.set(processedKey, processed);
          // Scale size up to compensate for padding so icon appears at correct visual size
          size *= processed.width / rect.width;
          sheet = processedKey;
          markerLayer.setSheet(sheet, processed.canvas);
          rect = { x: 0, y: 0, width: processed.width, height: processed.height };
        }
      }

      // Apply rotation if map has rotation configured
      let markerPosition: [number, number] = [spawn.p[0], spawn.p[1]];
      if (rotationCache) {
        markerPosition = rotationCache.getRotated(spawn.p[0], spawn.p[1]);
      }

      // Calculate z position indicator (player-relative mode)
      let zPos: "top" | "bottom" | null = null;
      let zValue: number | undefined = undefined;
      if (markerOptions.zPos && throttledPlayer && spawn.p[2] !== undefined) {
        const { xyMaxDistance, zDistance } = markerOptions.zPos;
        let playerX = throttledPlayer.x;
        let playerY = throttledPlayer.y;
        if (rotationCache) {
          const rotatedPlayer = rotationCache.getRotated(playerX, playerY);
          playerX = rotatedPlayer[0];
          playerY = rotatedPlayer[1];
        }
        const dx = playerX - markerPosition[0];
        const dy = playerY - markerPosition[1];
        const xyDistSq = dx * dx + dy * dy;
        const maxDistSq = xyMaxDistance * xyMaxDistance;

        if (xyDistSq <= maxDistSq) {
          const dz = throttledPlayer.z - spawn.p[2];
          if (dz > zDistance) {
            zPos = "bottom";
            zValue = -dz;
          } else if (dz < -zDistance) {
            zPos = "top";
            zValue = -dz;
          }
        }
      }

      const instance: IconMarkerInstance = {
        id,
        latLng: markerPosition,
        size,
        sheet,
        rect,
        key: spawn.type,
        z: zValue,
        zPos,
        isHighlighted,
        isDiscovered,
        isSelected: selectedNodeId === nodeId,
        keepUpright: true,
        // Apply tint color for private nodes with icons only when using fallback (unprocessed) icon
        // When using processed icon, the glow effect already has the color baked in
        tint: spawn.isPrivate && markerIcon && !useProcessedIcon ? spawn.color : undefined,
        isStacked,
      };

      markerInstances.push(instance);


      // Track raw Z for height visualization without player
      if (!throttledPlayer && spawn.p[2] !== undefined) {
        markerZValues.set(markerInstances.length - 1, spawn.p[2]);
      }

      // Add to spatial grid for proximity queries
      newSpatialGrid.add(
        { id, spawn, latLng: markerPosition },
        markerPosition[0],
        markerPosition[1],
      );
    };

    // Process all spawns
    spawns.forEach(handleSpawn);

    // Process shared private spawns
    const sharedPrivateSpawns = sharedMyFilters.flatMap<Spawns[number]>(
      (myFilter) => {
        devLog.info("Markers", "Processing myFilter", {
          name: myFilter.name,
          nodeCount: myFilter.nodes?.length ?? 0,
          nodes: myFilter.nodes?.map((n) => ({
            id: n.id,
            icon: n.icon,
          })),
        });
        return (
          myFilter.nodes?.map((node) => ({
            type: myFilter.name,
            mapName: node.mapName,
            id: node.id,
            name: node.name,
            description: node.description,
            p: node.p,
            color: node.color,
            icon: node.icon,
            radius: node.radius,
            isPrivate: true,
          })) ?? []
        );
      }
    );
    sharedPrivateSpawns.forEach(handleSpawn);


    // Height visualization without player: absolute or relative to selected marker
    if (markerZValues.size > 0) {
      // Find selected marker's Z for relative mode
      let referenceZ: number | undefined;
      if (selectedNodeId) {
        for (const [idx, z] of markerZValues) {
          const inst = markerInstances[idx];
          if (inst.id === selectedNodeId || inst.id === String(selectedNodeId)) {
            referenceZ = z;
            break;
          }
        }
      }

      // Collect all Z values for robust percentile-based normalization
      const allZ: number[] = [];
      for (const [, z] of markerZValues) allZ.push(z);
      allZ.sort((a, b) => a - b);

      // Use 5th/95th percentile to ignore outliers
      const p05 = allZ[Math.floor(allZ.length * 0.05)] ?? allZ[0]!;
      const p95 = allZ[Math.ceil(allZ.length * 0.95 - 1)] ?? allZ[allZ.length - 1]!;

      if (referenceZ !== undefined) {
        // Relative mode: show height relative to selected marker
        const maxDz = Math.max(
          Math.abs(p95 - referenceZ),
          Math.abs(p05 - referenceZ),
          1,
        );
        for (const [idx, z] of markerZValues) {
          const dz = z - referenceZ;
          if (Math.abs(dz) < 0.01 * maxDz) continue; // skip near-zero differences
          const inst = markerInstances[idx];
          inst.zPos = dz > 0 ? "needle" : "needle-down";
          inst.zMag = Math.min(Math.abs(dz) / maxDz, 1);
        }
      } else {
        // Absolute mode: needle only, no arrows (no reference point)
        const robustRange = p95 - p05;
        if (robustRange > 0) {
          for (const [idx, z] of markerZValues) {
            const inst = markerInstances[idx];
            inst.zPos = "needle";
            inst.zMag = Math.max(0, Math.min(1, (z - p05) / robustRange));
          }
        }
      }
    }

    // Update spatial grid ref
    spatialGridRef.current = newSpatialGrid;

    // Compute which markers to add/remove/update
    const oldIds = new Set(spawnMapRef.current.keys());
    const newIds = new Set(newSpawnMap.keys());

    // Find markers to remove (in old but not in new)
    const toRemove: string[] = [];
    for (const id of oldIds) {
      if (!newIds.has(id)) {
        toRemove.push(id);
      }
    }

    // Batch remove old markers and their event handlers
    if (toRemove.length > 0) {
      for (const id of toRemove) {
        markerLayer.unregisterAllEventHandlers(id);
      }
      markerLayer.removeMany(toRemove);
    }

    // Add or update markers and register event handlers
    // Note: We always re-register handlers to avoid stale closures from previous renders
    for (const instance of markerInstances) {
      markerLayer.add(instance); // This handles both add and update

      // Register event handlers (always, to capture fresh closure)
      const spawn = newSpawnMap.get(instance.id);
      if (!spawn) continue;

      // Helper to show tooltip for a marker
      const showTooltipForMarker = (m: IconMarkerInstance) => {
        const s = newSpawnMap.get(m.id);
        if (!s) return;

        const canvas = map.getContainer();
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const state = (map as any).lastState;
        if (!state) return;

        const worldPos = state.projection(m.latLng);
        const view = state.viewMatrix;
        const clipX = view[0] * worldPos.x + view[3] * worldPos.y + view[6];
        const clipY = view[1] * worldPos.x + view[4] * worldPos.y + view[7];
        let screenX = (clipX * 0.5 + 0.5) * rect.width;
        let screenY = (1 - (clipY * 0.5 + 0.5)) * rect.height;

        // Offset tooltip to elevated icon position when height stem is active
        if (state.pitch > 0 && m.zPos) {
          const rawZ = typeof m.z === "number" ? m.z : 0;
          let hI = m.zMag !== undefined ? Math.min(1, Math.max(0, m.zMag)) : undefined;
          if (hI === undefined) hI = rawZ === 0 ? 0 : Math.min(1, Math.abs(rawZ) / 200);
          let dir = (m.zPos === "top" || m.zPos === "needle") ? 1 : (m.zPos === "bottom" || m.zPos === "needle-down") ? -1 : 0;
          if (dir !== 0 && hI >= 0.01) {
            const heightWorld = 20 * hI * Math.abs(Math.sin(state.pitch)) * Math.pow(2, state.zoom) * 500;
            const viewScale = Math.sqrt(view[0] * view[0] + view[1] * view[1]);
            const heightClip = heightWorld * viewScale * (2 / (rect.height * dpr));
            screenY -= heightClip * dir * rect.height / 2;
          }
        }

        const filter = filters.find((filter) =>
          filter.values.some((v) => v.id === s.type)
        );
        const nodeId = getNodeId(s);
        const isStacked = Boolean(s.cluster && s.cluster.length > 0);

        const items: TooltipItems = [
          {
            id: nodeId,
            termId: (s.name ?? s.id ?? s.type).replace(/my_\d+_/, ""),
            description: s.description,
            type: s.type,
            group: filter?.group,
            isPrivate: s.isPrivate,
            isLive: Boolean(s.address),
            data: s.data,
          },
        ];

        if (isStacked) {
          items.push(
            ...s.cluster!.map((stackedSpawn) => ({
              id: stackedSpawn.id,
              termId: (stackedSpawn.name ?? stackedSpawn.id ?? stackedSpawn.type).replace(/my_\d+_/, ""),
              description: stackedSpawn.description,
              type: stackedSpawn.type,
              group: filter?.group,
              isPrivate: stackedSpawn.isPrivate,
              isLive: Boolean(stackedSpawn.address),
              data: stackedSpawn.data,
            }))
          );
        }

        onTooltipData({
          x: screenX,
          y: screenY,
          radius: m.size / 2 / dpr,
          items,
          latLng: s.p,
        });
        onTooltipOpen(true);
      };

      markerLayer.registerEventHandler(instance.id, "mouseover", (m) => {
        // Delay tooltip open to avoid interfering with map interactions
        if (tooltipDelayRef.current) clearTimeout(tooltipDelayRef.current);
        tooltipDelayRef.current = setTimeout(() => {
          tooltipDelayRef.current = null;
          showTooltipForMarker(m);
        }, 200);
      });
      // Cancel pending tooltip delay on mouseout
      markerLayer.registerEventHandler(instance.id, "mouseout", () => {
        if (tooltipDelayRef.current) {
          clearTimeout(tooltipDelayRef.current);
          tooltipDelayRef.current = null;
        }
      });
      // Note: full mouseout closing is handled by safe zone tracking in the parent component

      markerLayer.registerEventHandler(instance.id, "click", (m) => {
        // Cancel any pending hover delay and open immediately on click
        if (tooltipDelayRef.current) {
          clearTimeout(tooltipDelayRef.current);
          tooltipDelayRef.current = null;
        }
        justClickedMarkerRef.current = true;
        showTooltipForMarker(m);
        const s = newSpawnMap.get(m.id);
        if (s && !s.address) {
          onClick(getNodeId(s));
        }
      });

      markerLayer.registerEventHandler(instance.id, "contextmenu", (m) => {
        const s = newSpawnMap.get(m.id);
        if (!s) return;
        const nodeId = getNodeId(s);
        const isStacked = Boolean(s.cluster && s.cluster.length > 0);
        const wasDiscovered = checkNodeDiscovered(nodeId, discoveryLookupRef.current);
        if (isStacked) {
          s.cluster!.forEach((stackedSpawn) => {
            setDiscoverNode(getNodeId(stackedSpawn), !wasDiscovered);
          });
        }
        setDiscoverNode(nodeId, !wasDiscovered);
      });
    }

    // Update spawn map ref
    spawnMapRef.current = newSpawnMap;

    // Handle map click to close tooltip and deselect node
    // When a marker is clicked, justClickedMarkerRef is set to prevent
    // the generic map click from undoing the selection.
    const handleMapClick = () => {
      if (justClickedMarkerRef.current) {
        justClickedMarkerRef.current = false;
        return;
      }
      onTooltipOpen(false);
      onClick(null);
    };
    map.on("click", handleMapClick);

    devLog.info("Markers", "Effect run completed", {
      runId,
      markersAdded: newSpawnMap.size,
    });

    return () => {
      devLog.info("Markers", "Cleanup running", {
        runId,
        markersToRemove: newSpawnMap.size,
      });
      map.off("click", handleMapClick);
      // Batch unregister event handlers and remove markers
      const idsToRemove = Array.from(newSpawnMap.keys());
      for (const id of idsToRemove) {
        markerLayer.unregisterAllEventHandlers(id);
      }
      markerLayer.removeMany(idsToRemove);
    };
  }, [
    map,
    map?.markerLayer,
    spawns,
    sharedMyFilters,
    hideDiscoveredNodes,
    discoveryLookup,
    tempPrivateNodeId,
    selectedNodeId,
    highlightSpawnIDs,
    rotationCache,
    baseIconSize,
    iconSizeByFilter,
    iconSizeByGroup,
    typeToGroup,
    throttledPlayer,
    markerOptions.zPos,
    colorBlindMode,
    colorBlindSeverity,
    iconLoadVersion, // Re-run when images finish loading to apply processed icons
  ]);

  // Audio alerts when player is within range of tracked spawns
  useEffect(() => {
    if (
      audioAlertsMuted ||
      !throttledPlayer ||
      spawnMapRef.current.size === 0
    )
      return;

    // Check if any audio alert is enabled
    const hasAnyAudioAlert = Object.values(audioAlertByFilter).some(Boolean);
    if (!hasAnyAudioAlert) return;

    // Apply rotation to player position if needed
    let playerX = throttledPlayer.x;
    let playerY = throttledPlayer.y;
    if (rotationCache) {
      const rotatedPlayer = rotationCache.getRotated(
        throttledPlayer.x,
        throttledPlayer.y,
      );
      playerX = rotatedPlayer[0];
      playerY = rotatedPlayer[1];
    }

    const rangeSq = audioAlertRange * audioAlertRange;

    // Check if any spawn with audio alerts enabled is in range
    let anyInRange = false;
    for (const spawn of spawnMapRef.current.values()) {
      if (!audioAlertByFilter[spawn.type]) continue;

      // Apply rotation to spawn position if needed
      let spawnX = spawn.p[0];
      let spawnY = spawn.p[1];
      if (rotationCache) {
        const rotatedSpawn = rotationCache.getRotated(spawnX, spawnY);
        spawnX = rotatedSpawn[0];
        spawnY = rotatedSpawn[1];
      }

      const dx = playerX - spawnX;
      const dy = playerY - spawnY;

      if (dx * dx + dy * dy <= rangeSq) {
        anyInRange = true;
        break;
      }
    }

    if (anyInRange) {
      // Play sound only on transition from none to some in range
      if (!hasAlertedRef.current) {
        hasAlertedRef.current = true;
        playAlertSound(audioAlertSound, audioAlertVolume);
      }
    } else {
      // Reset when all spawns are out of range
      hasAlertedRef.current = false;
    }
  }, [
    throttledPlayer,
    spawns,
    audioAlertsMuted,
    audioAlertRange,
    audioAlertByFilter,
    audioAlertSound,
    audioAlertVolume,
    rotationCache,
  ]);


  // Label rendering using DrawingLayer text shapes
  // Tracks which labels are currently shown for "inRange" mode
  const activeLabelsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!map) return;

    // Check if any filter has a label mode set
    const hasAnyLabels = Object.values(labelModeByFilter).some(
      (m) => m && m !== "off",
    );
    if (!hasAnyLabels) {
      // Clean up label layer if no labels needed
      if (labelLayerRef.current) {
        labelLayerRef.current.clearShapes();
        map.removeLayer(labelLayerRef.current);
        labelLayerRef.current = null;
      }
      activeLabelsRef.current.clear();
      return;
    }

    // Create label layer if needed
    if (!labelLayerRef.current) {
      labelLayerRef.current = new DrawingLayer({ interactive: false });
      map.addLayer(labelLayerRef.current, { zIndex: 150 });
    }

    const layer = labelLayerRef.current;
    layer.clearShapes();
    activeLabelsRef.current.clear();

    const fontSize = 12 * labelTextSize;

    // Add "always" and "hotkey" mode labels
    for (const [id, spawn] of spawnMapRef.current) {
      const mode = labelModeByFilter[spawn.type];
      if (!mode || mode === "off" || mode === "inRange") continue;

      if (mode === "hotkey" && !showLabelsActive) continue;

      // Compute position with rotation
      let pos: [number, number] = [spawn.p[0], spawn.p[1]];
      if (rotationCache) {
        pos = rotationCache.getRotated(spawn.p[0], spawn.p[1]);
      }

      layer.addShape({
        id: `label_${id}`,
        type: "text",
        center: pos,
        text: t(spawn.type),
        size: fontSize,
        color: "#FFFFFFEE",
        textAnchor: "bottom",
        textOffset: [0, -14],
        mapName: map.mapName,
      });
      activeLabelsRef.current.add(id);
    }

    // For "inRange" mode, add labels for markers near the player
    if (rotatedPlayer) {
      const playerX = rotatedPlayer.x;
      const playerY = rotatedPlayer.y;
      const rangeSq = audioAlertRange * audioAlertRange;

      const useSpatialGrid =
        spatialGridRef.current && spatialGridRef.current.size > 100;

      const itemsToCheck = useSpatialGrid
        ? spatialGridRef.current!.getNearby(playerX, playerY, audioAlertRange)
        : Array.from(spawnMapRef.current.entries()).map(([id, spawn]) => {
            let latLng: [number, number] = [spawn.p[0], spawn.p[1]];
            if (rotationCache) {
              latLng = rotationCache.getRotated(spawn.p[0], spawn.p[1]);
            }
            return { id, spawn, latLng };
          });

      for (const item of itemsToCheck) {
        const mode = labelModeByFilter[item.spawn.type];
        if (mode !== "inRange") continue;

        const dx = playerX - item.latLng[0];
        const dy = playerY - item.latLng[1];
        if (dx * dx + dy * dy <= rangeSq) {
          layer.addShape({
            id: `label_${item.id}`,
            type: "text",
            center: item.latLng,
            text: t(item.spawn.type),
            size: fontSize,
            color: "#FFFFFFEE",
            textAnchor: "bottom",
            textOffset: [0, -14],
            mapName: map.mapName,
          });
          activeLabelsRef.current.add(item.id);
        }
      }
    }

    return () => {
      if (labelLayerRef.current) {
        labelLayerRef.current.clearShapes();
        map.removeLayer(labelLayerRef.current);
        labelLayerRef.current = null;
      }
      activeLabelsRef.current.clear();
    };
  }, [
    map,
    spawns,
    labelModeByFilter,
    labelTextSize,
    showLabelsActive,
    rotatedPlayer,
    audioAlertRange,
    rotationCache,
    t,
  ]);

  // Fit bounds when spawns change
  useEffect(() => {
    if (!fitBoundsOnChange || liveMode || spawns.length === 0 || !map) {
      return;
    }
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // WebMap doesn't have flyToBounds, use fitBounds if available
    if (typeof (map as any).fitBounds === "function") {
      try {
        const bounds = spawns.map((spawn) => spawn.p);
        (map as any).fitBounds(bounds);
      } catch (e) {
        // ignore
      }
    }
  }, [spawns, fitBoundsOnChange, liveMode, map]);

  return <></>;
}
