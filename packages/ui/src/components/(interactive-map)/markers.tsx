"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
} from "@repo/lib";
import { IconMarkerLayer, type IconMarkerInstance, DEFAULT_CIRCLE_SHEET } from "@repo/lib/web-map";
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

  // Block wheel events from reaching the map canvas when over the tooltip
  const tooltipWheelRef = useCallback(
    (node: HTMLDivElement | null) => {
      tooltipRef.current = node;
      if (!node) return;

      const handleWheel = (e: WheelEvent) => {
        // Check if inside a scrollable child that can still scroll
        let el = e.target as HTMLElement | null;
        while (el && el !== node) {
          if (el.scrollHeight > el.clientHeight) {
            const atTop = el.scrollTop <= 0;
            const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
            if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
              // Let the scrollable child handle it, but still block page/map scroll
              e.stopPropagation();
              return;
            }
          }
          el = el.parentElement;
        }
        // Block both page scroll and map zoom
        e.preventDefault();
        e.stopPropagation();
      };

      node.addEventListener("wheel", handleWheel, {
        passive: false,
        capture: true,
      });
    },
    [],
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
      if (tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        const tl = tooltipRect.left - containerRect.left;
        const tr = tooltipRect.right - containerRect.left;
        const tt = tooltipRect.top - containerRect.top;
        const tb = tooltipRect.bottom - containerRect.top;

        // Expanded tooltip rect with small padding for easier hover
        const pad = 5;
        if (mouseX >= tl - pad && mouseX <= tr + pad && mouseY >= tt - pad && mouseY <= tb + pad) {
          return true;
        }

        // Narrow corridor connecting icon center to tooltip edge
        const corridorHW = radius + 4;
        // Vertical corridor (tooltip above or below)
        if (Math.abs(mouseX - x) <= corridorHW) {
          const minY = Math.min(y - radius, tt);
          const maxY = Math.max(y + radius, tb);
          if (mouseY >= minY && mouseY <= maxY) {
            return true;
          }
        }
      }

      return false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Close tooltip if hovering over any UI overlay outside the map canvas and tooltip
      const target = e.target as HTMLElement;
      const canvas = containerRef.current?.querySelector("canvas");
      const isOverCanvas = canvas && canvas.contains(target);
      const isOverTooltip = tooltipRef.current?.contains(target);
      if (!isOverCanvas && !isOverTooltip) {
        setTooltipIsOpen(false);
        return;
      }
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

  // Get container for tooltip coordinate reference
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
            <TooltipPositioner
              ref={tooltipWheelRef}
              x={tooltipData.x}
              y={tooltipData.y}
              radius={tooltipData.radius}
              containerRef={containerRef}
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
            </TooltipPositioner>,
            document.body
          )
        : null}
    </>
  );
}

/** Viewport-aware tooltip that repositions if it would overflow */
const TooltipPositioner = React.forwardRef<
  HTMLDivElement,
  {
    x: number;
    y: number;
    radius: number;
    containerRef: React.RefObject<HTMLElement | null>;
    children: React.ReactNode;
  }
