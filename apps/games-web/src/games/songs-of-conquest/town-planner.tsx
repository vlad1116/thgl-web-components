"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SpriteIcon } from "@/lib/db/sprite-icon";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
type CostEntry = { amount: number; name: string; iconId?: string };
type Recruit = { id: string; name: string; research?: number[] };
type Level = {
  level: number;
  cost: CostEntry[];
  requires: string[];
  recruits?: Recruit[];
};
type Research = { id: number; name: string; cost: CostEntry[] };
type Building = {
  id: string;
  name: string;
  costEntries?: CostEntry[];
  levels?: Level[];
  recruits?: Recruit[];
  research?: Research[];
};

/** One planner node = a specific building LEVEL (Farm Lv 1, Farm Lv 2, …). */
type Node = {
  key: string; // `${buildingId}/${level}`
  id: string; // building id (for icon)
  level: number;
  name: string;
  cost: CostEntry[];
  recruits: { id: string; name: string; research: number[] }[];
  requires: string[]; // prerequisite node keys
};

/**
 * Songs of Conquest "Town Build" planner — an interactive build calculator.
 *
 * Each building LEVEL is its own card (Barracks Lv 1 → Lv 2, …), laid out in
 * dependency tiers with connector threads. It's a persistent multi-select:
 * click a building level (or a troop in Available Troops) to add it + every
 * prerequisite to the plan. Picking a research-gated troop (e.g. Rangers) also
 * selects its gating research ("↳ Call on the Rangers") and its building — which
 * in turn makes every other troop that building trains (e.g. Footmen) available.
 * The Build Order lists the topologically-sorted steps + research rows with
 * per-step and cumulative cost.
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
          recruits: (lvl.recruits ?? []).map((r) => ({
            id: r.id,
            name: r.name,
            research: r.research ?? [],
          })),
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
    const tierRows = rows.filter((r) => r.length);

    // Crossing-minimization (barycenter heuristic): order each tier by the mean
    // position of its neighbours (prerequisites above + dependents below), swept
    // top-down then bottom-up until it settles — so the dependency edges read as
    // a clean tree instead of crossing spaghetti.
    const deps = new Map<string, string[]>();
    for (const n of nodes)
      for (const r of n.requires) {
        if (!deps.has(r)) deps.set(r, []);
        deps.get(r)!.push(n.key);
      }
    const pos = new Map<string, number>();
    tierRows.forEach((t) => t.forEach((n, i) => pos.set(n.key, i)));
    const neigh = (n: Node) => [...n.requires, ...(deps.get(n.key) ?? [])];
    for (let pass = 0; pass < 6; pass++) {
      const order = tierRows.map((_, i) => i);
      if (pass % 2) order.reverse();
      for (const ti of order) {
        const tier = tierRows[ti];
        const bary = new Map<string, number>();
        for (const n of tier) {
          const ns = neigh(n).filter((k) => pos.has(k));
          bary.set(
            n.key,
            ns.length
              ? ns.reduce((s, k) => s + pos.get(k)!, 0) / ns.length
              : pos.get(n.key)!,
          );
        }
        tier.sort(
          (a, b) =>
            bary.get(a.key)! - bary.get(b.key)! ||
            a.name.localeCompare(b.name) ||
            a.level - b.level,
        );
        tier.forEach((n, i) => pos.set(n.key, i));
      }
    }
    return tierRows;
  }, [nodes, byKey]);

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

  // Recruitable troops (for the Available Troops list) — each with the research
  // that gates it + the node(s) that train it (for hover-tracing).
  const troops = useMemo(() => {
    const m = new Map<
      string,
      { id: string; name: string; research: number[]; from: string[] }
    >();
    for (const n of nodes)
      for (const u of n.recruits) {
        const e = m.get(u.id) ?? {
          id: u.id,
          name: u.name,
          research: u.research,
          from: [],
        };
        e.from.push(n.key);
        m.set(u.id, e);
      }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [nodes]);

  // troop id → the building LEVEL node that trains it + its gating research.
  const unitProducer = useMemo(() => {
    const m = new Map<string, { key: string; research: number[] }>();
    for (const n of nodes)
      for (const r of n.recruits)
        m.set(r.id, { key: n.key, research: r.research });
    return m;
  }, [nodes]);

  // Research catalog: id → {name, cost, owner building id} + owner → ids.
  const { researchById, researchByOwner } = useMemo(() => {
    const byId = new Map<
      number,
      { id: number; name: string; cost: CostEntry[]; owner: string }
    >();
    const byOwner = new Map<string, number[]>();
    for (const b of buildings)
      for (const r of b.research ?? []) {
        byId.set(r.id, { ...r, owner: b.id });
        (byOwner.get(b.id) ?? byOwner.set(b.id, []).get(b.id)!).push(r.id);
      }
    return { researchById: byId, researchByOwner: byOwner };
  }, [buildings]);

  // ─── Selection state (persistent multi-select) ─────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedResearch, setSelectedResearch] = useState<Set<number>>(
    new Set(),
  );
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [hoverTroop, setHoverTroop] = useState<string | null>(null);
  const hasSelection = selected.size > 0;

  // Toggle a building-level node: select it + every prerequisite, or (if already
  // selected) deselect it + every dependent — and clear research owned by any
  // deselected level-1 building.
  const computeToggleNode = useCallback(
    (key: string): { sel: Set<string>; res: Set<number> } => {
      const sel = new Set(selected);
      const res = new Set(selectedResearch);
      if (sel.has(key)) {
        const removed = new Set<string>();
        const collect = (k: string) => {
          if (removed.has(k)) return;
          removed.add(k);
          for (const d of dependents.get(k) ?? []) if (sel.has(d)) collect(d);
        };
        collect(key);
        for (const k of removed) {
          const n = byKey.get(k);
          if (n && n.level === 1)
            for (const rid of researchByOwner.get(n.id) ?? []) res.delete(rid);
          sel.delete(k);
        }
      } else {
        const add = (k: string) => {
          if (sel.has(k)) return;
          sel.add(k);
          for (const r of byKey.get(k)?.requires ?? []) add(r);
        };
        add(key);
      }
      return { sel, res };
    },
    [selected, selectedResearch, byKey, dependents, researchByOwner],
  );

  // Click a troop: if it needs research not yet selected, select that research +
  // its building (and prerequisites); otherwise toggle the producing building.
  const toggleTroop = useCallback(
    (troopId: string) => {
      const prod = unitProducer.get(troopId);
      if (!prod) return;
      setHoverNode(null);
      setHoverTroop(null);
      const anyUnselected = prod.research.some(
        (id) => !selectedResearch.has(id),
      );
      if (prod.research.length && anyUnselected) {
        const sel = new Set(selected);
        const res = new Set(selectedResearch);
        const add = (k: string) => {
          if (sel.has(k)) return;
          sel.add(k);
          for (const r of byKey.get(k)?.requires ?? []) add(r);
        };
        add(prod.key);
        prod.research.forEach((id) => res.add(id));
        setSelected(sel);
        setSelectedResearch(res);
      } else {
        const { sel, res } = computeToggleNode(prod.key);
        setSelected(sel);
        setSelectedResearch(res);
      }
    },
    [unitProducer, selected, selectedResearch, byKey, computeToggleNode],
  );

  const toggleNode = useCallback(
    (key: string) => {
      setHoverNode(null);
      setHoverTroop(null);
      const { sel, res } = computeToggleNode(key);
      setSelected(sel);
      setSelectedResearch(res);
    },
    [computeToggleNode],
  );

  const clear = () => {
    setSelected(new Set());
    setSelectedResearch(new Set());
    setHoverNode(null);
    setHoverTroop(null);
  };

  // Troops currently available = trained by a selected building whose gating
  // research (if any) is satisfied. Selecting Rangers (→ Barracks + research)
  // therefore also lights up Footmen (same Barracks, no research).
  const availableTroops = useMemo(() => {
    const set = new Set<string>();
    for (const n of nodes) {
      if (!selected.has(n.key)) continue;
      for (const r of n.recruits)
        if (r.research.every((id) => selectedResearch.has(id))) set.add(r.id);
    }
    return set;
  }, [nodes, selected, selectedResearch]);

  // Build Order: selected nodes topologically sorted, with each selected
  // research inserted right after its (level-1) building, + per-step & running
  // cost.
  type BuildStep = {
    key: string;
    id: string;
    level: number;
    name: string;
    cost: CostEntry[];
    cumulative: CostEntry[];
    isResearch: boolean;
  };
  const buildOrder = useMemo(() => {
    if (!selected.size) return [] as BuildStep[];
    const keys = [...selected];
    const indeg = new Map<string, number>();
    const children = new Map<string, string[]>();
    keys.forEach((k) => indeg.set(k, 0));
    keys.forEach((k) =>
      (byKey.get(k)?.requires ?? [])
        .filter((r) => selected.has(r))
        .forEach((r) => {
          indeg.set(k, (indeg.get(k) ?? 0) + 1);
          if (!children.has(r)) children.set(r, []);
          children.get(r)!.push(k);
        }),
    );
    const name = (k: string) => byKey.get(k)?.name ?? k;
    const cmp = (a: string, b: string) => {
      const na = name(a),
        nb = name(b);
      return na === nb
        ? (byKey.get(a)?.level ?? 0) - (byKey.get(b)?.level ?? 0)
        : na.localeCompare(nb);
    };
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
    const addCost = (cost: CostEntry[]) =>
      cost.forEach((c) => {
        const e = running.get(c.name) ?? { amount: 0, iconId: c.iconId };
        e.amount += c.amount;
        running.set(c.name, e);
      });
    const snap = (): CostEntry[] =>
      [...running].map(([nm, e]) => ({
        name: nm,
        amount: e.amount,
        iconId: e.iconId,
      }));
    const rows: BuildStep[] = [];
    for (const k of ordered) {
      const n = byKey.get(k)!;
      addCost(n.cost);
      rows.push({
        key: k,
        id: n.id,
        level: n.level,
        name: n.name,
        cost: n.cost,
        cumulative: snap(),
        isResearch: false,
      });
      if (n.level === 1)
        for (const rid of researchByOwner.get(n.id) ?? []) {
          if (!selectedResearch.has(rid)) continue;
          const r = researchById.get(rid);
          if (!r) continue;
          addCost(r.cost);
          rows.push({
            key: `research-${rid}`,
            id: n.id,
            level: 1,
            name: r.name,
            cost: r.cost,
            cumulative: snap(),
            isResearch: true,
          });
        }
    }
    return rows;
  }, [selected, selectedResearch, byKey, researchByOwner, researchById]);

  // Highlight: the selected build, plus — additively — a hovered node's
  // prereq+dependent chain or a hovered troop's training chain (for tracing).
  const highlight = useMemo(() => {
    const set = new Set<string>(selected);
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
    if (hoverNode) {
      up(hoverNode);
      down(hoverNode);
    }
    if (hoverTroop)
      (troops.find((t) => t.id === hoverTroop)?.from ?? []).forEach(up);
    return set;
  }, [selected, hoverNode, hoverTroop, byKey, dependents, troops]);

  // Dim the rest only while hovering (to focus a trace); a plain selection keeps
  // the whole tree visible so you can keep adding buildings.
  const dimmed = !!(hoverNode || hoverTroop);

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

  const renderCost = (entries: CostEntry[], muted = false) => (
    <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
      {entries.map((c, i) => (
        <span
          key={i}
          title={c.name}
          className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
            muted ? "text-slate-400" : "text-slate-200"
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
            <span className="text-slate-400">{" " + c.name}</span>
          )}
        </span>
      ))}
    </span>
  );

  return (
    <div className="relative mt-2 mb-6 flex flex-col">
      <header className="order-1 mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Town Build{factionLabel ? ` · ${factionLabel}` : ""}
          </div>
          <p className="max-w-2xl text-xs text-muted-foreground/80">
            Pick a troop or click building levels to assemble a build order ·
            hover to trace what each needs &amp; unlocks
          </p>
        </div>
        {hasSelection && (
          <button
            onClick={clear}
            className="shrink-0 rounded border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-700/60 hover:text-amber-200"
          >
            Reset
          </button>
        )}
      </header>

      <div className="relative order-4 mt-8 border-t border-slate-800 pt-5">
        <div className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          Build Tree — click a building level to add it &amp; its prerequisites;
          hover to trace
        </div>
        <div ref={containerRef} className="relative">
          <svg
            className="pointer-events-none absolute inset-0"
            width={size.w}
            height={size.h}
            style={{ overflow: "visible" }}
          >
            {mounted &&
              edges.map((e, i) => {
                const d = path(e.from, e.to);
                if (!d) return null;
                const faded = dimmed && !e.active;
                // Default: faint slate so the whole tree is visible. Active (the
                // selected/hovered chain): bright — sky for an upgrade edge,
                // amber (the functional accent) for a prerequisite edge.
                const stroke = e.upgrade
                  ? e.active
                    ? "rgba(125,211,252,0.9)"
                    : "rgba(125,211,252,0.4)"
                  : e.active
                    ? "rgba(251,191,36,0.9)"
                    : "rgba(148,163,184,0.45)";
                return (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={e.active ? 2.5 : 1.5}
                    strokeDasharray={e.upgrade ? "5 4" : undefined}
                    style={{
                      opacity: faded ? 0.1 : 1,
                      ...(e.active
                        ? {
                            filter: `drop-shadow(0 0 5px ${e.upgrade ? "rgba(125,211,252,0.5)" : "rgba(251,191,36,0.6)"})`,
                          }
                        : {}),
                    }}
                  />
                );
              })}
          </svg>

          <div className="relative flex flex-col gap-10">
            {tiers.map((tier, ti) => (
              <div key={ti} className="relative">
                <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Tier {toRoman(ti + 1)}
                </div>
                <div className="flex flex-wrap gap-4">
                  {tier.map((n) => {
                    const isSelected = selected.has(n.key);
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
                        onClick={() => toggleNode(n.key)}
                        title={
                          isSelected
                            ? "Remove from build order"
                            : "Add to build order"
                        }
                        className={`group relative w-[176px] cursor-pointer rounded-md border p-3 transition-all duration-200 ${
                          isSelected
                            ? "border-amber-400/90 bg-amber-950/40"
                            : lit
                              ? "border-amber-600/60 bg-[#15171d]"
                              : "border-slate-700/60 bg-[#13151a]"
                        }`}
                        style={{
                          opacity: faded ? 0.32 : 1,
                          boxShadow: isSelected
                            ? "0 0 0 1px rgba(245,200,110,0.45), 0 8px 26px rgba(0,0,0,0.5)"
                            : "0 6px 18px rgba(0,0,0,0.4)",
                        }}
                      >
                        {isSelected && (
                          <span className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-amber-400/80 bg-amber-500 text-[11px] font-bold text-black">
                            ✓
                          </span>
                        )}
                        <Corner className="left-1 top-1" />
                        <Corner className="right-1 top-1 rotate-90" />
                        <Corner className="left-1 bottom-1 -rotate-90" />
                        <Corner className="right-1 bottom-1 rotate-180" />

                        <div className="flex items-center gap-2.5">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-slate-700/50 bg-black/40">
                            {icons?.[n.id] ? (
                              <SpriteIcon
                                icon={icons[n.id]}
                                appName={appName}
                                size={40}
                                iconsHash={iconsHash}
                              />
                            ) : (
                              <span className="text-slate-600 text-lg">⌂</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-[13px] font-bold tracking-wide text-slate-100">
                                {n.name}
                              </span>
                              <span
                                className={`shrink-0 rounded-sm border px-1 text-[9px] font-semibold leading-tight ${
                                  n.level > 1
                                    ? "border-sky-600/50 bg-sky-950/40 text-sky-300/90"
                                    : "border-slate-700/50 bg-black/40 text-slate-400"
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
                          <div className="mt-2.5 flex flex-wrap gap-1 border-t border-slate-800 pt-2">
                            {n.recruits.map((r) => (
                              <span
                                key={r.id}
                                className={`inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-[9.5px] tracking-wide transition-colors ${
                                  availableTroops.has(r.id)
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
      </div>

      {/* ── Available troops ── */}
      {troops.length > 0 && (
        <div className="relative order-2 mt-5 border-t border-slate-800 pt-5">
          <div className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">
            Available Troops — click to add what trains it to the build order,
            hover to trace
          </div>
          <div className="flex flex-wrap gap-2">
            {troops.map((tr) => {
              const on = availableTroops.has(tr.id);
              return (
                <button
                  key={tr.id}
                  onMouseEnter={() => setHoverTroop(tr.id)}
                  onMouseLeave={() => setHoverTroop(null)}
                  onClick={() => toggleTroop(tr.id)}
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
        <div className="relative order-3 mt-5 border-t border-slate-800 pt-5">
          <div className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">
            Build Order — {buildOrder.length} step
            {buildOrder.length > 1 ? "s" : ""}
          </div>
          <div className="overflow-hidden rounded-md border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black/30 text-[10px] uppercase tracking-wider text-muted-foreground">
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
                        {!s.isResearch && icons?.[s.id] && (
                          <SpriteIcon
                            icon={icons[s.id]}
                            appName={appName}
                            size={18}
                            iconsHash={iconsHash}
                          />
                        )}
                        {s.isResearch ? (
                          <span className="italic text-muted-foreground">
                            ↳ {s.name}
                          </span>
                        ) : (
                          <span className="text-slate-100">
                            {s.name}
                            {s.level > 1 && (
                              <span className="text-sky-300/80">
                                {" "}
                                · Lv {s.level}
                              </span>
                            )}
                          </span>
                        )}
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

/** Small L-shaped corner flourish on each building card. */
function Corner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute h-2 w-2 border-l border-t border-slate-700/40 ${className}`}
    />
  );
}
