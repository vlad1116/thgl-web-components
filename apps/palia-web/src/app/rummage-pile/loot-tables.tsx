"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@repo/ui/controls";
import { ScrollArea } from "@repo/ui/controls";
import { DataTable, type ColumnDef } from "@repo/ui/data";
import {
  PackageIcon,
  SnowflakeIcon,
  TreesIcon,
  UmbrellaIcon,
  HomeIcon,
  ArrowUpDown,
  PlusIcon,
  MinusIcon,
  RotateCcwIcon,
} from "lucide-react";
import rummageLoot from "./rummage-loot.json";

const STORAGE_KEY = "palia-rummage-loot-tracker";

type LootItem = {
  name: string;
  weight: number;
  chance: string;
  icon: string;
  rarity?: string;
  isRecipe?: boolean;
  isSeasonal?: boolean;
};

type LootPool = {
  name: string;
  location: string;
  items: LootItem[];
  totalWeight: number;
};

type TrackerData = Record<string, Record<string, number>>;

const pools = rummageLoot.pools as Record<string, LootPool>;

const tabs = [
  {
    id: "chapaaNest",
    label: "Kilima Village",
    icon: HomeIcon,
  },
  {
    id: "beachTrash",
    label: "Bahari Bay",
    icon: UmbrellaIcon,
  },
  {
    id: "elderwood",
    label: "Elderwood",
    icon: TreesIcon,
  },
];

const rarityOrder: Record<string, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 4,
  Legendary: 5,
};

const rarityColors: Record<string, string> = {
  Common: "text-zinc-400",
  Uncommon: "text-emerald-400",
  Rare: "text-sky-400",
  Epic: "text-violet-400",
  Legendary: "text-amber-400",
};

const rarityBgColors: Record<string, string> = {
  Common: "bg-zinc-500/10 border-zinc-500/20",
  Uncommon: "bg-emerald-500/10 border-emerald-500/20",
  Rare: "bg-sky-500/10 border-sky-500/20",
  Epic: "bg-violet-500/10 border-violet-500/20",
  Legendary: "bg-amber-500/10 border-amber-500/20",
};