>(function TooltipPositioner({ x, y, radius, containerRef, children }, ref) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ transform: "" });

  const reposition = useCallback(() => {
    const el = innerRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const gap = 2;
    const rect = el.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Convert container-relative x/y to viewport coordinates
    const vx = cRect.left + x;
    const vy = cRect.top + y;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: above, centered
    let tx = vx - w / 2;
    let ty = vy - h - radius - gap;

    // If overflows top, place below
    if (ty < 0) {
      ty = vy + radius + gap;
    }
    // If overflows bottom too, just clamp
    if (ty + h > vh) {
      ty = Math.max(0, vh - h);
    }
    // Clamp horizontal to viewport
    if (tx < 0) tx = 0;
    if (tx + w > vw) tx = Math.max(0, vw - w);

    setPos({ transform: `translate3d(${tx}px, ${ty}px, 0px)` });
  }, [x, y, radius, containerRef]);

  // Reposition on mount and when tooltip resizes (e.g. async content loads)
  useEffect(() => {
    reposition();
    const el = innerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(reposition);
    observer.observe(el);
    return () => observer.disconnect();
  }, [reposition]);

  return (
    <div
      ref={(node) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className="cursor-default z-[999999] rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md outline-none w-[260px] max-h-[70vh]"
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        pointerEvents: "auto",
        ...pos,
      }}
    >
      {children}
    </div>
  );
});

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
  const dynamicIconSize = useSettingsStore((state) => state.dynamicIconSize);
  const dynamicIconSizeFactor = useSettingsStore((state) => state.dynamicIconSizeFactor);
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
  // Cache for text label canvases (keyed by text content + fontSize)
  const labelCanvasCache = useRef<Map<string, { canvas: HTMLCanvasElement; width: number; height: number }>>(new Map());
  const activeLabelIds = useRef<Set<string>>(new Set());

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
  const processedIconCache = useRef<Map<string, { canvas: HTMLCanvasElement; logicalWidth: number; logicalHeight: number }>>(new Map());
  const processSheetIcon = (
    sourceImg: HTMLImageElement,
    rect: { x: number; y: number; width: number; height: number },
  ): { canvas: HTMLCanvasElement; logicalWidth: number; logicalHeight: number } => {
    // Render at device pixel ratio for crisp icons on high-DPI displays.
    const dpr = window.devicePixelRatio || 1;
    const logicalW = rect.width + ICON_PADDING * 2;
    const logicalH = rect.height + ICON_PADDING * 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

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

    return { canvas, logicalWidth: logicalW, logicalHeight: logicalH };
  };

  // Helper to create a colored circle image for private nodes
  const createColoredCircleImage = (color: string): HTMLImageElement => {
    const cacheKey = `__circle_${color}__`;
    const cached = coloredCircleCache.current.get(cacheKey);
    if (cached && cached.complete) {
      return cached;
    }

    const size = 64;
    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

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


  // Main effect: add/update/remove markers
  useEffect(() => {
    const markerLayer = map?.markerLayer;
    const liveMarkerLayer = map?.liveMarkerLayer;
    if (!map || !markerLayer) return;

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

    // Set dynamic icon sizing
    markerLayer.setDynamicSizeFactor(dynamicIconSize ? dynamicIconSizeFactor : 0);

    // Set high contrast mode
    markerLayer.setHighContrastMode(highContrastMode);
    markerLayer.setHighContrastColor(highContrastColor);
    markerLayer.setHighContrastThickness(highContrastThickness);

    // Mirror settings to live marker layer
    if (liveMarkerLayer) {
      liveMarkerLayer.setColorBlindMode(colorBlindMode);
      liveMarkerLayer.setColorBlindSeverity(colorBlindSeverity);
      liveMarkerLayer.setDynamicSizeFactor(dynamicIconSize ? dynamicIconSizeFactor : 0);
      liveMarkerLayer.setHighContrastMode(highContrastMode);
      liveMarkerLayer.setHighContrastColor(highContrastColor);
      liveMarkerLayer.setHighContrastThickness(highContrastThickness);
    }

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
        // Use physical pixel size for UV mapping (canvas was DPR-scaled)
        const circlePx = Math.round(64 * (window.devicePixelRatio || 1));
        rect = { x: 0, y: 0, width: circlePx, height: circlePx };
      } else if (!markerIcon) {
        // No icon at all - use default circle sheet
        sheet = DEFAULT_CIRCLE_SHEET;
        const defaultCirclePx = Math.round(64 * (window.devicePixelRatio || 1));
        rect = { x: 0, y: 0, width: defaultCirclePx, height: defaultCirclePx };
      }

      // Pre-process sprite sheet icons using canvas 2D.
      // This isolates each icon from the atlas (preventing cross-icon bleeding
      // in WebGL bilinear filtering) and applies a subtle shadow.
      if (sheet === "icons" && !useProcessedIcon && spriteSheetSource) {
        const processedKey = `__processed_icon_${rect.x}_${rect.y}_${rect.width}_${rect.height}_${dpr}__`;
        const cached = processedIconCache.current.get(processedKey);
        if (cached) {
          // Scale size up to compensate for padding so icon appears at correct visual size
          size *= cached.logicalWidth / rect.width;
          sheet = processedKey;
          markerLayer.setSheet(sheet, cached.canvas);
          // Use physical pixel dimensions for UV mapping (canvas.width matches texture size)
          rect = { x: 0, y: 0, width: cached.canvas.width, height: cached.canvas.height };
        } else {
          const processed = processSheetIcon(spriteSheetSource, rect);
          processedIconCache.current.set(processedKey, processed);
          // Scale size up to compensate for padding so icon appears at correct visual size
          size *= processed.logicalWidth / rect.width;
          sheet = processedKey;
          markerLayer.setSheet(sheet, processed.canvas);
          // Use physical pixel dimensions for UV mapping (canvas.width matches texture size)
          rect = { x: 0, y: 0, width: processed.canvas.width, height: processed.canvas.height };
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

      // Read spider offset from pre-processed synthetic spawns
      const spiderOffsetX = spawn.spiderOffsetX;
      const spiderOffsetY = spawn.spiderOffsetY;

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
        tint: spawn.isPrivate && markerIcon && !useProcessedIcon ? spawn.color : undefined,
        isStacked,
        spiderOffsetX,
        spiderOffsetY,
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

    // Pre-process spawns: split mixed-type clusters into per-type sub-spawns
    // arranged in a circle. Same-type clusters are left as-is.
    const processedSpawns: Spawn[] = [];
    for (const spawn of spawns) {
      if (!spawn.cluster || spawn.cluster.length === 0) {
        processedSpawns.push(spawn);
        continue;
      }
      // Check how many unique types are in this cluster (including the parent)
      // Only include items whose type has an active filter (is in the icons map or is private)
      const allItems = [spawn, ...spawn.cluster].filter(
        (item) => icons.has(item.type) || item.isPrivate
      );
      if (allItems.length === 0) continue; // all types filtered out
      const typeGroups = new Map<string, (Spawn | Omit<Spawn, "cluster">)[]>();
      for (const item of allItems) {
        const arr = typeGroups.get(item.type) ?? [];
        arr.push(item);
        typeGroups.set(item.type, arr);
      }

      if (typeGroups.size <= 1) {
        // Same-type cluster — keep as-is (original stacked behavior)
        processedSpawns.push(spawn);
        continue;
      }

      // Mixed-type: create one sub-spawn per type group, arranged in a circle
      const groupCount = typeGroups.size;
      const iconSize = (markerOptions.radius * (icons.get(spawn.type)?.size ?? 1) * 4 - 1)
        * baseIconSize * dpr;
      const radius = iconSize * 0.75; // 3/4 icon size from center
      let groupIdx = 0;
      for (const [type, items] of typeGroups) {
        const angle = (2 * Math.PI * groupIdx) / groupCount - Math.PI / 2;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;

        // Use the first item as the representative spawn
        const representative = items[0] as Spawn;
        // Build sub-cluster from remaining same-type items (if any)
        const subCluster = items.length > 1
          ? items.slice(1).map((item) => ({ ...item } as Omit<Spawn, "cluster">))
          : undefined;

        // Create synthetic spawn with spider offset.
        // Use the parent's position as center so all groups share the same origin.
        const syntheticSpawn: Spawn = {
          ...representative,
          p: spawn.p,
          cluster: subCluster,
          spiderOffsetX: offsetX,
          spiderOffsetY: offsetY,
        };

        processedSpawns.push(syntheticSpawn);
        groupIdx++;
      }
    }
    processedSpawns.forEach(handleSpawn);

    // Process shared private spawns
    const sharedPrivateSpawns = sharedMyFilters.flatMap<Spawns[number]>(
      (myFilter) => {
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

    // Add center dots for spiderfied clusters (only where spider markers exist)
    {
      const seenCenters = new Set<string>();
      const len = markerInstances.length; // fixed length — don't iterate newly added dots
      for (let ci = 0; ci < len; ci++) {
        const inst = markerInstances[ci];
        if (!inst.spiderOffsetX && !inst.spiderOffsetY) continue;
        const key = `${inst.latLng[0]}_${inst.latLng[1]}`;
        if (seenCenters.has(key)) continue;
        seenCenters.add(key);
        const centerId = `__center_${key}`;
        newSpawnMap.set(centerId, { id: centerId, p: inst.latLng, type: "__center" } as Spawn);
        markerInstances.push({
          id: centerId,
          latLng: inst.latLng,
          size: Math.max(inst.size * 0.25, 6 * dpr),
          sheet: DEFAULT_CIRCLE_SHEET,
          rect: { x: 0, y: 0, width: Math.round(64 * dpr), height: Math.round(64 * dpr) },
          key: "__center",
          keepUpright: true,
          alwaysOnTop: true,
          noHitTest: true,
        });
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

    // Batch remove old markers and their event handlers from both layers
    if (toRemove.length > 0) {
      const staticToRemove: string[] = [];
      const liveToRemove: string[] = [];
      for (const id of toRemove) {
        const oldSpawn = spawnMapRef.current.get(id);
        if (oldSpawn?.address && liveMarkerLayer) {
          liveMarkerLayer.unregisterAllEventHandlers(id);
          liveToRemove.push(id);
        } else {
          markerLayer.unregisterAllEventHandlers(id);
          staticToRemove.push(id);
        }
      }
      if (staticToRemove.length > 0) markerLayer.removeMany(staticToRemove);
      if (liveToRemove.length > 0) liveMarkerLayer?.removeMany(liveToRemove);
    }

    // Share icon sheets with live marker layer so live actors can use the same sprites
    if (liveMarkerLayer) {
      markerLayer.copySheets(liveMarkerLayer);
    }

    // Add or update markers, routing live actors to liveMarkerLayer
    // Note: We always re-register handlers to avoid stale closures from previous renders
    for (const instance of markerInstances) {
      const spawn = newSpawnMap.get(instance.id);
      const isLive = spawn?.address && liveMarkerLayer;
      const targetLayer = isLive ? liveMarkerLayer : markerLayer;
      targetLayer.add(instance); // This handles both add and update

      // Register event handlers (always, to capture fresh closure)
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

        // Offset for spiderfied markers (screen-space, scaled by dynamic icon size)
        if (m.spiderOffsetX || m.spiderOffsetY) {
          const midZoom = (state.minZoom + state.maxZoom) * 0.5;
          const factor = dynamicIconSize ? dynamicIconSizeFactor : 0;
          const zoomSizeScale = factor > 0.001
            ? Math.max(0.25, Math.min(2.5, Math.pow(Math.pow(2, state.zoom - midZoom), factor)))
            : 1;
          screenX += (m.spiderOffsetX ?? 0) * zoomSizeScale / dpr;
          screenY += (m.spiderOffsetY ?? 0) * zoomSizeScale / dpr;
        }

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
            p: s.p,
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
              p: stackedSpawn.p,
            }))
          );
        }

        // Compute screen-pixel radius by projecting the icon edge
        const midZoom = (state.minZoom + state.maxZoom) * 0.5;
        const factor = dynamicIconSize ? dynamicIconSizeFactor : 0;
        const zoomSizeScale = factor > 0.001
          ? Math.max(0.25, Math.min(2.5, Math.pow(Math.pow(2, state.zoom - midZoom), factor)))
          : 1;
        const halfWorld = (m.size * zoomSizeScale) / 2;
        const edgeClipX = view[0] * (worldPos.x + halfWorld) + view[3] * worldPos.y + view[6];
        const edgeScreenX = (edgeClipX * 0.5 + 0.5) * rect.width;
        const screenRadius = Math.abs(edgeScreenX - screenX);

        onTooltipData({
          x: screenX,
          y: screenY,
          radius: screenRadius,
          items,
          latLng: s.p,
        });
        onTooltipOpen(true);
      };

      targetLayer.registerEventHandler(instance.id, "mouseover", (m) => {
        // Delay tooltip open to avoid interfering with map interactions
        if (tooltipDelayRef.current) clearTimeout(tooltipDelayRef.current);
        tooltipDelayRef.current = setTimeout(() => {
          tooltipDelayRef.current = null;
          // Don't open tooltip if cursor is over a UI overlay (map controls, filters, etc.)
          // Check the topmost element at the marker's screen position
          const canvas = map?.getContainer();
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const state = (map as any).lastState;
            if (state) {
              const worldPos = state.projection(m.latLng);
              const view = state.viewMatrix;
              const clipX = view[0] * worldPos.x + view[3] * worldPos.y + view[6];
              const clipY = view[1] * worldPos.x + view[4] * worldPos.y + view[7];
              const sx = (clipX * 0.5 + 0.5) * rect.width + rect.left;
              const sy = (1 - (clipY * 0.5 + 0.5)) * rect.height + rect.top;
              const topEl = document.elementFromPoint(sx, sy);
              if (topEl && !canvas.contains(topEl)) return;
            }
          }
          showTooltipForMarker(m);
        }, 200);
      });
      // Cancel pending tooltip delay on mouseout
      targetLayer.registerEventHandler(instance.id, "mouseout", () => {
        if (tooltipDelayRef.current) {
          clearTimeout(tooltipDelayRef.current);
          tooltipDelayRef.current = null;
        }
      });
      // Note: full mouseout closing is handled by safe zone tracking in the parent component

      targetLayer.registerEventHandler(instance.id, "click", (m) => {
        // Cancel any pending hover delay and open immediately on click
        if (tooltipDelayRef.current) {
          clearTimeout(tooltipDelayRef.current);
          tooltipDelayRef.current = null;
        }
        justClickedMarkerRef.current = true;
        showTooltipForMarker(m);
        const s = newSpawnMap.get(m.id);
        if (s && !s.address) {
          const nodeId = getNodeId(s);
          onClick(selectedNodeId === nodeId ? null : nodeId);
        }
      });

      targetLayer.registerEventHandler(instance.id, "contextmenu", (m) => {
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

    return () => {
      map.off("click", handleMapClick);
      // Batch unregister event handlers and remove markers from both layers
      const staticIds: string[] = [];
      const liveIds: string[] = [];
      for (const [id, s] of newSpawnMap) {
        if (s.address && liveMarkerLayer) {
          liveMarkerLayer.unregisterAllEventHandlers(id);
          liveIds.push(id);
        } else {
          markerLayer.unregisterAllEventHandlers(id);
          staticIds.push(id);
        }
      }
      if (staticIds.length > 0) markerLayer.removeMany(staticIds);
      if (liveIds.length > 0) liveMarkerLayer?.removeMany(liveIds);
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
    dynamicIconSize,
    dynamicIconSizeFactor,
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


  // Label rendering using canvas-rendered text as WebGL markers on the main marker layer
  useEffect(() => {
    const markerLayer = map?.markerLayer;
    if (!map || !markerLayer) return;

    // Remove previous labels
    for (const labelId of activeLabelIds.current) {
      markerLayer.remove(labelId);
    }
    activeLabelIds.current.clear();

    // Check if any filter has a label mode set
    const hasAnyLabels = Object.values(labelModeByFilter).some(
      (m) => m && m !== "off",
    );
    if (!hasAnyLabels) return;

    const dpr = window.devicePixelRatio || 1;
    const fontSize = Math.round(14 * labelTextSize);
    const pad = 6;
    const cache = labelCanvasCache.current;

    // Helper: get or create a DPR-scaled canvas with rendered text.
    // Returns logical width/height; the canvas pixels are DPR-scaled for crisp text.
    const getTextCanvas = (text: string) => {
      const key = `${text}__${fontSize}__${dpr}`;
      let entry = cache.get(key);
      if (entry) return entry;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const font = `700 ${fontSize}px Arial, system-ui, sans-serif`;
      ctx.font = font;
      const metrics = ctx.measureText(text);
      const w = Math.ceil(metrics.width) + pad * 2;
      const h = fontSize + pad * 2;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // Scale context for high-DPI rendering
      ctx.scale(dpr, dpr);

      // Re-set font after resize
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Text shadow (outline)
      const shadowColor = "#594f42";
      for (const [dx, dy] of [[-1,-1],[1,-1],[-1,1],[1,1],[0,-1],[0,1],[-1,0],[1,0]]) {
        ctx.fillStyle = shadowColor;
        ctx.fillText(text, w / 2 + dx, h / 2 + dy);
      }
      ctx.fillStyle = "#FFFFFFEE";
      ctx.fillText(text, w / 2, h / 2);

      entry = { canvas, width: w, height: h };
      cache.set(key, entry);
      return entry;
    };

    // Helper: add a label marker to the main marker layer
    const addLabel = (id: string, pos: [number, number], text: string) => {
      const { canvas, width, height } = getTextCanvas(text);
      const sheetName = `__label_${text}__${fontSize}`;
      markerLayer.setSheet(sheetName, canvas);
      const labelId = `__label_${id}`;
      // Get the icon marker's size to offset label above it
      const iconMarker = markerLayer.getMarker(id);
      const iconSize = iconMarker?.size ?? 40 * dpr;
      markerLayer.add({
        id: labelId,
        latLng: pos,
        size: height * dpr,
        sizeW: width * dpr,
        screenOffsetY: -(iconSize / 2 + height * dpr / 2 + 2),
        sheet: sheetName,
        // Use physical pixel dimensions for UV mapping (canvas is DPR-scaled)
        rect: { x: 0, y: 0, width: canvas.width, height: canvas.height },
        keepUpright: true,
        noHitTest: true,
      });
      activeLabelIds.current.add(labelId);
    };

    // Add "always" and "hotkey" mode labels
    for (const [id, spawn] of spawnMapRef.current) {
      const mode = labelModeByFilter[spawn.type];
      if (!mode || mode === "off" || mode === "inRange") continue;
      if (mode === "hotkey" && !showLabelsActive) continue;

      let pos: [number, number] = [spawn.p[0], spawn.p[1]];
      if (rotationCache) {
        pos = rotationCache.getRotated(spawn.p[0], spawn.p[1]);
      }
      addLabel(id, pos, t(spawn.type));
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
          addLabel(item.id, item.latLng, t(item.spawn.type));
        }
      }
    }

    return () => {
      // Clean up labels from the main marker layer
      if (map?.markerLayer) {
        for (const labelId of activeLabelIds.current) {
          map.markerLayer.remove(labelId);
        }
      }
      activeLabelIds.current.clear();
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
