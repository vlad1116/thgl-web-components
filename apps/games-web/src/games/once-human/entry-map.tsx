"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@repo/ui/data";
import type { SimpleSpawn, TilesConfig } from "@repo/lib";

// SimpleMapDynamic uses Leaflet, which doesn't work in SSR. Match the
// old once-human-web pattern and dynamically import with ssr:false +
// a skeleton placeholder.
//
// The dynamic import points at a co-located re-export file rather than
// `@repo/ui/data` directly: Next.js/webpack accepts static imports of
// the barrel subpath everywhere, but rejects the same subpath inside
// `import("...")` calls (build error: "Package path ./data is not
// exported from package …/@repo/ui"). The local re-export uses a
// static import internally, sidestepping the issue.
const SimpleMapDynamic = dynamic(() => import("./simple-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 md:h-96 mt-4" />,
});

const APP_NAME = "once-human";

/**
 * Render a single-pin overlay for an entry's `props.location`. Used by
 * echoes-of-stardust entries (and any other once-human wiki content
 * that ships in-world coordinates). The map uses the "default" tile
 * set since once-human ships region-spanning composite tiles.
 */
export function EntryMap({
  id,
  name,
  location,
  tiles,
}: {
  id: string;
  name: string;
  /** [x, y] in once-human map coordinates (raw from props.location). */
  location: [number, number];
  tiles: TilesConfig;
}) {
  const spawns: SimpleSpawn[] = [
    {
      id,
      name,
      icon: null,
      // The old app swapped X/Y here — coordinates in props.location are
      // [x, y] but the map renderer expects [lat, lng]-style [y, x].
      p: [location[1], location[0]],
    },
  ];
  return (
    <div>
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
        Location
      </h2>
      <SimpleMapDynamic
        spawns={spawns}
        mapName="default"
        tiles={tiles}
        appName={APP_NAME}
      />
    </div>
  );
}
