export type Region = {
  id: string;
  center: [number, number];
  border: [number, number][];
  mapName?: string;
};

export const isPointInsidePolygon = (
  point: [number, number],
  polygon: [number, number][],
) => {
  const x = point[0];
  const y = point[1];

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    const intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

export type Spawn = {
  id: string;
  name?: string | undefined;
  description?: string | undefined;
  address?: number;
  p: [number, number] | [number, number, number];
  type: string;
  cluster?: Omit<Spawn, "cluster">[];
  mapName?: string;
  color?: string;
  icon?: {
    name: string;
    url: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } | null;
  radius?: number;
  isPrivate?: boolean;
  data?: Record<string, string[]>;
};

export type SimpleSpawn = {
  id: string;
  p: [number, number] | [number, number, number];
  mapName?: string;
  type?: string;
  icon?:
    | string
    | {
        name: string;
        url: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      }
    | null;
  name: string;
  color?: string;
  description?: string;
};

export const getNodeId = (spawn: Spawn | SimpleSpawn) => {
  if (spawn.id?.includes("@")) {
    return spawn.id;
  }
  if ("type" in spawn) {
    return `${spawn.id || spawn.type}@${spawn.p[0]}:${spawn.p[1]}`;
  }
  return `${spawn.id}@${spawn.p[0]}:${spawn.p[1]}`;
};

/**
 * Build discovery lookup structures from an array of discovered node IDs.
 * Used for O(1) lookups in hot paths like markers rendering.
 *
 * Returns:
 * - discoveredSet: Set of all discovered node IDs for exact matching
 * - discoveredCoords: Set of coordinate strings (x:y) for backward compatibility
 *   when type IDs change but coordinates remain the same
 * - splitCache: Map to cache nodeId.split("@") results to avoid repeated string ops
 */
export const buildDiscoveryLookup = (discoveredNodes: string[]) => {
  const discoveredSet = new Set(discoveredNodes);
  const discoveredCoords = new Set<string>();

  for (const id of discoveredNodes) {
    if (id.includes("@")) {
      const atIndex = id.indexOf("@");
      discoveredCoords.add(id.slice(atIndex + 1));
    }
  }

  return {
    discoveredSet,
    discoveredCoords,
    splitCache: new Map<string, [string, string]>(),
  };
};

/**
 * Check if a node is discovered using pre-built lookup structures.
 * Matches by:
 * 1. Exact ID match
 * 2. Base ID match (type without coordinates)
 * 3. Coordinate match (for backward compatibility when type IDs change)
 */
export const checkNodeDiscovered = (
  nodeId: string,
  lookup: ReturnType<typeof buildDiscoveryLookup>,
): boolean => {
  const { discoveredSet, discoveredCoords, splitCache } = lookup;

  // Fast path: no @ means simple ID
  if (!nodeId.includes("@")) {
    return discoveredSet.has(nodeId);
  }

  // Fast path: exact match
  if (discoveredSet.has(nodeId)) return true;

  // Get cached split or compute and cache
  let cached = splitCache.get(nodeId);
  if (!cached) {
    const atIndex = nodeId.indexOf("@");
    cached = [nodeId.slice(0, atIndex), nodeId.slice(atIndex + 1)];
    splitCache.set(nodeId, cached);
  }

  const [baseId, coords] = cached;

  // Check base ID match (type without coordinates)
  if (discoveredSet.has(baseId)) return true;

  // Check coordinate match (backward compatibility)
  return discoveredCoords.has(coords);
};
