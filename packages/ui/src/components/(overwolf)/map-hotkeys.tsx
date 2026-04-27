import { HOTKEYS } from "@repo/lib/overwolf";
import { useEffect } from "react";
import { useMap } from "../(interactive-map)/store";
import { getNodeId, type Spawn, useGameState, useSettingsStore, useUserStore } from "@repo/lib";
import { useCoordinates, useT } from "../(providers)";
import { toast } from "sonner";

export function MapHotkeys() {
  const map = useMap();
  const { nodes } = useCoordinates();
  const t = useT();

  useEffect(() => {
    if (!map) {
      return;
    }

    const handleHotkey = (event: overwolf.settings.hotkeys.OnPressedEvent) => {
      if (event.name === HOTKEYS.ZOOM_IN_APP) {
        map.zoomIn();
      } else if (event.name === HOTKEYS.ZOOM_OUT_APP) {
        map.zoomOut();
      } else if (event.name === HOTKEYS.TOGGLE_OVERLAY_FULLSCREEN) {
        useSettingsStore.getState().toggleOverlayFullscreen();
      } else if (event.name === HOTKEYS.SHOW_LABELS) {
        // Toggle show labels state
        const current = useGameState.getState().showLabelsActive;
        useGameState.getState().setShowLabelsActive(!current);
      }
    };
    overwolf.settings.hotkeys.onPressed.addListener(handleHotkey);

    return () => {
      overwolf.settings.hotkeys.onPressed.removeListener(handleHotkey);
    };
  }, [map]);

  useEffect(() => {
    let lastDiscoverTime = 0;
    const DISCOVER_COOLDOWN = 500;

    const handleHotkey = (event: overwolf.settings.hotkeys.OnPressedEvent) => {
      if (event.name === HOTKEYS.DISCOVER_NODE) {
        const now = Date.now();
        if (now - lastDiscoverTime < DISCOVER_COOLDOWN) {
          return;
        }
        lastDiscoverTime = now;

        const { filters } = useUserStore.getState();
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
        const { spawns } = nodeSpawns.reduce(
          (nearest, spawn) => {
            if (hideDiscoveredNodes && isDiscoveredNode(getNodeId(spawn as Spawn))) {
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
    };

    overwolf.settings.hotkeys.onPressed.addListener(handleHotkey);

    return () => {
      overwolf.settings.hotkeys.onPressed.removeListener(handleHotkey);
    };
  }, [nodes]);

  return <></>;
}
