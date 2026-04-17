/**
 * Builds actor nodes by matching live actors to static spawn positions.
 * Uses a spatial grid for O(1) proximity lookups instead of O(n) per actor.
 * Also collects auto-discovery updates in the same pass (avoids duplicate loop).
 */
import type { Spawn } from "@repo/lib";
import type { NodesCoordinates } from "./coordinates-provider";

type LatLng = [number, number] | [number, number, number];

type Actor = {
  address: number;
  mapName?: string;
  type: string;
  x: number;
  y: number;
  z: number;
  hidden?: boolean;
};

export type DiscoveryUpdate = {
  nodeId: string;
  discovered: boolean;
};

// Proximity threshold for matching actors to static spawns (in game units)
const PROXIMITY_THRESHOLD = 1;

// Helper: construct node ID for discovery/tracking
const getNodeId = (
  spawnId: string | undefined,
  typeId: string,
  x: number,
  y: number,
): string => {
  return spawnId?.includes("@") ? spawnId : `${spawnId || typeId}@${x}:${y}`;
};

// --- Spatial grid for fast spawn proximity lookups ---

type SpawnEntry = {
  spawn: NodesCoordinates[number]["spawns"][number];
  nodeType: string;
  isStatic: boolean;
};

type SpawnGrid = Map<string, SpawnEntry[]>;

function gridKey(x: number, y: number): string {
  return `${Math.floor(x)}:${Math.floor(y)}`;
}

/**
 * Build a spatial grid from static nodes for O(1) proximity lookups.
 * Each cell is 1x1 game units matching PROXIMITY_THRESHOLD.
 */
export function buildSpawnGrid(
  staticNodes: NodesCoordinates,
  staticNodesMap: Map<string, NodesCoordinates[number]>,
): SpawnGrid {
  const grid: SpawnGrid = new Map();

  for (const node of staticNodes) {
    for (const spawn of node.spawns) {
      const key = gridKey(spawn.p[0], spawn.p[1]);
      let cell = grid.get(key);
      if (!cell) {
        cell = [];
        grid.set(key, cell);
      }
      cell.push({
        spawn,
        nodeType: node.type,
        isStatic: !!node.static,
      });
    }
  }

  return grid;
}

function findNearbySpawn(
  grid: SpawnGrid,
  x: number,
  y: number,
  typeKey: string,
  staticNodesMap: Map<string, NodesCoordinates[number]>,
): { spawn: SpawnEntry["spawn"]; isStatic: boolean } | null {
  // Check 3x3 cells around the actor position
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cell = grid.get(`${cx + dx}:${cy + dy}`);
      if (!cell) continue;
      for (const entry of cell) {
        // Must be same type
        if (entry.nodeType !== typeKey.split("::")[0]) continue;
        const sx = entry.spawn.p[0];
        const sy = entry.spawn.p[1];
        const ddx = sx - x;
        const ddy = sy - y;
        if (
          ddx > -PROXIMITY_THRESHOLD &&
          ddx < PROXIMITY_THRESHOLD &&
          ddy > -PROXIMITY_THRESHOLD &&
          ddy < PROXIMITY_THRESHOLD
        ) {
          return { spawn: entry.spawn, isStatic: entry.isStatic };
        }
      }
    }
  }
  return null;
}

// --- Main builder function ---

export function buildActorNodes(
  actors: Actor[],
  typesIdMap: Record<string, string>,
  staticNodesMap: Map<string, NodesCoordinates[number]>,
  spawnGrid: SpawnGrid,
  autoDiscoverSet: Set<string>,
  isDiscoveredNode: (nodeId: string) => boolean,
  debug: boolean,
  dict?: Record<string, string>,
): {
  actorNodes: NodesCoordinates;
  discoveryUpdates: DiscoveryUpdate[];
} {
  const actorNodes: NodesCoordinates = [];
  const actorCategoriesByType = new Map<string, NodesCoordinates[number]>();
  const discoveryUpdates: DiscoveryUpdate[] = [];

  actorLoop: for (const actor of actors) {
    let id = typesIdMap[actor.type];
    if (!id || actor.hidden) {
      if (!debug) continue;
      id = actor.type;
    }

    const mapName = actor.mapName;
    const typeKey = `${id}::${mapName ?? ""}`;

    let spawnToAdd: Spawn | null = null;

    // Use spatial grid for O(1) proximity lookup instead of O(n) scan
    if (!debug) {
      const match = findNearbySpawn(
        spawnGrid,
        actor.x,
        actor.y,
        typeKey,
        staticNodesMap,
      );
      if (match) {
        if (match.isStatic) {
          // Permanent node: skip actor (already in realStaticNodes)
          // But still check discovery
          if (
            typeof actor.hidden !== "undefined" &&
            autoDiscoverSet.has(id)
          ) {
            const nodeId = getNodeId(
              match.spawn.id,
              id,
              match.spawn.p[0],
              match.spawn.p[1],
            );
            if (isDiscoveredNode(nodeId) !== actor.hidden) {
              discoveryUpdates.push({
                nodeId,
                discovered: actor.hidden,
              });
            }
          }
          continue actorLoop;
        }
        // Dynamic node: replace actor with spawn data
        spawnToAdd = {
          id: getNodeId(match.spawn.id, id, match.spawn.p[0], match.spawn.p[1]),
          ...match.spawn,
          p: [match.spawn.p[0], match.spawn.p[1], actor.z || match.spawn.p[2]] as LatLng,
          address: actor.address,
        } as Spawn;

        // Auto-discovery for dynamic nodes
        if (
          typeof actor.hidden !== "undefined" &&
          autoDiscoverSet.has(id)
        ) {
          const nodeId = getNodeId(
            match.spawn.id,
            id,
            match.spawn.p[0],
            match.spawn.p[1],
          );
          if (isDiscoveredNode(nodeId) !== actor.hidden) {
            discoveryUpdates.push({
              nodeId,
              discovered: actor.hidden,
            });
          }
        }
      }
    }

    // No matching spawn found — create actor-only spawn
    if (!spawnToAdd) {
      // Store raw actor type as name so display can resolve it via t() / dicts
      // e.g., name="ci_2679" → t("ci_2679") → "Grunvar" (from dicts)
      const actorName = dict?.[actor.type] ? actor.type : undefined;
      spawnToAdd = {
        id: `${id}@${actor.x}:${actor.y}`,
        name: actorName,
        address: actor.address,
        p:
          actor.z != null
            ? [actor.x, actor.y, actor.z]
            : ([actor.x, actor.y] as LatLng),
      } as Spawn;

      // Auto-discovery for unmatched actors
      if (
        typeof actor.hidden !== "undefined" &&
        autoDiscoverSet.has(id)
      ) {
        const nodeId = getNodeId(undefined, id, actor.x, actor.y);
        if (isDiscoveredNode(nodeId) !== actor.hidden) {
          discoveryUpdates.push({ nodeId, discovered: actor.hidden });
        }
      }
    }

    const key = `${id}::${mapName ?? ""}`;
    let category = actorCategoriesByType.get(key);

    if (!category) {
      category = {
        type: id,
        mapName: mapName,
        spawns: [],
      };
      actorCategoriesByType.set(key, category);
      actorNodes.push(category);
    }

    category.spawns.push(spawnToAdd);
  }

  return { actorNodes, discoveryUpdates };
}
