"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SpriteIcon } from "@/lib/db/sprite-icon";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
type CostEntry = { amount: number; name: string; iconId?: string };
type Recruit = {
  id: string;
  name: string;
  research?: number[];
  order?: number; // canonical roster order (for sorting pills)
  tier?: number; // unit variant level (1 vanilla / 2 upgraded / 3 super)
};
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
  recruits: {
    id: string;
    name: string;
    research: number[];
    order: number;
    tier: number;
  }[];
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
            order: r.order ?? 999,
            tier: r.tier ?? 1,
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

  // Layout like the in-game / legacy soc.th.gl build tree: each building's
  // levels stack vertically into one COLUMN (Farm Lv 1 above Lv 2 above Lv 3);
  // columns are grouped into connected dependency COMPONENTS, ordered left→right
  // to minimise edge crossings; a node's ROW = its longest prerequisite-chain
  // depth. Components are packed into bands (wrapping past the column budget) so
  // independent chains sit side by side instead of one very wide row.
  const bands = useMemo(() => {
    // Row = longest require-chain depth (cycle-safe).
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

    // One stack (column) per building, levels ascending.
    const byBuilding = new Map<string, Node[]>();
    for (const n of nodes)
      (byBuilding.get(n.id) ?? byBuilding.set(n.id, []).get(n.id)!).push(n);
    for (const arr of byBuilding.values())
      arr.sort((a, b) => a.level - b.level);
    type Stack = { id: string; nodes: Node[] };
    const stacks: Stack[] = [...byBuilding.entries()].map(([id, ns]) => ({
      id,
      nodes: ns,
    }));
    const stackIdx = new Map(stacks.map((s, i) => [s.id, i]));

    // Connected components: union stacks linked by a cross-building requirement.
    const par = stacks.map((_, i) => i);
    const find = (x: number): number =>
      par[x] === x ? x : (par[x] = find(par[x]));
    for (const n of nodes)
      for (const r of n.requires) {
        const rb = byKey.get(r);
        if (!rb || rb.id === n.id) continue;
        par[find(stackIdx.get(n.id)!)] = find(stackIdx.get(rb.id)!);
      }
    const compMap = new Map<number, Stack[]>();
    stacks.forEach((s, i) => {
      const root = find(i);
      (compMap.get(root) ?? compMap.set(root, []).get(root)!).push(s);
    });

    // childBuildings: building id → set of OTHER buildings that depend on it.
    const childBuildings = new Map<string, Set<string>>();
    for (const s of stacks) childBuildings.set(s.id, new Set());
    for (const n of nodes)
      for (const r of n.requires) {
        const rb = byKey.get(r);
        if (rb && rb.id !== n.id) childBuildings.get(rb.id)!.add(n.id);
      }

    // Order a component's stacks: parents first, then permute to minimise the
    // total horizontal edge span (legacy minimizeCrossings; capped for cost).
    const cost = (order: Stack[]): number => {
      const pos = new Map(order.map((s, i) => [s.id, i]));
      let span = 0;
      const neigh = new Map<string, number[]>(order.map((s) => [s.id, []]));
      for (const s of order)
        for (const cid of childBuildings.get(s.id) ?? []) {
          const a = pos.get(s.id)!;
          const b = pos.get(cid);
          if (b !== undefined && b !== a) {
            span += Math.abs(b - a);
            neigh.get(s.id)!.push(b);
            neigh.get(cid)!.push(a);
          }
        }
      let bary = 0;
      for (const s of order) {
        const ps = neigh.get(s.id)!;
        if (!ps.length) continue;
        const avg = ps.reduce((x, y) => x + y, 0) / ps.length;
        bary += Math.abs(pos.get(s.id)! - avg);
      }
      return span + bary;
    };
    const orderStacks = (local: Stack[]): Stack[] => {
      const sorted = [...local].sort((a, b) => {
        const aToB = childBuildings.get(a.id)?.has(b.id);
        const bToA = childBuildings.get(b.id)?.has(a.id);
        if (aToB) return -1;
        if (bToA) return 1;
        return 0;
      });
      if (sorted.length < 3 || sorted.length > 7) return sorted;
      let best = sorted;
      let bestCost = cost(sorted);
      const permute = (a: Stack[], start: number) => {
        if (start === a.length) {
          const c = cost(a);
          if (c < bestCost - 1e-3) {
            bestCost = c;
            best = [...a];
          }
          return;
        }
        for (let i = start; i < a.length; i++) {
          [a[start], a[i]] = [a[i], a[start]];
          permute(a, start + 1);
          [a[start], a[i]] = [a[i], a[start]];
        }
      };
      permute([...sorted], 0);
      return best;
    };

    const comps = [...compMap.values()]
      .map(orderStacks)
      .sort(
        (a, b) =>
          b.reduce((s, st) => s + st.nodes.length, 0) -
          a.reduce((s, st) => s + st.nodes.length, 0),
      );

    // Pack components (biggest first) into bands of ~10 columns — the legacy
    // soc.th.gl desktop budget. Independent chains sit side by side and the band
    // scrolls horizontally; overflow buildings (Rally Point, Academy, …) wrap to
    // a new band instead of stretching one endless row.
    const budget = Math.max(10, ...comps.map((c) => c.length));
    type Cell = { node: Node; col: number; row: number };
    const out: { cols: number; cells: Cell[] }[] = [];
    let cur: { cols: number; cells: Cell[] } = { cols: 0, cells: [] };
    let bandX = 0;
    for (const comp of comps) {
      if (bandX > 0 && bandX + comp.length > budget) {
        out.push(cur);
        cur = { cols: 0, cells: [] };
        bandX = 0;
      }
      comp.forEach((st, ci) => {
        for (const n of st.nodes)
          cur.cells.push({ node: n, col: bandX + ci, row: depth.get(n.key)! });
      });
      bandX += comp.length;
      cur.cols = Math.max(cur.cols, bandX);
    }
    if (cur.cells.length) out.push(cur);
    return out;
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
      {
        id: string;
        name: string;
        research: number[];
        order: number;
        tier: number;
        from: string[];
      }
    >();
    for (const n of nodes)
      for (const u of n.recruits) {
        const e = m.get(u.id) ?? {
          id: u.id,
          name: u.name,
          research: u.research,
          order: u.order,
          tier: u.tier,
          from: [],
        };
        e.from.push(n.key);
        m.set(u.id, e);
      }
    // Canonical roster order, then variant tier (Lv 1 → 2 → 3 within a family).
    return [...m.values()].sort(
      (a, b) =>
        a.order - b.order || a.tier - b.tier || a.name.localeCompare(b.name),
    );
  }, [nodes]);

  // Group troops into unit families (same `order` = base + its upgrades), so the
  // Available Troops list can stack each family's ranks vertically (Lv 1 on top)
  // like the in-game roster, families left→right in canonical order.
  const troopFamilies = useMemo(() => {
    const fams: (typeof troops)[] = [];
    for (const tr of troops) {
      const last = fams[fams.length - 1];
      if (last && last[0].order === tr.order) last.push(tr);
      else fams.push([tr]);
    }
    return fams;
  }, [troops]);

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
  // Card hover tooltip (cost + recruits), portalled so the scroll container
  // can't clip it. `rect` = the hovered card's viewport box at hover time.
  const [tip, setTip] = useState<{ key: string; rect: DOMRect } | null>(null);
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
      setTip(null); // touch/"desktop mode on mobile": no mouseleave fires on tap
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
    setSize({ w: Math.max(base.width, c.scrollWidth), h: c.scrollHeight });
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
  }, [measure, bands]);

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
        {/* pt-2 keeps the top row's selected (✓) badge from being clipped by
            the scroll container's vertical overflow. */}
        <div className="overflow-x-auto pt-2 pb-1 sidebar-scroll">
          <div ref={containerRef} className="relative inline-block min-w-full">
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
                  // Default: faint slate so the whole tree is visible. Active
                  // (the selected/hovered chain): bright — sky for an upgrade
                  // edge, amber (the functional accent) for a prerequisite edge.
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

            <div className="relative flex flex-col gap-y-12">
              {bands.map((band, bi) => (
                <div
                  key={bi}
                  className="grid items-start gap-x-5 gap-y-14"
                  style={{
                    gridTemplateColumns: `repeat(${band.cols}, 104px)`,
                  }}
                >
                  {band.cells.map(({ node: n, col, row }) => {
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
                        onMouseEnter={(e) => {
                          setHoverNode(n.key);
                          setTip({
                            key: n.key,
                            rect: e.currentTarget.getBoundingClientRect(),
                          });
                        }}
                        onMouseLeave={() => {
                          setHoverNode(null);
                          setTip(null);
                        }}
                        onClick={() => toggleNode(n.key)}
                        title={
                          isSelected
                            ? "Remove from build order"
                            : "Add to build order"
                        }
                        className={`group relative flex w-[104px] cursor-pointer flex-col items-center gap-1.5 self-start rounded-md border p-2 text-center transition-all duration-200 ${
                          isSelected
                            ? "border-amber-400/90 bg-amber-950/40"
                            : lit
                              ? "border-amber-600/60 bg-[#15171d]"
                              : "border-slate-700/60 bg-[#13151a]"
                        }`}
                        style={{
                          gridColumnStart: col + 1,
                          gridRowStart: row + 1,
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
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-slate-700/50 bg-black/40">
                          {icons?.[n.id] ? (
                            <SpriteIcon
                              icon={icons[n.id]}
                              appName={appName}
                              size={36}
                              iconsHash={iconsHash}
                            />
                          ) : (
                            <span className="text-slate-600 text-lg">⌂</span>
                          )}
                        </div>
                        <div className="w-full">
                          <div className="line-clamp-2 text-[11px] font-bold leading-tight tracking-wide text-slate-100">
                            {n.name}
                          </div>
                          <span
                            className={`mt-1 inline-block rounded-sm border px-1 text-[9px] font-semibold leading-tight ${
                              n.level > 1
                                ? "border-sky-600/50 bg-sky-950/40 text-sky-300/90"
                                : "border-slate-700/50 bg-black/40 text-slate-400"
                            }`}
                          >
                            Lv {n.level}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Available troops ── */}
      {troops.length > 0 && (
        <div className="relative order-2 mt-5 border-t border-slate-800 pt-5">
          <div className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">
            Available Troops — each unit&apos;s ranks stacked; click to add what
            trains it to the build order, hover to trace
          </div>
          <div className="flex flex-wrap items-start gap-x-3 gap-y-3">
            {troopFamilies.map((fam) => (
              <div key={fam[0].order} className="flex w-[136px] flex-col gap-1">
                {fam.map((tr) => {
                  const on = availableTroops.has(tr.id);
                  return (
                    <button
                      key={tr.id}
                      onMouseEnter={() => setHoverTroop(tr.id)}
                      onMouseLeave={() => setHoverTroop(null)}
                      onClick={() => toggleTroop(tr.id)}
                      className={`flex items-center gap-1.5 rounded border px-2 py-1 text-left text-[11px] tracking-wide transition-all ${
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
                      <span className="min-w-0 flex-1 truncate">{tr.name}</span>
                      <span
                        className={`shrink-0 rounded-sm px-1 text-[8px] font-bold leading-tight ${
                          on
                            ? "bg-amber-400/30 text-amber-100"
                            : "bg-black/40 text-slate-400"
                        }`}
                        title={`Level ${tr.tier} unit`}
                      >
                        {["I", "II", "III"][tr.tier - 1] ?? tr.tier}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
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

      {/* Card hover tooltip — cost + recruits, portalled past the scroll clip. */}
      {mounted &&
        tip &&
        (() => {
          const n = byKey.get(tip.key);
          if (!n || (n.cost.length === 0 && n.recruits.length === 0))
            return null;
          const r = tip.rect;
          const TW = 240;
          let x = r.left;
          if (x + TW > window.innerWidth - 8) x = window.innerWidth - TW - 8;
          if (x < 8) x = 8;
          const below = r.top < 240;
          return createPortal(
            <div
              className="pointer-events-none fixed w-60 rounded-lg border border-slate-700 bg-zinc-900 p-3 shadow-2xl"
              style={{
                left: x,
                top: below ? r.bottom + 6 : r.top - 6,
                transform: below ? undefined : "translateY(-100%)",
                zIndex: 99999,
              }}
            >
              <div className="mb-2 flex items-baseline gap-1.5">
                <span className="text-[13px] font-bold text-slate-100">
                  {n.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Lv {n.level}
                </span>
              </div>
              {n.cost.length > 0 && (
                <div className={n.recruits.length > 0 ? "mb-2" : ""}>
                  <div className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Cost
                  </div>
                  {renderCost(n.cost)}
                </div>
              )}
              {n.recruits.length > 0 && (
                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Recruits
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[...n.recruits]
                      .sort((a, b) => a.order - b.order || a.tier - b.tier)
                      .map((rc) => (
                        <span
                          key={rc.id}
                          className={`inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-[10px] tracking-wide ${
                            availableTroops.has(rc.id)
                              ? "bg-amber-400/25 text-amber-100"
                              : "bg-black/40 text-slate-300/90"
                          }`}
                        >
                          {icons?.[rc.id] && (
                            <SpriteIcon
                              icon={icons[rc.id]}
                              appName={appName}
                              size={14}
                              iconsHash={iconsHash}
                            />
                          )}
                          {rc.name}
                          <span className="text-[8px] font-bold text-slate-400">
                            {["I", "II", "III"][rc.tier - 1] ?? rc.tier}
                          </span>
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>,
            document.body,
          );
        })()}
    </div>
  );
}
