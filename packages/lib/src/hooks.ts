import { useMemo, useCallback } from "react";
import { useSettingsStore } from "./settings";
import { buildDiscoveryLookup, checkNodeDiscovered } from "./coordinates";

/**
 * Hook that provides an optimized isDiscovered checker function.
 * - Builds lookup structures once when discoveredNodes changes (via useMemo)
 * - Caches nodeId.split("@") results to avoid repeated string operations
 * - All lookups are O(1)
 * - Supports backward compatibility: matches by coordinates when type IDs change
 *
 * @example
 * const isDiscovered = useDiscoveredChecker();
 * const discovered = isDiscovered(nodeId);
 */
export const useDiscoveredChecker = () => {
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);

  // Build lookup structures once when discoveredNodes changes
  // splitCache is fresh each time, caching splits within a render cycle
  const lookup = useMemo(
    () => buildDiscoveryLookup(discoveredNodes),
    [discoveredNodes],
  );

  // Stable function reference that uses the cached lookup
  const isDiscovered = useCallback(
    (nodeId: string): boolean => checkNodeDiscovered(nodeId, lookup),
    [lookup],
  );

  return isDiscovered;
};
