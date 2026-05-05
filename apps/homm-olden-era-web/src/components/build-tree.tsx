"use client";

import { useMemo } from "react";
import Link from "next/link";
import { localizePath } from "@repo/lib";
import { resolveDict } from "@/components/resolve-dict";
import { SpriteIcon } from "@/components/sprite-icon";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type BuildingItem = {
  id: string;
  icon?: IconSprite | string;
  props?: {
    faction?: string;
    category?: string;
    sid?: string;
    levels?: {
      name?: string;
      icon?: string;
      costs?: { name: string; cost: number }[];
      prerequisites?: { sid: string; level: number }[];
      nodePos?: { xPos: number; yPos: number };
    }[];
  };
};

type DatabaseEntry = {
  type: string;
  items: BuildingItem[];
};

const CATEGORY_COLORS: Record<string, string> = {
  mains: "border-amber-700/60 bg-amber-950/40",
  taverns: "border-orange-700/60 bg-orange-950/40",
  markets: "border-emerald-700/60 bg-emerald-950/40",
  artifactMarkets: "border-purple-700/60 bg-purple-950/40",
  magicGuilds: "border-indigo-700/60 bg-indigo-950/40",
  walls: "border-stone-600/60 bg-stone-950/40",
  banks: "border-yellow-700/60 bg-yellow-950/40",
  hires: "border-red-700/60 bg-red-950/40",
  intelligences: "border-cyan-700/60 bg-cyan-950/40",
  trainingRanges: "border-rose-700/60 bg-rose-950/40",
  graals: "border-fuchsia-700/60 bg-fuchsia-950/40",
  manaFountains: "border-teal-700/60 bg-teal-950/40",
  unitsConverters: "border-pink-700/60 bg-pink-950/40",
  heroBonusBanks: "border-lime-700/60 bg-lime-950/40",
  artifactChangers: "border-violet-700/60 bg-violet-950/40",
  myceliumRoots: "border-green-700/60 bg-green-950/40",
  rebirthShrines: "border-sky-700/60 bg-sky-950/40",
  portalSummonings: "border-blue-700/60 bg-blue-950/40",
};

// Layout constants (px)
const BOX_WIDTH = 130;
const BOX_HEIGHT = 84;
const COL_GAP = 14;
const ROW_GAP = 36;
const PADDING = 8;

type Node = {
  key: string;
  buildingId: string;
  sid: string;
  level: number;
  name: string;
  icon?: IconSprite | string;
  category: string;
  prerequisites: { sid: string; level: number }[];
  col: number;
  row: number;
};

