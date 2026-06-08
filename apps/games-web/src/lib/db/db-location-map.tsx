"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@repo/ui/data";
import type { SimpleSpawn, TilesConfig } from "@repo/lib";

// Leaflet doesn't render in SSR — dynamic-import the map with ssr:false and a
// skeleton placeholder (mirrors the once-human EntryMap pattern).
const SimpleMapDynamic = dynamic(() => import("./simple-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 md:h-96 mt-4" />,
});

/** One map location for a DB entry (e.g. a chest), produced by data-forge. */
type DbLocation = {
  map: string;
  type: string;
  node: string;
  x: number;
  y: number;
  label: string;
};

/**
 * Embeds an interactive map pinning every location a DB entry is found at
 * (e.g. the chests holding an item), instead of a flat list of coordinates.
 */
export function DbLocationMap({
  locations,
  mapName,
  tiles,
  appName,
}: {
  locations: DbLocation[];
  mapName: string;
  tiles: TilesConfig;
  appName: string;
}) {
  const spawns: SimpleSpawn[] = locations.map((l) => ({
    id: l.node,
    name: l.label,
    type: l.type,
    icon: null,
    // The map renderer expects [lat, lng]-style [y, x]; data-forge stores
    // x = worldX, y = worldY, and the node id is `type@y:x`.
    p: [l.y, l.x],
    color: l.type === "chest_rune" ? "#c084fc" : "#fcd34d",
  }));
  return (
    <SimpleMapDynamic
      spawns={spawns}
      mapName={mapName}
      tiles={tiles}
      appName={appName}
    />
  );
}
