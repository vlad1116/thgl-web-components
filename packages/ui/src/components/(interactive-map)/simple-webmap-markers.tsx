"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconMarkerLayer,
  type IconMarkerInstance,
  DEFAULT_CIRCLE_SHEET,
} from "@repo/lib/web-map";
import {
  getIconsUrl,
  getNodeId,
  useSettingsStore,
  useGameState,
  type SimpleSpawn,
  type MarkerOptions,
} from "@repo/lib";
import { MarkerTooltip, TooltipItems } from "./marker-tooltip";
import { AdditionalTooltipType } from "../(content)";
import type { SimpleWebMapRef } from "./simple-webmap";

export function SimpleWebMarkers({
  appName,
  spawns,
  onClick,
  highlightedIds = [],
  iconsPath,
  withoutDiscoveredNodes = false,
  additionalTooltip,
  mapRef,
  markerOptions,
}: {
  appName: string;
  spawns: SimpleSpawn[];
  onClick?: (spawn: SimpleSpawn) => void;
  highlightedIds?: string[];
  iconsPath: string;
  withoutDiscoveredNodes?: boolean;
  additionalTooltip?: AdditionalTooltipType;
  mapRef: React.MutableRefObject<SimpleWebMapRef | null>;
  markerOptions?: MarkerOptions;
}) {
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const iconSizeByFilter = useSettingsStore((state) => state.iconSizeByFilter);
  const player = useGameState((state) => state.player);
  const [tooltipIsOpen, setTooltipIsOpen] = useState(false);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    radius: number;
    latLng: [number, number] | [number, number, number];
    items: TooltipItems;
  } | null>(null);
  const hideDiscoveredNodes = useSettingsStore(
    (state) => state.hideDiscoveredNodes,
  );
  const setDiscoverNode = useSettingsStore((state) => state.setDiscoverNode);
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);
  const discoveredSet = useMemo(
    () => new Set(discoveredNodes),
    [discoveredNodes],
  );
  const spawnMapRef = useRef<Map<string, SimpleSpawn>>(new Map());
  const containerRef = useRef<HTMLElement | null>(null);
  const justClickedMarkerRef = useRef(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Load sprite sheet and add markers
  useEffect(() => {
    const ref = mapRef.current;
    if (!ref?.markerLayer || !ref?.webmap) {
      return;
    }

    const markerLayer = ref.markerLayer;
    const webmap = ref.webmap;

    // Load the icon sprite sheet
    const iconUrl = getIconsUrl(appName, "icons.webp", iconsPath);
    markerLayer.addSheet("icons", iconUrl);

    // Build spawn map for lookups
    const spawnMap = new Map<string, SimpleSpawn>();
    spawns.forEach((spawn) => {
      spawnMap.set(spawn.id, spawn);
    });
    spawnMapRef.current = spawnMap;

    // Get container for tooltip portal
    containerRef.current = webmap.getContainer()?.parentElement ?? null;

    // Add markers
    const baseRadius = 12;
    const dpr = window.devicePixelRatio || 1;
    const markerIds: string[] = [];

    for (const spawn of spawns) {
      let isDiscovered = false;
      if (!withoutDiscoveredNodes) {
        const nodeId = getNodeId(spawn);
        if (nodeId.includes("@")) {
          const [baseId] = nodeId.split("@");
          isDiscovered = discoveredSet.has(nodeId) || discoveredSet.has(baseId);
        } else {
          isDiscovered = discoveredSet.has(nodeId);
        }

        if (isDiscovered && hideDiscoveredNodes) {
          continue;
        }
      }

      const rawIcon = spawn.icon;
      // Multiply by DPR to maintain consistent visual size across devices
      // Apply per-filter icon size multiplier if available
      const filterMultiplier = spawn.type ? (iconSizeByFilter[spawn.type] ?? 1) : 1;
      const size = baseRadius * 2 * baseIconSize * filterMultiplier * dpr;

      // Determine sheet and icon rect
      // If no icon is provided, use the default circle sheet
      let sheetName = "icons";
      let iconRect = { x: 0, y: 0, width: 32, height: 32 };

      if (!rawIcon) {
        // No icon - use default circle
        sheetName = DEFAULT_CIRCLE_SHEET;
        iconRect = { x: 0, y: 0, width: 64, height: 64 };
      } else if (typeof rawIcon !== "string" && "x" in rawIcon) {
        // Icon with sprite rect
        iconRect = {
          x: rawIcon.x ?? 0,
          y: rawIcon.y ?? 0,
          width: rawIcon.width ?? 32,
          height: rawIcon.height ?? 32,
        };
      }

      // Only calculate altitude indicator when player position is available AND zPos config exists
      let zPos: "top" | "bottom" | null = null;
      let zValue: number | undefined = undefined;
      if (markerOptions?.zPos && player && spawn.p[2] !== undefined) {
        const { xyMaxDistance, zDistance } = markerOptions.zPos;
        // Check XY distance first
        const dx = player.x - spawn.p[0];
        const dy = player.y - spawn.p[1];
        const xyDistSq = dx * dx + dy * dy;
        const maxDistSq = xyMaxDistance * xyMaxDistance;

        if (xyDistSq <= maxDistSq) {
          const dz = player.z - spawn.p[2];
          if (dz > zDistance) {
            zPos = "bottom"; // Player is above spawn
            zValue = -dz;
          } else if (dz < -zDistance) {
            zPos = "top"; // Player is below spawn
            zValue = -dz;
          }
        }
      }

      const marker: IconMarkerInstance = {
        id: spawn.id,
        latLng: [spawn.p[0], spawn.p[1]],
        size,
        sheet: sheetName,
        rect: iconRect,
        key: spawn.name,
        z: zValue,
        zPos,
        isHighlighted: highlightedIds.includes(spawn.id),
        isDiscovered,
        keepUpright: true,
      };

      markerLayer.add(marker);
      markerIds.push(spawn.id);

      // Helper to show tooltip for a marker
      const showTooltipForMarker = (m: IconMarkerInstance) => {
        const s = spawnMapRef.current.get(m.id);
        if (!s) return;

        // Get screen position
        const canvas = webmap.getContainer();
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const state = (webmap as any).lastState;
        if (!state) return;

        const worldPos = state.projection(m.latLng);
        const view = state.viewMatrix;
        const clipX = view[0] * worldPos.x + view[3] * worldPos.y + view[6];
        const clipY = view[1] * worldPos.x + view[4] * worldPos.y + view[7];
        const screenX = (clipX * 0.5 + 0.5) * rect.width;
        const screenY = (1 - (clipY * 0.5 + 0.5)) * rect.height;

        setTooltipData({
          x: screenX,
          y: screenY,
          radius: m.size / 2 / (window.devicePixelRatio || 1), // Convert to CSS pixels
          items: [
            {
              id: s.id,
              termId: s.name,
              description: s.description,
              type: "",
            },
          ],
          latLng: s.p,
        });
        setTooltipIsOpen(true);
      };

      // Register event handlers
      markerLayer.registerEventHandler(spawn.id, "mouseover", (m) => {
        showTooltipForMarker(m);
      });

      markerLayer.registerEventHandler(spawn.id, "mouseout", () => {
        setTooltipIsOpen(false);
      });

      // Click handler - show tooltip on tap (for touch devices) and call onClick
      markerLayer.registerEventHandler(spawn.id, "click", (m) => {
        const s = spawnMapRef.current.get(m.id);
        if (!s) return;

        // Mark that we just clicked a marker (to prevent map click from closing tooltip)
        justClickedMarkerRef.current = true;

        // Show tooltip on click/tap (essential for touch devices)
        showTooltipForMarker(m);

        // Also call onClick if provided
        if (onClick) {
          onClick(s);
        }
      });

      markerLayer.registerEventHandler(spawn.id, "contextmenu", (m) => {
        if (withoutDiscoveredNodes) return;
        const s = spawnMapRef.current.get(m.id);
        if (!s) return;
        const nodeId = getNodeId(s);
        const wasDiscovered = discoveredSet.has(nodeId);
        setDiscoverNode(nodeId, !wasDiscovered);
      });
    }

    // Listen for map clicks to close tooltip when clicking elsewhere
    const handleMapClick = () => {
      // If we just clicked a marker, don't close the tooltip
      if (justClickedMarkerRef.current) {
        justClickedMarkerRef.current = false;
        return;
      }
      setTooltipIsOpen(false);
    };
    webmap.on("click", handleMapClick);

    // Listen for clicks outside the map to close tooltip
    const handleDocumentClick = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      // If click is outside the container, close tooltip
      if (!container.contains(e.target as Node)) {
        setTooltipIsOpen(false);
      }
    };
    document.addEventListener("click", handleDocumentClick);

    return () => {
      // Remove click listeners
      document.removeEventListener("click", handleDocumentClick);
      webmap.off("click", handleMapClick);
      // Remove all markers and event handlers
      for (const id of markerIds) {
        markerLayer.unregisterAllEventHandlers(id);
      }
      markerLayer.clear();
    };
  }, [
    mapRef.current?.markerLayer,
    mapRef.current?.webmap,
    spawns,
    highlightedIds,
    discoveredSet,
    hideDiscoveredNodes,
    baseIconSize,
    iconSizeByFilter,
    player,
    markerOptions?.zPos,
  ]);

  // Update tooltip position on map pan/zoom, close if marker goes out of view
  useEffect(() => {
    if (!tooltipIsOpen || !tooltipData) return;

    const ref = mapRef.current;
    if (!ref?.webmap) return;

    const webmap = ref.webmap;
    let rafId: number;

    const updatePosition = () => {
      const canvas = webmap.getContainer();
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const state = (webmap as any).lastState;
      if (!state) return;

      const worldPos = state.projection(tooltipData.latLng);
      const view = state.viewMatrix;
      const clipX = view[0] * worldPos.x + view[3] * worldPos.y + view[6];
      const clipY = view[1] * worldPos.x + view[4] * worldPos.y + view[7];
      const screenX = (clipX * 0.5 + 0.5) * canvasRect.width;
      const screenY = (1 - (clipY * 0.5 + 0.5)) * canvasRect.height;

      // Close tooltip if marker is outside the canvas bounds
      const margin = tooltipData.radius;
      if (
        screenX < -margin ||
        screenX > canvasRect.width + margin ||
        screenY < -margin ||
        screenY > canvasRect.height + margin
      ) {
        setTooltipIsOpen(false);
        return;
      }

      // Only update if position changed
      if (screenX !== tooltipData.x || screenY !== tooltipData.y) {
        setTooltipData((prev) =>
          prev ? { ...prev, x: screenX, y: screenY } : null,
        );
      }

      rafId = requestAnimationFrame(updatePosition);
    };

    rafId = requestAnimationFrame(updatePosition);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [tooltipIsOpen, tooltipData?.latLng]);

  return (
    <>
      {containerRef.current && tooltipData && tooltipIsOpen
        ? createPortal(
            <div
              ref={tooltipRef}
              className="cursor-default z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none"
              onClick={(event) => {
                event.stopPropagation();
              }}
              onDoubleClick={(event) => {
                event.stopPropagation();
              }}
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
                onClose={() => {
                  setTooltipIsOpen(false);
                }}
                hideDiscovered
                hideComments
                additionalTooltip={additionalTooltip}
              />
            </div>,
            containerRef.current,
          )
        : null}
    </>
  );
}
