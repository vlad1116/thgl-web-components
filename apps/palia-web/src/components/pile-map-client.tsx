"use client";

import dynamic from "next/dynamic";
import { notFound, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Button } from "@repo/ui/controls";
import Link from "next/link";
import {
  ExpandIcon,
  PackageIcon,
  HomeIcon,
  UmbrellaIcon,
  TreesIcon,
  MountainIcon,
} from "lucide-react";
import { type Spawns, useT } from "@repo/ui/providers";
import { Skeleton } from "@repo/ui/data";
import {
  type TilesConfig,
  type FiltersConfig,
  SimpleSpawn,
  deobfuscateAndDecode,
} from "@repo/lib";
import { type TimedLootPiles } from "@/app/[locale]/rummage-pile/page";

const PileMapDynamic = dynamic(() => import("./pile-map-dynamic"), {
  ssr: false,
  loading: () => <Skeleton className="h-60 md:h-96 mt-4" />,
});

export default function PileMapClient({
  stableNodes,
  icon,
  stableNodeIcon,
  tiles,
  icons,
  locale,
  encodedTimedLootPiles,
}: {
  stableNodes: Spawns;
  icon: FiltersConfig[number]["values"][number]["icon"];
  stableNodeIcon: FiltersConfig[number]["values"][number]["icon"];
  tiles: TilesConfig;
  icons: string;
  locale: string;
  encodedTimedLootPiles: string;
}): JSX.Element {
  const t = useT();
  const searchParams = useSearchParams();
  const mapParam = searchParams.get("map");
  const isBahariBay = mapParam === "bahari-bay";
  const isElderwood = mapParam === "elderwood";
  const isRoyalHighlands = mapParam === "royal-highlands";
  const isKillimaValley =
    !isBahariBay && !isElderwood && !isRoyalHighlands;
  const timedLootPiles = deobfuscateAndDecode<TimedLootPiles>(
    encodedTimedLootPiles,
  );

  useEffect(() => {
    if (!mapParam) {
      history.replaceState(
        null,
        "",
        `${window.location.pathname}?map=kilima-valley`,
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

  let targetSpawns: SimpleSpawn[];
  let mapName;
  let timestamp: number | undefined;
  if (isKillimaValley) {
    targetSpawns = timedLootPiles.BP_ChapaaPile_C
      ? [
          {
            id: "kilima_pile",
            name: t("kilima_pile"),
            icon,
            p: timedLootPiles.BP_ChapaaPile_C.positions[0],
          },
        ]
      : [];
    mapName = "VillageWorld";
    timestamp = timedLootPiles.BP_ChapaaPile_C.timestamp;
  } else if (isBahariBay) {
    targetSpawns = timedLootPiles.BP_BeachPile_C
      ? [
          {
            id: "beach_pile",
            name: t("beach_pile"),
            icon,
            p: timedLootPiles.BP_BeachPile_C.positions[0],
          },
        ]
      : [];
    mapName = "AdventureZoneWorld";
    timestamp = timedLootPiles.BP_BeachPile_C.timestamp;
  } else if (isElderwood) {
    targetSpawns =
      timedLootPiles.BP_RummagePile_Breakable_Elderwood_C?.positions.map(
        (p, i) => ({
          id: "elderwood_pile_" + i,
          name: t("elderwood_pile"),
          icon,
          p: p,
        }),
      ) || [];
    mapName = "AZ2_Root";
    timestamp = timedLootPiles.BP_RummagePile_Breakable_Elderwood_C.timestamp;
  } else if (isRoyalHighlands) {
    targetSpawns =
      timedLootPiles.BP_Campsite_RummagePile_C?.positions.map((p, i) => ({
        id: "campsite_pile_" + i,
        name: t("campsite_pile"),
        icon,
        p: p,
      })) || [];
    mapName = "AZ3_Root";
    timestamp = timedLootPiles.BP_Campsite_RummagePile_C?.timestamp;
  } else {
    notFound();
  }

  const stableSpawns = stableNodes
    .filter((s) => s.mapName === mapName)
    .map((s) => ({
      id: s.id,
      name: t(s.id),
      p: s.p,
      type: s.type,
      icon: stableNodeIcon,
    }));

  function formatRelativeTime(date: Date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t("rummagePile.map.justNow");
    if (diffMins < 60)
      return t("rummagePile.map.minutesAgo").replace(
        "{count}",
        String(diffMins),
      );
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return t("rummagePile.map.hoursAgo").replace(
        "{count}",
        String(diffHours),
      );
    return date.toLocaleDateString(locale);
  }

  const fullMapUrl = isKillimaValley
    ? "/maps/Kilima%20Village"
    : isBahariBay
      ? "/maps/Bahari%20Bay"
      : isElderwood
        ? "/maps/Elderwood"
        : "/maps/Royal%20Highlands";

  const maps = [
    {
      id: "kilima-valley",
      labelKey: "rummagePile.map.kilimaValley",
      icon: HomeIcon,
      active: isKillimaValley,
    },
    {
      id: "bahari-bay",
      labelKey: "rummagePile.map.bahariBay",
      icon: UmbrellaIcon,
      active: isBahariBay,
    },
    {
      id: "elderwood",
      labelKey: "rummagePile.map.elderwood",
      icon: TreesIcon,
      active: isElderwood,
    },
    {
      id: "royal-highlands",
      labelKey: "rummagePile.map.royalHighlands",
      icon: MountainIcon,
      active: isRoyalHighlands,
    },
  ];

  return (
    <>
      {/* Map Selector */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {maps.map((map) => {
          const Icon = map.icon;
          return (
            <Button
              key={map.id}
              variant={map.active ? "default" : "secondary"}
              className={
                map.active
                  ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                  : "hover:bg-secondary/60"
              }
              asChild
            >
              <Link href={`?${createQueryString("map", map.id)}`}>
                <Icon className="w-4 h-4 mr-2" />
                {t(map.labelKey)}
              </Link>
            </Button>
          );
        })}
      </div>

      {/* Map Display */}
      <PileMapDynamic
        spawns={[...targetSpawns, ...stableSpawns]}
        mapName={mapName}
        tiles={tiles}
        icons={icons}
      />

      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Live Indicator (only when live tracking is available) */}
        {timestamp !== undefined ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-400 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {t("rummagePile.map.live")} •{" "}
            {formatRelativeTime(new Date(timestamp))}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-sm text-amber-400 border border-amber-500/20">
            {t("rummagePile.map.allLocations")}
          </div>
        )}

        {/* Full Map Link */}
        <Link
          href={fullMapUrl}
          className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <ExpandIcon className="w-3.5 h-3.5" />
          {t("rummagePile.map.exploreFullMap")}
        </Link>

        {/* Loot Tables Link */}
        <a
          href="#loot-tables"
          className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <PackageIcon className="w-3.5 h-3.5" />
          {t("rummagePile.map.viewLootTables")}
        </a>
      </div>
    </>
  );
}
