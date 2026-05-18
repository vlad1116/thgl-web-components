"use client";

import { SimpleSpawn, TilesConfig } from "@repo/lib";
import MapProgress from "./map-progress";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import Link from "next/link";
import { useT } from "../(providers)";
import { AdditionalTooltipType } from "../(content)";

export default function MapGuides({
  maps,
  mapLabels,
  simpleSpawns,
  tiles,
  appName,
  additionalTooltip,
  typeGroupLabels,
}: {
  maps: string[];
  /**
   * Pre-resolved display labels for each map key, computed server-side.
   * Required for multi-tenant deployments whose client dict only ships
   * UI strings (map names live in the full game dict).
   */
  mapLabels?: Record<string, string>;
  simpleSpawns: SimpleSpawn[];
  tiles: TilesConfig;
  appName: string;
  additionalTooltip?: AdditionalTooltipType;
  typeGroupLabels?: Record<string, string>;
}) {
  const t = useT();
  const searchParams = useSearchParams();
  const mapParam = searchParams.get("map");
  const currentMap = mapParam || maps[0];

  // Defensive fallback for legacy callers that don't pass mapLabels
  // (single-tenant apps shipping the full dict still translate via t()).
  const labelFor = (m: string) => mapLabels?.[m] ?? t(m);

  useEffect(() => {
    if (!mapParam) {
      history.replaceState(
        null,
        "",
        `${window.location.pathname}?map=${currentMap}`,
      );
    }
  }, []);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  const mapSpawns = simpleSpawns.filter((s) => s.mapName === currentMap);

  return (
    <>
      <ScrollArea orientation="horizontal" className="w-full max-w-[90vw]">
        <div className="flex items-center justify-center gap-4" role="tablist" aria-label="Maps">
          {maps.map((map) => (
            <Button
              key={map}
              variant={map === currentMap ? "default" : "secondary"}
              role="tab"
              aria-selected={map === currentMap}
              asChild
            >
              <Link href={`?${createQueryString("map", map)}`}>{labelFor(map)}</Link>
            </Button>
          ))}
        </div>
      </ScrollArea>
      <MapProgress
        spawns={mapSpawns}
        map={currentMap}
        mapLabel={labelFor(currentMap)}
        tiles={tiles}
        appName={appName}
        additionalTooltip={additionalTooltip}
        typeGroupLabels={typeGroupLabels}
      />
    </>
  );
}
