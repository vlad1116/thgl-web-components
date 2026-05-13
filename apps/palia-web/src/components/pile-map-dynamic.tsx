"use client";

import { useRef } from "react";
import {
  SimpleWebMap,
  SimpleWebMarkers,
  type SimpleWebMapRef,
} from "@repo/ui/interactive-map";
import { PaliaWebGrid } from "@repo/ui/data";
import { type TilesConfig, type SimpleSpawn } from "@repo/lib";
import { APP_CONFIG } from "@/config";

export default function PileMapDynamic({
  mapName,
  spawns,
  center,
  tiles,
  icons,
}: {
  mapName: string;
  spawns: SimpleSpawn[];
  center?: [number, number];
  tiles: TilesConfig;
  icons: string;
}): JSX.Element {
  const mapRef = useRef<SimpleWebMapRef | null>(null);

  return (
    <div className="h-64 md:h-96 mt-4">
      <SimpleWebMap
        mapName={mapName}
        tileOptions={tiles}
        appName={APP_CONFIG.name}
        view={center ? { center, zoom: 0 } : undefined}
        mapRef={mapRef}
      />
      <SimpleWebMarkers
        spawns={spawns}
        iconsPath={icons}
        appName={APP_CONFIG.name}
        highlightedIds={spawns.length === 1 ? [spawns[0].id] : undefined}
        withoutDiscoveredNodes
        mapRef={mapRef}
      />
      <PaliaWebGrid mapName={mapName} mapRef={mapRef} force />
    </div>
  );
}
