"use client";

import { useRef } from "react";
import {
  SimpleWebMap,
  SimpleWebMarkers,
  type SimpleWebMapRef,
} from "@repo/ui/interactive-map";
import { SimpleSpawn, type TilesConfig } from "@repo/lib";

export default function SimpleMapDynamic({
  mapName,
  spawns,
  tiles,
}: {
  mapName: string;
  spawns: SimpleSpawn[];
  tiles: TilesConfig;
}): JSX.Element {
  const mapRef = useRef<SimpleWebMapRef | null>(null);

  return (
    <div className="h-60 md:h-96 mt-4">
      <SimpleWebMap
        mapName={mapName}
        tileOptions={tiles}
        appName="once-human"
        mapRef={mapRef}
      />
      <SimpleWebMarkers
        spawns={spawns}
        iconsPath="/icons/icons.webp"
        appName="once-human"
        mapRef={mapRef}
      />
    </div>
  );
}