export function BuildTree({
  factionId,
  database,
  dict,
  locale = "en",
}: {
  factionId: string;
  database: DatabaseEntry[];
  dict: Record<string, string>;
  locale?: string;
}) {
  const layout = useMemo(() => {
    const cat = database.find((c) => c.type === "buildings");
    const buildings: BuildingItem[] = cat
      ? cat.items.filter((i) => i.props?.faction === factionId)
      : [];

    // Build a node for every (building, level) pair using game-data nodePos
    const nodes: Node[] = [];
    const nodeByKey = new Map<string, Node>();
    for (const b of buildings) {
      const sid = b.props?.sid;
      if (!sid) continue;
      const levels = b.props?.levels ?? [];
      for (let i = 0; i < levels.length; i++) {
        const lvl = i + 1;
        const lvlData = levels[i];
        const labelKey = lvlData?.name ?? b.id;
        const resolved = resolveDict(dict, labelKey);
        const name = resolved !== labelKey ? resolved : resolveDict(dict, b.id);
        // Use exact in-game grid coordinates from nodePos
        const pos = lvlData?.nodePos;
        if (!pos) continue;
        const node: Node = {
          key: `${sid}_${lvl}`,
          buildingId: b.id,
          sid,
          level: lvl,
          name,
          icon: b.icon,
          category: b.props?.category ?? "",
          prerequisites: lvlData?.prerequisites ?? [],
          col: pos.xPos,
          row: pos.yPos,
        };
        nodes.push(node);
        nodeByKey.set(node.key, node);
      }
    }

    // Edges from prerequisite → dependent
    type Edge = { from: Node; to: Node };
    const edges: Edge[] = [];
    for (const node of nodes) {
      for (const p of node.prerequisites) {
        const parentKey = `${p.sid}_${p.level}`;
        const parent = nodeByKey.get(parentKey);
        if (parent) edges.push({ from: parent, to: node });
      }
    }

    if (nodes.length === 0) {
      return { nodes: [], edges: [], totalWidth: 0, totalHeight: 0 };
    }

    const maxCol = Math.max(...nodes.map((n) => n.col));
    const maxRow = Math.max(...nodes.map((n) => n.row));
    const totalWidth =
      PADDING * 2 + (maxCol + 1) * BOX_WIDTH + maxCol * COL_GAP;
    const totalHeight =
      PADDING * 2 + (maxRow + 1) * BOX_HEIGHT + maxRow * ROW_GAP;

    return { nodes, edges, totalWidth, totalHeight };
  }, [database, dict, factionId]);

  if (layout.nodes.length === 0) return null;

  function xOf(col: number) {
    return PADDING + col * (BOX_WIDTH + COL_GAP);
  }
  function yOf(row: number) {
    return PADDING + row * (BOX_HEIGHT + ROW_GAP);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground">
          Build Tree
        </h2>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Scroll horizontally if needed
        </span>
      </div>

      <div className="overflow-x-auto pb-2 themed-scroll">
        <div
          className="relative"
          style={{
            width: layout.totalWidth,
            height: layout.totalHeight,
            minWidth: layout.totalWidth,
          }}
        >
          {/* SVG arrows (rendered behind boxes) */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={layout.totalWidth}
            height={layout.totalHeight}
            style={{ overflow: "visible" }}
          >
            <defs>
              <marker
                id={`arrow-${factionId}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill="rgb(120 113 108 / 0.85)"
                />
              </marker>
            </defs>
            {layout.edges.map((e, i) => {
              const x1 = xOf(e.from.col) + BOX_WIDTH / 2;
              const y1 = yOf(e.from.row) + BOX_HEIGHT;
              const x2 = xOf(e.to.col) + BOX_WIDTH / 2;
              const y2 = yOf(e.to.row);
              if (Math.abs(x1 - x2) < 1) {
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgb(120 113 108 / 0.6)"
                    strokeWidth="1.5"
                    markerEnd={`url(#arrow-${factionId})`}
                  />
                );
              }
              const midY = (y1 + y2) / 2;
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  fill="none"
                  stroke="rgb(120 113 108 / 0.6)"
                  strokeWidth="1.5"
                  markerEnd={`url(#arrow-${factionId})`}
                />
              );
            })}
          </svg>

          {/* Building boxes */}
          {layout.nodes.map((node) => {
            const colorClass =
              CATEGORY_COLORS[node.category] ??
              "border-slate-700 bg-slate-900/40";
            return (
              <Link
                key={node.key}
                href={localizePath(`/db/buildings/${node.buildingId}`, locale)}
                prefetch={false}
                className={`absolute flex flex-col items-center justify-center gap-1 px-2 py-1.5 rounded border transition-colors ${colorClass} hover:bg-zinc-800/70 hover:border-amber-500/70`}
                style={{
                  left: xOf(node.col),
                  top: yOf(node.row),
                  width: BOX_WIDTH,
                  height: BOX_HEIGHT,
                }}
              >
                {node.icon && typeof node.icon === "object" && (
                  <SpriteIcon icon={node.icon as IconSprite} size={36} />
                )}
                <div className="text-[11px] leading-tight text-center w-full line-clamp-2">
                  {node.name}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
