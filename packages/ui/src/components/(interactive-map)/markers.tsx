"use client";
import type { LeafletMouseEvent } from "leaflet";
import { DomEvent } from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Spawns, useCoordinates, useT, type Icons } from "../(providers)";
import { HoverCard, HoverCardContent, HoverCardPortal } from "../ui/hover-card";
import CanvasMarker, {
  canvasMarkerImgs,
  CanvasMarkerOptions,
  clearCanvasCache,
} from "./canvas-marker";
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
  useAccountStore,
  useConnectionStore,
  useGameState,
  useSettingsStore,
  useUserStore,
  type LabelMode,
  type PrivateNode,
} from "@repo/lib";
import { MarkerTooltip, TooltipItems } from "./marker-tooltip";
import { useThrottle } from "@uidotdev/usehooks";
import { AdditionalTooltipType } from "../(content)";
import { playAlertSound } from "../(controls)/audio-alert";
import { SpatialGrid } from "./spatial-grid";

function resolvePrivateIcon(
  icon: PrivateNode["icon"],
  icons: Icons,
  appIconsByName: Map<
    string,
    { x: number; y: number; width: number; height: number }
  >,
): PrivateNode["icon"] {
  if (!icon) return icon;

  // Strategy 1: Look up by filterId (new data, language-independent)
  if (icon.filterId) {
    const filterValue = icons.get(icon.filterId);
    if (filterValue && typeof filterValue.icon !== "string") {
      return {
        ...icon,
        x: filterValue.icon.x,
        y: filterValue.icon.y,
        width: filterValue.icon.width,
        height: filterValue.icon.height,
      };
    }
  }

  // Strategy 2: Look up by translated name (legacy data without filterId)
  if (icon.name) {
    const current = appIconsByName.get(icon.name);
    if (current) {
      return {
        ...icon,
        x: current.x,
        y: current.y,
        width: current.width,
        height: current.height,
      };
    }
  }

  return icon;
}

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
  const handleMapMouseMoveRef = useRef<((e: LeafletMouseEvent) => void) | null>(
    null,
  );
  const [isLoadingSprite, setIsLoadingSprite] = useState(
    markerOptions.imageSprite && !canvasMarkerImgs["icons.webp"],
  );

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

  const mapContainer = map?.getPane("mapPane");

  const isHoverCardVisible = tooltipIsOpen && !isDrawing;

  useEffect(() => {
    if (markerOptions.imageSprite && !canvasMarkerImgs["icons.webp"]) {
      const iconSprite = new Image();
      iconSprite.src = getAppUrl(appName, iconsPath);
      iconSprite.crossOrigin = "anonymous";
      canvasMarkerImgs["icons.webp"] = iconSprite;
      canvasMarkerImgs["/icons/icons.webp"] = iconSprite;
      iconSprite.onload = () => {
        setIsLoadingSprite(false);
      };
      iconSprite.onerror = () => {
        setIsLoadingSprite(false);
      };
    }
  }, []);

  useEffect(() => {
    if (!map) {
      return;
    }
    const handleClick = () => {
      setSelectedNodeId(null);
    };
    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [map]);

  if (isLoadingSprite) {
    return <></>;
  }

  return (
    <>
      <MarkersContent
        markerOptions={markerOptions}
        onTooltipData={setTooltipData}
        onTooltipOpen={setTooltipIsOpen}
        handleMapMouseMoveRef={handleMapMouseMoveRef}
        onClick={setSelectedNodeId}
        appName={appName}
      />
      {mapContainer && tooltipData ? (
        <HoverCard
          closeDelay={0}
          onOpenChange={(open) => {
            if (!open) {
              setTooltipIsOpen(false);
            }
          }}
          open={isHoverCardVisible}
        >
          <HoverCardPortal container={mapContainer}>
            <HoverCardContent
              className="cursor-default"
              onClick={(event) => {
                event.stopPropagation();
              }}
              onDoubleClick={(event) => {
                event.stopPropagation();
              }}
              onMouseEnter={() => {
                if (handleMapMouseMoveRef.current) {
                  map?.off("mousemove", handleMapMouseMoveRef.current);
                  handleMapMouseMoveRef.current = null;
                }
              }}
              style={{
                transform: `translate3d(calc(${tooltipData.x}px - 50%), calc(${tooltipData.y}px + 100% - ${tooltipData.radius}px - 2px), 0px)`,
              }}
            >
              <MarkerTooltip
                appName={appName}
                latLng={tooltipData.latLng}
                items={tooltipData.items}
                onClick={setSelectedNodeId}
                onClose={() => {
                  setTooltipIsOpen(false);
                }}
                hideComments={hideComments}
                additionalTooltip={additionalTooltip}
                coordinateCopyFormat={markerOptions.coordinateCopyFormat}
              />
            </HoverCardContent>
          </HoverCardPortal>
        </HoverCard>
      ) : null}
    </>
  );
}

