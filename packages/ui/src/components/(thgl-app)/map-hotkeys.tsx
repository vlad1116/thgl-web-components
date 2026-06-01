import { useUserStoreApi } from "../(providers)";
import { useEffect } from "react";
import { useMap } from "../(interactive-map)/store";
import {
  getNodeId,
  type Spawn,
  useSettingsStore,
  useGameState,
} from "@repo/lib";
import { useCoordinates, useT } from "../(providers)";
import { toast } from "sonner";
import { HOTKEYS, onWebviewMessage } from "@repo/lib/thgl-app";

export function MapHotkeys() {
  const map = useMap();
  const { nodes, typesIdMap } = useCoordinates();
  const userStoreApi = useUserStoreApi();
  const t = useT();

  useEffect(() => {
    if (!map) {
      return;
    }

    const cleanup = onWebviewMessage((message) => {
      if (message.action === "hotkey") {
        const hotkeyAction = message.payload.action;

        if (hotkeyAction === HOTKEYS.ZOOM_IN_APP) {
          map.zoomIn();
        } else if (hotkeyAction === HOTKEYS.ZOOM_OUT_APP) {
          map.zoomOut();
        } else if (hotkeyAction === HOTKEYS.TOGGLE_OVERLAY_FULLSCREEN) {
          useSettingsStore.getState().toggleOverlayFullscreen();
        } else if (hotkeyAction === HOTKEYS.TOGGLE_LOCK_APP) {
          useSettingsStore.getState().toggleLockedWindow();
        } else if (hotkeyAction === HOTKEYS.TOGGLE_LIVE_MODE) {
          useSettingsStore.getState().cycleLiveMode();
        } else if (hotkeyAction === HOTKEYS.SHOW_LABELS) {
          // Toggle show labels state
          const current = useGameState.getState().showLabelsActive;
          useGameState.getState().setShowLabelsActive(!current);
        }
      }
    });

    return () => {
      cleanup();
    };
  }, [map]);

  useEffect(() => {
    let lastDiscoverTime = 0;
    const DISCOVER_COOLDOWN = 500;

    const cleanup = onWebviewMessage((message) => {
      if (message.action === "hotkey") {
        const hotkeyAction = message.payload.action;
        if (hotkeyAction === HOTKEYS.DISCOVER_NODE) {
          const now = Date.now();
          if (now - lastDiscoverTime < DISCOVER_COOLDOWN) {
            return;
          }
          lastDiscoverTime = now;

          const { filters } = userStoreApi.getState();
          const { player } = useGameState.getState();
          if (!player) {
            return;
          }
          const { isDiscoveredNode, setDiscoverNode, hideDiscoveredNodes } =
            useSettingsStore.getState();
          const nodeSpawns = nodes
            .filter((node) => {
              if (node.mapName && node.mapName !== player.mapName) {
                return false;
              }
              if (!filters.includes(node.type)) {
                return false;
              }
              return true;
            })
            .flatMap((n) => n.spawns.map((s) => ({ ...s, type: n.type })));
          // Include live actors — they bypass coordinates-provider so we
          // need to pull them in directly for the closest-node hotkey.
          if (typesIdMap) {
            const actors = useGameState.getState().actors || [];
            for (const actor of actors) {
              const displayType = typesIdMap[actor.type];
              if (!displayType) continue;
              if (!filters.includes(displayType)) continue;
              if (actor.mapName && actor.mapName !== player.mapName) continue;
              nodeSpawns.push({
                type: displayType,
                p:
                  actor.z != null
                    ? ([actor.x, actor.y, actor.z] as [number, number, number])
                    : ([actor.x, actor.y] as [number, number]),
              });
            }
          }
          const { spawns } = nodeSpawns.reduce(
            (nearest, spawn) => {
              if (
                hideDiscoveredNodes &&
                isDiscoveredNode(getNodeId(spawn as Spawn))
              ) {
                return nearest;
              }
              const distance = Math.sqrt(
                Math.pow(player.x - spawn.p[0], 2) +
                  Math.pow(player.y - spawn.p[1], 2),
              );
              if (distance < nearest.distance) {
                return { distance, spawns: [spawn] };
              }
              if (distance === nearest.distance) {
                return { distance, spawns: [...nearest.spawns, spawn] };
              }
              return nearest;
            },
            { distance: Infinity, spawns: [] } as {
              distance: number;
              spawns: typeof nodeSpawns;
            },
          );
          spawns.forEach((spawn) => {
            const nodeId = getNodeId(spawn as Spawn);
            const isDiscovered = isDiscoveredNode(nodeId);
            setDiscoverNode(nodeId, !isDiscovered);
            toast(
              (!isDiscovered ? "Discovered " : "Undiscovered ") + t(spawn.type),
              { duration: 2000 },
            );
          });
        }
      }
    });

    return () => {
      cleanup();
    };
  }, [nodes, typesIdMap]);

  return <></>;
}
