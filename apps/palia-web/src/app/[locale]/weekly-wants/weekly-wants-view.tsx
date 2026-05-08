"use client";

import { useEffect, useMemo, useState } from "react";
import {
  villagers as villagersData,
  itemIcons as itemIconsData,
  type WEEKLY_WANTS,
} from "@repo/ui/data";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/controls";
import { useT } from "@repo/ui/providers";
import { getIconsUrl } from "@repo/lib";
import { Heart, Clock, Gift } from "lucide-react";

type Item = WEEKLY_WANTS["weeklyWants"][string][number];

const itemIcons = itemIconsData as Record<string, string>;

function Countdown({ resetAt }: { resetAt: number }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) {
    return (
      <span className="font-mono tabular-nums text-muted-foreground">
        —
      </span>
    );
  }

  const diff = Math.max(0, resetAt - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);

  return (
    <span className="font-mono tabular-nums">
      {days}d {String(hours).padStart(2, "0")}h{" "}
      {String(minutes).padStart(2, "0")}m {String(seconds).padStart(2, "0")}s
    </span>
  );
}

function ItemTile({ item }: { item: Item }) {
  const t = useT();
  const isLove = item.rewardLevel === "Love";
  const iconFile = itemIcons[item.objectId];
  const iconSrc = iconFile
    ? getIconsUrl("palia", `/icons/${iconFile}`)
    : null;

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <div
          className={`relative aspect-square rounded-md border flex items-center justify-center transition-colors ${
            isLove
              ? "border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10"
              : "border-border/50 bg-muted/30 hover:bg-muted/50"
          }`}
        >
          {iconSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconSrc}
              alt=""
              loading="lazy"
              className="w-3/4 h-3/4 object-contain"
            />
          ) : (
            <Gift className="w-1/2 h-1/2 text-muted-foreground" />
          )}
          {isLove && (
            <Heart
              className="absolute top-0.5 right-0.5 w-3 h-3 text-rose-400 fill-rose-400"
              strokeWidth={0}
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <p className="font-medium">{t(item.objectId)}</p>
        <p
          className={`text-[10px] ${
            isLove ? "text-rose-400" : "text-muted-foreground"
          }`}
        >
          {isLove ? "Love" : "Like"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function VillagerCard({
  villager,
  items,
}: {
  villager: (typeof villagersData)[number];
  items: Item[];
}) {
  const t = useT();
  const portrait = getIconsUrl("palia", `/icons/${villager.icon}`);
  const sortedItems = [...items].sort((a, b) => {
    if (a.rewardLevel === b.rewardLevel) return 0;
    return a.rewardLevel === "Love" ? -1 : 1;
  });
  const loveCount = items.filter((i) => i.rewardLevel === "Love").length;

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={portrait}
          alt={t(villager.type)}
          width={48}
          height={48}
          loading="lazy"
          className="w-12 h-12 rounded-full object-cover border border-border/50 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold truncate">{t(villager.type)}</h3>
          <p className="text-xs text-muted-foreground tabular-nums">
            {items.length} {items.length === 1 ? "want" : "wants"}
            {loveCount > 0 && (
              <>
                {" · "}
                <span className="text-rose-400 inline-flex items-center gap-0.5">
                  <Heart className="w-3 h-3 fill-current" strokeWidth={0} />
                  {loveCount}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {sortedItems.map((item) => (
          <ItemTile key={item.itemPersistId} item={item} />
        ))}
      </div>
    </div>
  );
}

export function WeeklyWantsView({
  data,
  locale,
}: {
  data: WEEKLY_WANTS;
  locale: string;
}) {
  const t = useT();

  const resetAt = data.timestamp + 7 * 24 * 60 * 60 * 1000;
  const lastUpdated = new Date(data.timestamp).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const sortedVillagers = useMemo(() => {
    return [...villagersData]
      .filter((v) => (data.weeklyWants[v.type]?.length ?? 0) > 0)
      .sort((a, b) => t(a.type).localeCompare(t(b.type)));
  }, [data, t]);

  const totalWants = sortedVillagers.reduce(
    (sum, v) => sum + (data.weeklyWants[v.type]?.length ?? 0),
    0,
  );
  const totalLoves = sortedVillagers.reduce(
    (sum, v) =>
      sum +
      (data.weeklyWants[v.type]?.filter((i) => i.rewardLevel === "Love")
        .length ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border/50 bg-card/30 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Resets in</span>
          <Countdown resetAt={resetAt} />
        </div>
        <div className="text-muted-foreground">
          <span className="text-foreground tabular-nums font-medium">
            {sortedVillagers.length}
          </span>{" "}
          villagers ·{" "}
          <span className="text-rose-400 tabular-nums font-medium">
            {totalLoves}
          </span>{" "}
          loves ·{" "}
          <span className="text-foreground tabular-nums font-medium">
            {totalWants}
          </span>{" "}
          wants
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          Updated {lastUpdated}
        </div>
      </div>

      {/* Villager grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sortedVillagers.map((villager) => (
          <VillagerCard
            key={villager.persistId}
            villager={villager}
            items={data.weeklyWants[villager.type] ?? []}
          />
        ))}
      </div>
    </div>
  );
}
