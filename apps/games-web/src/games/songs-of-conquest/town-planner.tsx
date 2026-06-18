"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cinzel } from "next/font/google";
import { SpriteIcon } from "@/lib/db/sprite-icon";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["500", "700", "900"] });

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
type CostEntry = { amount: number; name: string; iconId?: string };
type Level = {
  level: number;
  cost: CostEntry[];
  requires: string[];
  recruits?: { id: string; name: string }[];
};
type Building = {
  id: string;
  name: string;
  costEntries?: CostEntry[];
  levels?: Level[];
  recruits?: { id: string; name: string }[];
};

/** One planner node = a specific building LEVEL (Farm Lv 1, Farm Lv 2, …). */
type Node = {
  key: string; // `${buildingId}/${level}`
  id: string; // building id (for icon)
  level: number;
  name: string;
  cost: CostEntry[];
  recruits: { id: string; name: string }[];
  requires: string[]; // prerequisite node keys
};

/**
 * Songs of Conquest "Town Build" planner — heraldic war-room build tree.
 *
 * Each building LEVEL is its own card (Farm Lv 1 → Farm Lv 2, …), laid out in
 * dependency tiers with gilded connector threads. Click cards to assemble a
 * build plan; the Build Order table lists the topologically-sorted steps with
 * per-step + cumulative cost. Hover to trace what a level needs and unlocks.
 */