function createColumns(
  poolId: string,
  tracker: TrackerData,
  onIncrement: (poolId: string, itemName: string) => void,
  onDecrement: (poolId: string, itemName: string) => void,
): ColumnDef<LootItem>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Item
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.name}</span>
            {item.isRecipe && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Recipe
              </span>
            )}
            {item.isSeasonal && (
              <span
                className="shrink-0 text-sky-400"
                title="Seasonal - Winter only"
              >
                <SnowflakeIcon className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "chance",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Chance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary border border-primary/20">
          {row.getValue("chance")}
        </span>
      ),
      sortingFn: (rowA, rowB) => {
        const a = parseFloat(rowA.original.chance);
        const b = parseFloat(rowB.original.chance);
        return a - b;
      },
    },
    {
      accessorKey: "rarity",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Rarity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const rarity = row.getValue("rarity") as string | undefined;
        if (!rarity) {
          return <span className="text-muted-foreground/50">—</span>;
        }
        return (
          <span
            className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
              rarityBgColors[rarity] || "bg-muted/50"
            } ${rarityColors[rarity] || "text-muted-foreground"}`}
          >
            {rarity}
          </span>
        );
      },
      sortingFn: (rowA, rowB) => {
        const a = rarityOrder[rowA.original.rarity || ""] || 0;
        const b = rarityOrder[rowB.original.rarity || ""] || 0;
        return a - b;
      },
    },
    {
      id: "collected",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Collected
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorFn: (row) => tracker[poolId]?.[row.name] || 0,
      cell: ({ row }) => {
        const item = row.original;
        const count = tracker[poolId]?.[item.name] || 0;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDecrement(poolId, item.name);
              }}
              disabled={count === 0}
            >
              <MinusIcon className="h-3.5 w-3.5" />
            </Button>
            <span
              className={`min-w-[2.5rem] text-center font-mono text-sm font-semibold rounded-md px-2 py-1 ${
                count > 0
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-muted/30 text-muted-foreground"
              }`}
            >
              {count}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onIncrement(poolId, item.name);
              }}
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
      sortingFn: (rowA, rowB) => {
        const a = tracker[poolId]?.[rowA.original.name] || 0;
        const b = tracker[poolId]?.[rowB.original.name] || 0;
        return a - b;
      },
    },
  ];
}

export default function LootTables() {
  const [activeTab, setActiveTab] = useState("chapaaNest");
  const [tracker, setTracker] = useState<TrackerData>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTracker(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load tracker data:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when tracker changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
      } catch (e) {
        console.error("Failed to save tracker data:", e);
      }
    }
  }, [tracker, isLoaded]);

  const handleIncrement = useCallback((poolId: string, itemName: string) => {
    setTracker((prev) => ({
      ...prev,
      [poolId]: {
        ...prev[poolId],
        [itemName]: (prev[poolId]?.[itemName] || 0) + 1,
      },
    }));
  }, []);

  const handleDecrement = useCallback((poolId: string, itemName: string) => {
    setTracker((prev) => {
      const currentCount = prev[poolId]?.[itemName] || 0;
      if (currentCount <= 0) return prev;
      return {
        ...prev,
        [poolId]: {
          ...prev[poolId],
          [itemName]: currentCount - 1,
        },
      };
    });
  }, []);

  const handleResetPool = useCallback((poolId: string) => {
    setTracker((prev) => ({
      ...prev,
      [poolId]: {},
    }));
  }, []);

  const handleResetAll = useCallback(() => {
    setTracker({});
  }, []);

  const activePool = pools[activeTab];
  const columns = createColumns(
    activeTab,
    tracker,
    handleIncrement,
    handleDecrement,
  );

  // Calculate total collected for current pool
  const totalCollected = Object.values(tracker[activeTab] || {}).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <section
      id="loot-tables"
      className="mt-8 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border border-primary/20 p-6 md:p-8"
    >
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
            <PackageIcon className="w-6 h-6" />
            Loot Drop Tables
          </h3>
          <p className="text-muted-foreground">
            See what items you can find in each region&apos;s rummage piles
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground hover:text-destructive hover:border-destructive/50"
          onClick={handleResetAll}
        >
          <RotateCcwIcon className="w-3.5 h-3.5 mr-2" />
          Reset All
        </Button>
      </div>

      {/* Tab Selector */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const poolTotal = Object.values(tracker[tab.id] || {}).reduce(
            (sum, count) => sum + count,
            0,
          );
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "secondary"}
              className={
                isActive
                  ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                  : "hover:bg-secondary/60"
              }
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
              {poolTotal > 0 && (
                <span className="ml-2 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-xs font-semibold text-emerald-400">
                  {poolTotal}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Pool Info */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-card/50 px-4 py-1.5 text-sm text-muted-foreground border border-border/50">
          {activePool.items.length} possible drops from {activePool.name}
        </span>
        {totalCollected > 0 && (
          <>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 border border-emerald-500/20">
              {totalCollected} items collected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => handleResetPool(activeTab)}
            >
              <RotateCcwIcon className="w-3 h-3 mr-1" />
              Reset {activePool.name}
            </Button>
          </>
        )}
      </div>

      {/* Data Table with ScrollArea */}
      <ScrollArea className="h-[420px]">
        <DataTable
          columns={columns}
          data={activePool.items}
          filterColumn="name"
        />
      </ScrollArea>

      {/* Footer note */}
      <p className="mt-4 text-xs text-muted-foreground/70 text-center">
        Drop rates are extracted from game files and may change with updates.
        Seasonal items only appear during their respective events. Your
        collection progress is saved locally.
      </p>
    </section>
  );
}