function MarkersContent({
  markerOptions,
  onTooltipData,
  onTooltipOpen,
  handleMapMouseMoveRef,
  onClick,
  appName,
}: {
  markerOptions: MarkerOptions;
  onTooltipData: (data: {
    x: number;
    y: number;
    radius: number;
    latLng: [number, number] | [number, number, number];
    items: TooltipItems;
  }) => void;
  onTooltipOpen: (open: boolean) => void;
  handleMapMouseMoveRef: React.MutableRefObject<
    ((e: LeafletMouseEvent) => void) | null
  >;
  onClick: (id: string) => void;
  appName: string;
}) {
  const map = useMap();
  const t = useT();
  const { spawns, icons, filters } = useCoordinates();
  const hideDiscoveredNodes = useSettingsStore(
    (state) => state.hideDiscoveredNodes,
  );
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);
  const discoveryLookup = useMemo(
    () => buildDiscoveryLookup(discoveredNodes),
    [discoveredNodes],
  );
  const setDiscoverNode = useSettingsStore((state) => state.setDiscoverNode);
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const iconSizeByGroup = useSettingsStore((state) => state.iconSizeByGroup);
  const iconSizeByFilter = useSettingsStore((state) => state.iconSizeByFilter);
  const sharedMyFilters = useConnectionStore((state) => state.myFilters);
  const liveMode = useSettingsStore((state) => state.liveMode);
  const audioAlertsEnabled = useSettingsStore(
    (state) => state.audioAlertsEnabled,
  );
  const audioAlertRange = useSettingsStore((state) => state.audioAlertRange);
  const audioAlertByFilter = useSettingsStore(
    (state) => state.audioAlertByFilter,
  );
  const audioAlertSound = useSettingsStore((state) => state.audioAlertSound);
  const audioAlertVolume = useSettingsStore((state) => state.audioAlertVolume);
  const labelModeByFilter = useSettingsStore(
    (state) => state.labelModeByFilter,
  );
  const labelTextSize = useSettingsStore((state) => state.labelTextSize);
  const hasPreviewAccess = useAccountStore(
    (state) => state.perks.previewReleaseAccess,
  );
  const selectedNodeId = useUserStore((state) => state.selectedNodeId);
  const typeToGroup = useMemo(() => {
    const mapTypeToGroup = new Map<string, string>();
    filters.forEach((g) => {
      g.values.forEach((v) => mapTypeToGroup.set(v.id, g.group));
    });
    return mapTypeToGroup;
  }, [filters]);

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

  const fitBoundsOnChange = useSettingsStore(
    (state) => state.fitBoundsOnChange,
  );
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity,
  );
  const highContrastMode = useSettingsStore((state) => state.highContrastMode);
  const highContrastColor = useSettingsStore(
    (state) => state.highContrastColor,
  );
  const highContrastThickness = useSettingsStore(
    (state) => state.highContrastThickness,
  );
  const tempPrivateNodeId = useSettingsStore(
    (state) => state.tempPrivateNode?.id,
  );
  const highlightSpawnIDs = useGameState((state) => state.highlightSpawnIDs);
  const existingSpawnIds = useRef<Map<string | number, CanvasMarker>>();
  // Spatial grid for efficient proximity queries - cell size based on typical range
  const spatialGridRef = useRef<SpatialGrid<CanvasMarker>>();
  const player = useGameState((state) => state.player);
  const throttledPlayer = useThrottle(player, 1000);
  const firstRender = useRef(true);

  // Audio alert tracking - tracks if we've already alerted for current in-range spawns
  const hasAlertedRef = useRef<boolean>(false);

  // Track markers that have been modified (z-pos/labels) for efficient distant-markers reset
  const activatedMarkersRef = useRef<Set<CanvasMarker>>(new Set());
  // Track previous label settings to detect when a full sweep is needed
  const prevLabelSettingsRef = useRef<{
    labelModeByFilter: Record<string, LabelMode>;
    showLabelsActive: boolean;
    labelTextSize: number;
  } | null>(null);

  // Hotkey state for showing all labels temporarily (set by MapHotkeys in Overwolf/THGL apps)
  const showLabelsActive = useGameState((state) => state.showLabelsActive);

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

  // Cache rotated coordinates to avoid recalculating on every render
  const rotationCache = useMemo(() => {
    const rotationDegrees = map?._rotationDegrees;
    const rotationCenter = map?._rotationCenter;

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
  }, [map, map?._rotationDegrees, map?._rotationCenter]);

  // Lightweight effect for live actor position updates.
  // Runs when actors change, but only updates existing marker positions (O(actors) not O(allMarkers)).
  // Full spawn reconciliation (creating/removing markers) is handled by the main spawns effect.
  const actors = useGameState((state) => state.actors);
  useEffect(() => {
    if (!existingSpawnIds.current || !actors.length || !liveMode) return;

    for (const actor of actors) {
      const marker = existingSpawnIds.current.get(actor.address);
      if (!marker) continue;

      let pos: [number, number] | [number, number, number] =
        actor.z != null ? [actor.x, actor.y, actor.z] : [actor.x, actor.y];
      if (rotationCache) {
        const rotated = rotationCache.getRotated(actor.x, actor.y);
        pos =
          actor.z != null ? [rotated[0], rotated[1], actor.z] : rotated;
      }

      if (!marker.getLatLng().equals(pos)) {
        marker.setLatLng(pos);
        // Update position in spatial grid for proximity queries
        if (spatialGridRef.current) {
          spatialGridRef.current.update(marker, pos[0], pos[1]);
        }
      }
    }
  }, [actors, rotationCache, liveMode]);

  // Determine the cell size for spatial grid based on max range we need to check
  const spatialCellSize = useMemo(() => {
    const zPosMaxDist = markerOptions.zPos?.xyMaxDistance ?? 0;
    // Use the larger of audioAlertRange or zPos max distance, with a minimum of 500
    return Math.max(500, audioAlertRange, zPosMaxDist);
  }, [audioAlertRange, markerOptions.zPos?.xyMaxDistance]);

  useEffect(() => {
    if (!map || !map._mapPane) {
      return;
    }
    if (!existingSpawnIds.current) {
      existingSpawnIds.current = new Map();
    }
    // Initialize or rebuild spatial grid with current cell size
    if (!spatialGridRef.current) {
      spatialGridRef.current = new SpatialGrid<CanvasMarker>(spatialCellSize);
    }

    let tooltipDelayTimeout: NodeJS.Timeout | undefined;

    const handleSpawn = (spawn: Spawn) => {
      if (spawn.mapName && spawn.mapName !== map.mapName) {
        return;
      }
      if (tempPrivateNodeId && tempPrivateNodeId === spawn.id.split("@")[0]) {
        return;
      }
      const isCluster = Boolean(spawn.cluster && spawn.cluster.length > 0);

      const nodeId = getNodeId(spawn);
      let isDiscovered = checkNodeDiscovered(nodeId, discoveryLookup);
      if (isCluster && isDiscovered) {
        if (
          spawn.cluster!.some(
            (a) =>
              !checkNodeDiscovered(
                a.id?.includes("@")
                  ? a.id
                  : `${a.id || a.type}@${a.p[0]}:${a.p[1]}`,
                discoveryLookup,
              ),
          )
        ) {
          isDiscovered = false;
        }
      }

      const id = isCluster ? `${nodeId}:${isCluster}` : nodeId;
      spawnIds.add(spawn.address || id);

      const isHighlighted =
        highlightSpawnIDs.includes(nodeId) || selectedNodeId === nodeId;
      const existingMarker = existingSpawnIds.current!.get(spawn.address || id);
      if (existingMarker) {
        if (isDiscovered && hideDiscoveredNodes) {
          existingMarker.remove();
          existingSpawnIds.current!.delete(spawn.address || id);
          // Remove from spatial grid
          if (spatialGridRef.current) {
            spatialGridRef.current.remove(existingMarker);
          }
        } else if (existingMarker.options.isDiscovered !== isDiscovered) {
          existingMarker.toggleDiscovered();
        }
        if (spawn.address) {
          // Apply rotation if map has rotation configured
          let markerPosition: [number, number] | [number, number, number] =
            spawn.p;
          if (rotationCache) {
            const rotatedCoord = rotationCache.getRotated(
              spawn.p[0],
              spawn.p[1],
            );
            markerPosition =
              spawn.p.length === 3
                ? [rotatedCoord[0], rotatedCoord[1], spawn.p[2]]
                : rotatedCoord;
          }
          if (!existingMarker.getLatLng().equals(markerPosition)) {
            existingMarker.setLatLng(markerPosition);
            // Update position in spatial grid
            if (spatialGridRef.current) {
              spatialGridRef.current.update(
                existingMarker,
                markerPosition[0],
                markerPosition[1],
              );
            }
          }
        }
        if (existingMarker.options.isHighlighted !== isHighlighted) {
          existingMarker.setHighlight(isHighlighted);
        }
        return;
      }
      if (isDiscovered && hideDiscoveredNodes) {
        return;
      }
      const icon = icons.get(spawn.type);
      const baseRadius =
        spawn.radius ??
        markerOptions.radius * (icon?.size ?? 1) * (isCluster ? 1.5 : 1);

      const resolvedSpawnIcon = spawn.isPrivate
        ? resolvePrivateIcon(spawn.icon ?? null, icons, appIconsByName)
        : spawn.icon;

      const markerIcon =
        resolvedSpawnIcon ||
        (typeof icon?.icon === "string"
          ? {
              url: getIconsUrl(appName, icon.icon),
            }
          : icon?.icon) ||
        null;

      const groupId = typeToGroup.get(spawn.type);
      const groupMultiplier = groupId ? (iconSizeByGroup[groupId] ?? 1) : 1;
      const typeMultiplier = iconSizeByFilter[spawn.type] ?? 1;

      // Apply rotation if map has rotation configured
      let markerPosition: [number, number] | [number, number, number] = spawn.p;
      if (rotationCache) {
        const rotatedCoord = rotationCache.getRotated(spawn.p[0], spawn.p[1]);
        markerPosition =
          spawn.p.length === 3
            ? [rotatedCoord[0], rotatedCoord[1], spawn.p[2]]
            : rotatedCoord;
      }

      const marker = new CanvasMarker(markerPosition, {
        id,
        typeId: spawn.type,
        icon: markerIcon,
        fillColor: spawn.color,
        baseRadius,
        radius: baseRadius * baseIconSize * groupMultiplier * typeMultiplier,
        isDiscovered,
        isCluster,
        isHighlighted,
        colorBlindMode,
        colorBlindSeverity,
        highContrastMode,
        highContrastColor,
        highContrastThickness,
        pane: "tooltipPane",
      });
      marker.on({
        mousedown: () => {
          clearTimeout(tooltipDelayTimeout);
        },
        mouseover: (event) => {
          if (handleMapMouseMoveRef.current) {
            map.off("mousemove", handleMapMouseMoveRef.current);
            handleMapMouseMoveRef.current = null;
          }

          clearTimeout(tooltipDelayTimeout);
          tooltipDelayTimeout = setTimeout(() => {
            // Lazy evaluate items only when actually hovered (not created for every marker)
            const filter = filters.find((filter) =>
              filter.values.some((filter) => filter.id === spawn.type),
            );
            const items = [
              {
                id: nodeId,
                termId: (spawn.name ?? spawn.id ?? spawn.type).replace(
                  /my_\d+_/,
                  "",
                ),
                description: spawn.description,
                type: spawn.type,
                group: filter?.group,
                isPrivate: spawn.isPrivate,
                isLive: Boolean(spawn.address),
                data: spawn.data,
              },
            ];
            if (isCluster) {
              items.push(
                ...spawn.cluster!.map((spawn) => ({
                  id: spawn.id,
                  termId: (spawn.name ?? spawn.id ?? spawn.type).replace(
                    /my_\d+_/,
                    "",
                  ),
                  description: spawn.description,
                  type: spawn.type,
                  group: filter?.group,
                  isPrivate: spawn.isPrivate,
                  isLive: Boolean(spawn.address),
                  data: spawn.data,
                })),
              );
            }

            onTooltipData({
              x: event.sourceTarget._point.x,
              y: event.sourceTarget._point.y,
              radius: marker.getRadius(),
              items: items,
              latLng: spawn.p,
            });
            onTooltipOpen(true);
          }, 9);
        },
        mouseout: (event) => {
          DomEvent.stopPropagation(event);

          clearTimeout(tooltipDelayTimeout);
          handleMapMouseMoveRef.current = (e: LeafletMouseEvent) => {
            const distanceFromMarker = Math.sqrt(
              Math.pow(e.layerPoint.x - marker._point.x, 2) +
                Math.pow(e.layerPoint.y - marker._point.y, 2),
            );
            const maxDistance = marker.getRadius() + 15;

            if (distanceFromMarker > maxDistance) {
              onTooltipOpen(false);
              if (handleMapMouseMoveRef.current) {
                map.off("mousemove", handleMapMouseMoveRef.current);
                handleMapMouseMoveRef.current = null;
              }
            }
          };
          map.on("mousemove", handleMapMouseMoveRef.current);
        },
        contextmenu: (event) => {
          DomEvent.stopPropagation(event);
          isDiscovered = !isDiscovered;
          if (isCluster) {
            spawn.cluster!.forEach((spawn) => {
              setDiscoverNode(getNodeId(spawn), isDiscovered);
            });
          }
          setDiscoverNode(nodeId, isDiscovered);
        },
        click: (event) => {
          DomEvent.stopPropagation(event);
          if (spawn.address) {
            return;
          }
          onClick(nodeId);
        },
      });
      existingSpawnIds.current!.set(spawn.address || id, marker);
      // Add to spatial grid for efficient proximity queries
      if (spatialGridRef.current) {
        spatialGridRef.current.add(
          marker,
          markerPosition[0],
          markerPosition[1],
        );
      }
      try {
        marker.addTo(map);
      } catch (e) {
        //
      }
    };
    const spawnIds = new Set<string | number>();
    spawns.forEach(handleSpawn);

    const sharedPrivateSpawns = sharedMyFilters.flatMap<Spawns[number]>(
      (myFilter) => {
        return (
          myFilter.nodes?.map((node) => {
            return {
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
            };
          }) ?? []
        );
      },
    );
    sharedPrivateSpawns.forEach(handleSpawn);

    for (const [key, marker] of existingSpawnIds.current.entries()) {
      if (spawnIds.has(key)) {
        continue;
      }
      existingSpawnIds.current.delete(key);
      // Remove from spatial grid
      if (spatialGridRef.current) {
        spatialGridRef.current.remove(marker);
      }

      try {
        marker.off();
        marker.remove();
      } catch (e) {}
    }
  }, [
    map,
    spawns,
    sharedMyFilters,
    hideDiscoveredNodes,
    discoveryLookup,
    tempPrivateNodeId,
    selectedNodeId,
    highlightSpawnIDs,
    rotationCache,
  ]);

  // Memoize rotated player position to avoid recalculating in multiple places
  const rotatedPlayer = useMemo(() => {
    if (!throttledPlayer) return null;

    let playerX = throttledPlayer.x;
    let playerY = throttledPlayer.y;
    if (rotationCache) {
      const rotated = rotationCache.getRotated(
        throttledPlayer.x,
        throttledPlayer.y,
      );
      playerX = rotated[0];
      playerY = rotated[1];
    }
    return {
      x: playerX,
      y: playerY,
      z: throttledPlayer.z,
      mapName: throttledPlayer.mapName,
    };
  }, [throttledPlayer, rotationCache]);

  // Consolidated effect for z-position, audio alerts, and labels
  // Uses spatial grid for efficient proximity queries when available
  useEffect(() => {
    if (!existingSpawnIds.current || !rotatedPlayer) return;

    // Skip if player is on a different map
    if (rotatedPlayer.mapName && player?.mapName !== map?.mapName) {
      return;
    }

    const playerX = rotatedPlayer.x;
    const playerY = rotatedPlayer.y;
    const playerZ = rotatedPlayer.z;

    // Pre-calculate constants for z-position checks
    const hasZPos = Boolean(markerOptions.zPos);
    const zPosMaxDist = hasZPos ? markerOptions.zPos!.xyMaxDistance : 0;
    const zPosMaxDistSq = zPosMaxDist * zPosMaxDist;
    const zDistance = hasZPos ? markerOptions.zPos!.zDistance : 0;

    // Pre-calculate constants for audio/label range checks
    const checkAudio = audioAlertsEnabled;
    const checkLabels = hasPreviewAccess;
    // Only compute audio range when audio or labels are active
    const needsAudioRange = checkAudio || checkLabels;
    const audioRangeSq = needsAudioRange
      ? audioAlertRange * audioAlertRange
      : 0;

    // Track if any audio-enabled spawn is in range (for audio alert)
    let anyAudioInRange = false;

    // Determine max query distance for spatial grid
    // Only include audioAlertRange when features that use it are enabled
    const maxQueryDist = needsAudioRange
      ? Math.max(audioAlertRange, zPosMaxDist)
      : zPosMaxDist;

    // Skip entirely if nothing needs proximity checks
    if (maxQueryDist === 0 && activatedMarkersRef.current.size === 0) {
      return;
    }
    const useSpatialGrid =
      spatialGridRef.current && spatialGridRef.current.size > 100;

    // Track which markers we've processed (for resetting distant markers)
    const processedMarkers = useSpatialGrid ? new Set<CanvasMarker>() : null;

    // Track markers that are currently activated (have z-pos or text set)
    const newActivatedMarkers = new Set<CanvasMarker>();

    // Get nearby markers from spatial grid if available and beneficial
    const markersToCheck = useSpatialGrid
      ? spatialGridRef.current!.getNearby(playerX, playerY, maxQueryDist)
      : existingSpawnIds.current.values();

    // Process nearby markers (or all markers if no spatial grid)
    for (const marker of markersToCheck) {
      if (!marker.options || !marker.options.id) continue;

      if (processedMarkers) {
        processedMarkers.add(marker);
      }

      const pos = marker._latLngTuple as
        | [number, number]
        | [number, number, number];
      const spawnX = pos[0];
      const spawnY = pos[1];

      // Calculate distance squared once (used by z-pos, audio, and labels)
      const dx = playerX - spawnX;
      const dy = playerY - spawnY;
      const distSq = dx * dx + dy * dy;

      // --- Z-Position Detection ---
      if (hasZPos && pos.length === 3) {
        let newZPos: CanvasMarkerOptions["zPos"] = null;
        if (distSq <= zPosMaxDistSq) {
          const dz = playerZ - pos[2];
          if (dz > zDistance) {
            newZPos = "bottom";
          } else if (dz < -zDistance) {
            newZPos = "top";
          }
        }
        if (marker.options.zPos !== newZPos) {
          marker.setZPos(newZPos);
        }
        if (marker.options.zPos !== null) {
          newActivatedMarkers.add(marker);
        }
      }

      // --- Audio Alert Check ---
      if (checkAudio && !anyAudioInRange) {
        const typeId = marker.options.typeId as string;
        if (audioAlertByFilter[typeId] && distSq <= audioRangeSq) {
          anyAudioInRange = true;
        }
      }

      // --- Label Updates ---
      if (checkLabels) {
        const typeId = marker.options.typeId as string;
        if (typeId) {
          const labelMode = labelModeByFilter[typeId];
          const isInRange = distSq <= audioRangeSq;
          const showLabel = shouldShowLabel(typeId, labelMode, isInRange);
          const newText = showLabel
            ? t(typeId, { fallback: typeId })
            : undefined;

          if (
            marker.options.text !== newText ||
            marker.options.textScale !== labelTextSize
          ) {
            marker.setText(newText, labelTextSize);
          }
          if (marker.options.text !== undefined) {
            newActivatedMarkers.add(marker);
          }
        }
      }
    }

    // If using spatial grid, reset previously-activated distant markers
    if (useSpatialGrid) {
      // Detect if label settings changed (requires full sweep for always/hotkey modes)
      const prev = prevLabelSettingsRef.current;
      const needsFullLabelSweep =
        checkLabels &&
        prev !== null &&
        (prev.labelModeByFilter !== labelModeByFilter ||
          prev.showLabelsActive !== showLabelsActive ||
          prev.labelTextSize !== labelTextSize);
      prevLabelSettingsRef.current = {
        labelModeByFilter,
        showLabelsActive,
        labelTextSize,
      };

      if (needsFullLabelSweep) {
        // Full sweep only when label settings change (rare)
        for (const marker of existingSpawnIds.current.values()) {
          if (processedMarkers!.has(marker)) continue;
          if (!marker.options || !marker.options.id) continue;

          if (hasZPos && marker.options.zPos !== null) {
            marker.setZPos(null);
          }

          const typeId = marker.options.typeId as string;
          if (typeId) {
            const labelMode = labelModeByFilter[typeId];
            const showLabel = shouldShowLabel(typeId, labelMode, false);
            const newText = showLabel
              ? t(typeId, { fallback: typeId })
              : undefined;

            if (
              marker.options.text !== newText ||
              marker.options.textScale !== labelTextSize
            ) {
              marker.setText(newText, labelTextSize);
            }
            if (newText !== undefined) {
              newActivatedMarkers.add(marker);
            }
          }
        }
      } else {
        // Targeted sweep: only check previously-activated markers that are no longer nearby
        for (const marker of activatedMarkersRef.current) {
          if (processedMarkers!.has(marker)) continue;
          if (!marker.options || !marker.options.id) continue;

          // Reset z-position for distant markers
          if (hasZPos && marker.options.zPos !== null) {
            marker.setZPos(null);
          }

          // Handle labels for distant markers
          if (checkLabels) {
            const typeId = marker.options.typeId as string;
            if (typeId) {
              const labelMode = labelModeByFilter[typeId];
              const showLabel = shouldShowLabel(typeId, labelMode, false);
              const newText = showLabel
                ? t(typeId, { fallback: typeId })
                : undefined;

              if (
                marker.options.text !== newText ||
                marker.options.textScale !== labelTextSize
              ) {
                marker.setText(newText, labelTextSize);
              }
              if (newText !== undefined) {
                newActivatedMarkers.add(marker);
              }
            }
          }
        }
      }

      activatedMarkersRef.current = newActivatedMarkers;
    }

    // Handle audio alert after loop completes
    if (checkAudio) {
      if (anyAudioInRange) {
        if (!hasAlertedRef.current) {
          hasAlertedRef.current = true;
          playAlertSound(audioAlertSound, audioAlertVolume);
        }
      } else {
        hasAlertedRef.current = false;
      }
    }
  }, [
    rotatedPlayer,
    player?.mapName,
    map?.mapName,
    markerOptions.zPos,
    audioAlertsEnabled,
    audioAlertRange,
    audioAlertByFilter,
    audioAlertSound,
    audioAlertVolume,
    hasPreviewAccess,
    labelModeByFilter,
    labelTextSize,
    shouldShowLabel,
    t,
    spawns,
  ]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const handleZoomEnd = () => {
      clearCanvasCache();
    };
    map.on("zoomend", handleZoomEnd);
    return () => {
      map.off("zoomend", handleZoomEnd);
      clearCanvasCache();
      existingSpawnIds.current?.forEach((marker) => {
        try {
          marker.off();
          marker.remove();
        } catch (e) {}
      });
      existingSpawnIds.current?.clear();
      spatialGridRef.current?.clear();
    };
  }, [map]);

  useEffect(() => {
    clearCanvasCache();
    existingSpawnIds.current?.forEach((marker) => {
      const typeId = marker.options.typeId as string | undefined;
      const filterSize = typeId ? (iconSizeByFilter[typeId] ?? 1) : 1;
      const groupId = typeId ? typeToGroup.get(typeId) : undefined;
      const groupSize = groupId ? (iconSizeByGroup[groupId] ?? 1) : 1;
      marker.setRadius(
        marker.options.baseRadius * baseIconSize * groupSize * filterSize,
      );
    });
  }, [baseIconSize, iconSizeByFilter, iconSizeByGroup, typeToGroup]);

  useEffect(() => {
    existingSpawnIds.current?.forEach((marker) => {
      const isHighlighted = highlightSpawnIDs.includes(marker.options.id);
      if (marker.options.isHighlighted !== isHighlighted) {
        marker.setHighlight(isHighlighted);
      }
    });
  }, [highlightSpawnIDs]);

  // Update markers when color blind settings change (combined to avoid double cache clear and redraw)
  useEffect(() => {
    clearCanvasCache();
    existingSpawnIds.current?.forEach((marker) => {
      try {
        marker.setColorBlindSettings(colorBlindMode, colorBlindSeverity);
      } catch (e) {}
    });
  }, [colorBlindMode, colorBlindSeverity]);

  // Update markers when high contrast settings change
  useEffect(() => {
    clearCanvasCache();
    existingSpawnIds.current?.forEach((marker) => {
      try {
        marker.setHighContrastSettings(
          highContrastMode,
          highContrastColor,
          highContrastThickness,
        );
      } catch (e) {}
    });
  }, [highContrastMode, highContrastColor, highContrastThickness]);

  useEffect(() => {
    if (!fitBoundsOnChange || liveMode || spawns.length === 0 || !map) {
      return;
    }
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const bounds = spawns.map((spawn) => spawn.p);
    try {
      map.flyToBounds(bounds, {
        duration: 0.5,
        maxZoom: 3,
        padding: [25, 25],
      });
    } catch (e) {
      //
    }
  }, [spawns]);

  return <></>;
}