export function TownPlanner({
  buildings,
  appName,
  iconsHash,
  icons,
  factionLabel,
}: {
  buildings: Building[];
  appName: string;
  iconsHash?: string;
  icons?: Record<string, IconSprite>;
  factionLabel?: string;
}) {
  // ─── Per-level nodes ───────────────────────────────────────────────────
  const { nodes, byKey } = useMemo(() => {
    const list: Node[] = [];
    for (const b of buildings) {
      const lvls: Level[] = b.levels?.length
        ? b.levels
        : [
            {
              level: 1,
              cost: b.costEntries ?? [],
              requires: [],
              recruits: b.recruits,
            },
          ];
      for (const lvl of lvls) {
        list.push({
          key: `${b.id}/${lvl.level}`,
          id: b.id,
          level: lvl.level,
          name: b.name,
          cost: lvl.cost ?? [],
          recruits: lvl.recruits ?? [],
          requires: [
            ...(lvl.level > 1 ? [`${b.id}/${lvl.level - 1}`] : []),
            ...(lvl.requires ?? []).map((r) => `${r}/1`),
          ],
        });
      }
    }
    const map = new Map(list.map((n) => [n.key, n]));
    for (const n of list) n.requires = n.requires.filter((k) => map.has(k));
    return { nodes: list, byKey: map };
  }, [buildings]);

  // Tier = longest prerequisite chain depth (cycle-safe).
  const tiers = useMemo(() => {
    const depth = new Map<string, number>();
    const visiting = new Set<string>();
    const calc = (key: string): number => {
      if (depth.has(key)) return depth.get(key)!;
      if (visiting.has(key)) return 0;
      visiting.add(key);
      const reqs = byKey.get(key)?.requires ?? [];
      const d = reqs.length ? 1 + Math.max(...reqs.map(calc)) : 0;
      visiting.delete(key);
      depth.set(key, d);
      return d;
    };
    nodes.forEach((n) => calc(n.key));
    const max = Math.max(0, ...[...depth.values()]);
    const rows: Node[][] = Array.from({ length: max + 1 }, () => []);
    nodes.forEach((n) => rows[depth.get(n.key) ?? 0].push(n));
    return rows.filter((r) => r.length);
  }, [nodes, byKey]);

  // Muster roll: each troop and the node(s) that train it.
  const troops = useMemo(() => {
    const m = new Map<string, { id: string; name: string; from: string[] }>();
    for (const n of nodes)
      for (const u of n.recruits) {
        const e = m.get(u.id) ?? { id: u.id, name: u.name, from: [] };
        e.from.push(n.key);
        m.set(u.id, e);
      }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [nodes]);

  // Reverse adjacency: node key → node keys that require it.
  const dependents = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const n of nodes)
      for (const r of n.requires) {
        if (!m.has(r)) m.set(r, []);
        m.get(r)!.push(n.key);
      }
    return m;
  }, [nodes]);

  // Build plan: multi-select set of node keys (click to toggle).
  const [plan, setPlan] = useState<Set<string>>(new Set());
  const [pinnedTroop, setPinnedTroop] = useState<string | null>(null);
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [hoverTroop, setHoverTroop] = useState<string | null>(null);
  const activeTroop = pinnedTroop ?? hoverTroop;
  const planActive = plan.size > 0;
  const hasSelection = planActive || !!pinnedTroop;

  // Build Order: the planned nodes + every prerequisite node, topologically
  // sorted, with per-step + running cost.
  const buildOrder = useMemo(() => {
    if (plan.size === 0)
      return [] as {
        key: string;
        id: string;
        level: number;
        name: string;
        cost: CostEntry[];
        cumulative: CostEntry[];
      }[];
    const need = new Set<string>();
    const add = (k: string) => {
      if (need.has(k)) return;
      need.add(k);
      byKey.get(k)?.requires.forEach(add);
    };
    plan.forEach(add);
    const keys = [...need];
    const name = (k: string) => byKey.get(k)?.name ?? k;
    const cmp = (a: string, b: string) => {
      const na = name(a),
        nb = name(b);
      return na === nb
        ? (byKey.get(a)?.level ?? 0) - (byKey.get(b)?.level ?? 0)
        : na.localeCompare(nb);
    };
    const indeg = new Map<string, number>();
    const children = new Map<string, string[]>();
    keys.forEach((k) => indeg.set(k, 0));
    keys.forEach((k) =>
      (byKey.get(k)?.requires ?? [])
        .filter((r) => need.has(r))
        .forEach((r) => {
          indeg.set(k, (indeg.get(k) ?? 0) + 1);
          if (!children.has(r)) children.set(r, []);
          children.get(r)!.push(k);
        }),
    );
    const ready = keys.filter((k) => (indeg.get(k) ?? 0) === 0).sort(cmp);
    const ordered: string[] = [];
    while (ready.length) {
      const k = ready.shift()!;
      ordered.push(k);
      for (const c of children.get(k) ?? []) {
        indeg.set(c, (indeg.get(c) ?? 1) - 1);
        if (indeg.get(c) === 0) {
          ready.push(c);
          ready.sort(cmp);
        }
      }
    }
    const running = new Map<string, { amount: number; iconId?: string }>();
    return ordered.map((k) => {
      const n = byKey.get(k)!;
      n.cost.forEach((c) => {
        const e = running.get(c.name) ?? { amount: 0, iconId: c.iconId };
        e.amount += c.amount;
        running.set(c.name, e);
      });
      return {
        key: k,
        id: n.id,
        level: n.level,
        name: n.name,
        cost: n.cost,
        cumulative: [...running].map(([nm, e]) => ({
          name: nm,
          amount: e.amount,
          iconId: e.iconId,
        })),
      };
    });
  }, [plan, byKey]);

  // Highlight: whole build-order set when planning; else hovered node's
  // prereq+enable chain, or a troop's training nodes + their prerequisites.
  const highlight = useMemo(() => {
    const set = new Set<string>();
    const up = (k: string) => {
      if (set.has(k)) return;
      set.add(k);
      byKey.get(k)?.requires.forEach(up);
    };
    const down = (k: string) => {
      for (const d of dependents.get(k) ?? []) {
        if (set.has(d)) continue;
        set.add(d);
        down(d);
      }
    };
    // The plan's full build order, plus — additively — the hovered node's
    // prereq+enable chain (so you can still inspect connections while planning).
    if (planActive) buildOrder.forEach((s) => set.add(s.key));
    if (hoverNode) {
      up(hoverNode);
      down(hoverNode);
    }
    if (activeTroop) troops.find((t) => t.id === activeTroop)?.from.forEach(up);
    return set;
  }, [
    planActive,
    buildOrder,
    hoverNode,
    activeTroop,
    byKey,
    troops,
    dependents,
  ]);

  const dimmed = highlight.size > 0;

  // ─── Connector geometry ────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const [rects, setRects] = useState<
    Map<string, { x: number; y: number; w: number; h: number }>
  >(new Map());
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const measure = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const base = c.getBoundingClientRect();
    const next = new Map<
      string,
      { x: number; y: number; w: number; h: number }
    >();
    cardRefs.current.forEach((el, key) => {
      const r = el.getBoundingClientRect();
      next.set(key, {
        x: r.left - base.left,
        y: r.top - base.top,
        w: r.width,
        h: r.height,
      });
    });
    setRects(next);
    setSize({ w: base.width, h: c.scrollHeight });
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, tiers]);

  const edges = useMemo(() => {
    const out: {
      from: string;
      to: string;
      upgrade: boolean;
      active: boolean;
    }[] = [];
    for (const n of nodes)
      for (const req of n.requires)
        out.push({
          from: n.key,
          to: req,
          upgrade: byKey.get(req)?.id === n.id, // same building = upgrade edge
          active: highlight.has(n.key) && highlight.has(req),
        });
    return out;
  }, [nodes, byKey, highlight]);

  const path = (from: string, to: string) => {
    const a = rects.get(from);
    const b = rects.get(to);
    if (!a || !b) return "";
    const x1 = a.x + a.w / 2,
      y1 = a.y;
    const x2 = b.x + b.w / 2,
      y2 = b.y + b.h;
    const my = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
  };

  const clear = () => {
    setPlan(new Set());
    setPinnedTroop(null);
    setHoverNode(null);
    setHoverTroop(null);
  };

  const renderCost = (entries: CostEntry[], muted = false) => (
    <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
      {entries.map((c, i) => (
        <span
          key={i}
          title={c.name}
          className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
            muted ? "text-amber-300/70" : "text-amber-200/90"
          }`}
        >
          {c.amount}
          {c.iconId && icons?.[c.iconId] ? (
            <SpriteIcon
              icon={icons[c.iconId]}
              appName={appName}
              size={13}
              iconsHash={iconsHash}
            />
          ) : (
            <span className="text-amber-500/60">{" " + c.name}</span>
          )}
        </span>
      ))}
    </span>
  );

  return (
    <div
      className={`${cinzel.className} relative mt-8 overflow-hidden rounded-lg border border-amber-900/40 bg-[#0e1014] p-5 sm:p-7`}
      style={{
        backgroundImage:
          "radial-gradient(120% 80% at 50% -10%, rgba(214,178,102,0.10), transparent 60%), radial-gradient(80% 60% at 50% 120%, rgba(120,90,40,0.08), transparent 60%)",
      }}
    >
      <div className="pointer-events-none absolute inset-1.5 rounded-md border border-amber-700/20" />

      <header className="relative mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.45em] text-amber-600/80">
            {factionLabel ?? "Stronghold"}
          </div>
          <h2
            className="text-2xl sm:text-3xl font-black tracking-[0.18em] text-amber-100"
            style={{
              textShadow: "0 1px 0 #000, 0 0 18px rgba(214,178,102,0.25)",
            }}
          >
            TOWN BUILD
          </h2>
          <p className="mt-1 text-[11px] tracking-wide text-amber-700/60">
            Click building levels to plan a build order · hover to trace what
            each needs &amp; unlocks
          </p>
        </div>
        {hasSelection && (
          <button
            onClick={clear}
            className="shrink-0 rounded border border-amber-700/40 bg-amber-950/30 px-3 py-1 text-[11px] uppercase tracking-widest text-amber-300/90 transition-colors hover:bg-amber-900/30"
          >
            Reset
          </button>
        )}
      </header>

      <div ref={containerRef} className="relative">
        <svg
          className="pointer-events-none absolute inset-0"
          width={size.w}
          height={size.h}
          style={{ overflow: "visible" }}
        >
          {mounted &&
            edges
              .filter((e) => e.active)
              .map((e, i) => (
                <path
                  key={`a${i}`}
                  d={path(e.from, e.to)}
                  fill="none"
                  stroke={
                    e.upgrade
                      ? "rgba(160,205,245,0.9)"
                      : "rgba(245,200,110,0.95)"
                  }
                  strokeWidth={2.5}
                  strokeDasharray={e.upgrade ? "5 4" : undefined}
                  style={{
                    filter: `drop-shadow(0 0 5px ${e.upgrade ? "rgba(160,205,245,0.5)" : "rgba(245,200,110,0.6)"})`,
                  }}
                />
              ))}
        </svg>

        <div className="relative flex flex-col gap-10">
          {tiers.map((tier, ti) => (
            <div key={ti} className="relative">
              <div className="mb-2 text-[10px] uppercase tracking-[0.35em] text-amber-700/50">
                Tier {toRoman(ti + 1)}
              </div>
              <div className="flex flex-wrap gap-4">
                {tier.map((n) => {
                  const planned = plan.has(n.key);
                  const lit = highlight.has(n.key);
                  const faded = dimmed && !lit;
                  return (
                    <div
                      key={n.key}
                      ref={(el) => {
                        if (el) cardRefs.current.set(n.key, el);
                        else cardRefs.current.delete(n.key);
                      }}
                      onMouseEnter={() => setHoverNode(n.key)}
                      onMouseLeave={() => setHoverNode(null)}
                      onClick={() => {
                        setHoverNode(null);
                        setHoverTroop(null);
                        setPinnedTroop(null);
                        setPlan((cur) => {
                          const next = new Set(cur);
                          next.has(n.key)
                            ? next.delete(n.key)
                            : next.add(n.key);
                          return next;
                        });
                      }}
                      title={
                        planned ? "Remove from build plan" : "Add to build plan"
                      }
                      className={`group relative w-[176px] cursor-pointer rounded-md border p-3 transition-all duration-200 ${
                        planned
                          ? "border-amber-400/90 bg-amber-950/40"
                          : lit
                            ? "border-amber-600/60 bg-[#15171d]"
                            : "border-slate-700/60 bg-[#13151a]"
                      }`}
                      style={{
                        opacity: faded ? 0.32 : 1,
                        boxShadow: planned
                          ? "0 0 0 1px rgba(245,200,110,0.45), 0 8px 26px rgba(0,0,0,0.5)"
                          : "0 6px 18px rgba(0,0,0,0.4)",
                      }}
                    >
                      {planned && (
                        <span className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-amber-400/80 bg-amber-500 text-[11px] font-bold text-black">
                          ✓
                        </span>
                      )}
                      <Corner className="left-1 top-1" />
                      <Corner className="right-1 top-1 rotate-90" />
                      <Corner className="left-1 bottom-1 -rotate-90" />
                      <Corner className="right-1 bottom-1 rotate-180" />

                      <div className="flex items-center gap-2.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-amber-800/40 bg-black/40">
                          {icons?.[n.id] ? (
                            <SpriteIcon
                              icon={icons[n.id]}
                              appName={appName}
                              size={40}
                              iconsHash={iconsHash}
                            />
                          ) : (
                            <span className="text-amber-700/50 text-lg">⌂</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[13px] font-bold tracking-wide text-amber-50">
                              {n.name}
                            </span>
                            <span
                              className={`shrink-0 rounded-sm border px-1 text-[9px] font-semibold leading-tight ${
                                n.level > 1
                                  ? "border-sky-600/50 bg-sky-950/40 text-sky-300/90"
                                  : "border-amber-700/40 bg-black/40 text-amber-500/80"
                              }`}
                            >
                              Lv {n.level}
                            </span>
                          </div>
                          {n.cost.length > 0 && (
                            <div className="mt-1">{renderCost(n.cost)}</div>
                          )}
                        </div>
                      </div>

                      {n.recruits.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1 border-t border-amber-900/30 pt-2">
                          {n.recruits.map((r) => (
                            <span
                              key={r.id}
                              className={`inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-[9.5px] tracking-wide transition-colors ${
                                activeTroop === r.id
                                  ? "bg-amber-400/25 text-amber-100"
                                  : "bg-black/40 text-slate-300/90"
                              }`}
                            >
                              {icons?.[r.id] && (
                                <SpriteIcon
                                  icon={icons[r.id]}
                                  appName={appName}
                                  size={14}
                                  iconsHash={iconsHash}
                                />
                              )}
                              {r.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Muster roll ── */}
      {troops.length > 0 && (
        <div className="relative mt-8 border-t border-amber-900/30 pt-5">
          <div className="mb-3 text-[10px] uppercase tracking-[0.35em] text-amber-700/60">
            Muster Roll — hover a troop to trace where it's trained
          </div>
          <div className="flex flex-wrap gap-2">
            {troops.map((tr) => {
              const on = activeTroop === tr.id;
              return (
                <button
                  key={tr.id}
                  onMouseEnter={() => setHoverTroop(tr.id)}
                  onMouseLeave={() => setHoverTroop(null)}
                  onClick={() => {
                    setHoverNode(null);
                    setHoverTroop(null);
                    setPlan(new Set());
                    setPinnedTroop((cur) => (cur === tr.id ? null : tr.id));
                  }}
                  className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] tracking-wide transition-all ${
                    on
                      ? "border-amber-400/70 bg-amber-950/50 text-amber-100"
                      : "border-slate-700/60 bg-[#13151a] text-slate-300 hover:border-amber-700/50"
                  }`}
                >
                  {icons?.[tr.id] && (
                    <SpriteIcon
                      icon={icons[tr.id]}
                      appName={appName}
                      size={18}
                      iconsHash={iconsHash}
                    />
                  )}
                  {tr.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Build Order ── */}
      {buildOrder.length > 0 && (
        <div className="relative mt-8 border-t border-amber-900/30 pt-5">
          <div className="mb-3 text-[10px] uppercase tracking-[0.35em] text-amber-700/60">
            Build Order — {buildOrder.length} step
            {buildOrder.length > 1 ? "s" : ""}
          </div>
          <div className="overflow-hidden rounded-md border border-amber-900/30">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black/30 text-[10px] uppercase tracking-wider text-amber-700/70">
                  <th className="w-8 px-3 py-2 text-left font-semibold">#</th>
                  <th className="px-3 py-2 text-left font-semibold">Build</th>
                  <th className="px-3 py-2 text-left font-semibold">Cost</th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Total So Far
                  </th>
                </tr>
              </thead>
              <tbody>
                {buildOrder.map((s, i) => (
                  <tr key={s.key} className="border-t border-slate-800/50">
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        {icons?.[s.id] && (
                          <SpriteIcon
                            icon={icons[s.id]}
                            appName={appName}
                            size={18}
                            iconsHash={iconsHash}
                          />
                        )}
                        <span className="text-amber-50">
                          {s.name}
                          {s.level > 1 && (
                            <span className="text-sky-300/80">
                              {" "}
                              · Lv {s.level}
                            </span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-1.5">{renderCost(s.cost)}</td>
                    <td className="px-3 py-1.5">
                      {renderCost(s.cumulative, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function toRoman(n: number): string {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][n - 1] ?? String(n);
}

/** Small L-shaped gilded corner flourish. */
function Corner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute h-2 w-2 border-l border-t border-amber-600/40 ${className}`}
    />
  );
}
