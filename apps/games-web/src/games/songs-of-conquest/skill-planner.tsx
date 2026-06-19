"use client";

import { useMemo, useState } from "react";
import { Cinzel } from "next/font/google";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { resolveDict } from "@/lib/db/resolve-dict";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["500", "700"] });

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type SkillReq = { key: string; id: string; level: number };

/** Compact per-pool skill as emitted by the transform (keys derived here). */
type RawSkill = {
  id: string;
  level: number;
  requiresAll: boolean;
  requires: { id: string; level: number }[];
};
export type SkillPool = { label: string; skills: RawSkill[] };

/** One skill at one level — Cunning lvl 1 (pool 0-4), lvl 2 (5-9), … */
type SkillLevelNode = {
  key: string; // `${skillId}#${level}`
  id: string; // skill id (icon + name)
  level: number; // 1-based level (= which pool occurrence)
  total: number; // how many levels this skill has across the pools
  prevLevel: string | null; // node key of the preceding level (hard requirement)
  requiresAll: boolean;
  requires: SkillReq[]; // cross-skill prerequisites (resolved to level nodes)
};

/**
 * Songs of Conquest wielder skill pool — interactive draft planner.
 *
 * Skills are grouped by the wielder level pools (Lv 0-4, 5-9, …) in order, and
 * each pool occurrence is its own LEVEL: Cunning at 0-4 is level 1, at 5-9 is
 * level 2, and level 2 requires level 1 — so a build is assembled in sequence,
 * not all at once. Click an unlocked level to add it; levels whose requirements
 * (the previous level + any cross-skill prerequisites, RequireAll → all of /
 * any → one of) are met light up. Deselecting a level cascades to anything that
 * depended on it. Hover to trace what a level needs and unlocks.
 */
export function SkillPoolPlanner({
  pools,
  icons,
  appName,
  iconsHash,
  dict,
}: {
  pools: SkillPool[];
  icons?: Record<string, IconSprite>;
  appName: string;
  iconsHash?: string;
  dict?: Record<string, string>;
}) {
  const name = (id: string) => (dict && resolveDict(dict, id)) || id;

  // Derive node keys, level chain (Cunning#2 ← #1) and the level total from the
  // compact per-pool data.
  const { enrichedPools, byKey } = useMemo(() => {
    const key = (id: string, level: number) => `${id}#${level}`;
    const total = new Map<string, number>();
    for (const p of pools ?? [])
      for (const s of p.skills ?? [])
        total.set(s.id, Math.max(total.get(s.id) ?? 0, s.level));
    const enrichedPools = (pools ?? []).map((p) => ({
      label: p.label,
      nodes: (p.skills ?? []).map(
        (s): SkillLevelNode => ({
          key: key(s.id, s.level),
          id: s.id,
          level: s.level,
          total: total.get(s.id) ?? 1,
          prevLevel: s.level > 1 ? key(s.id, s.level - 1) : null,
          requiresAll: s.requiresAll,
          requires: (s.requires ?? []).map((r) => ({
            key: key(r.id, r.level),
            id: r.id,
            level: r.level,
          })),
        }),
      ),
    }));
    const m = new Map<string, SkillLevelNode>();
    for (const p of enrichedPools) for (const n of p.nodes) m.set(n.key, n);
    return { enrichedPools, byKey: m };
  }, [pools]);

  // Reverse adjacency: node → nodes that depend on it (its next level + anything
  // listing it as a cross-skill prerequisite).
  const unlocks = useMemo(() => {
    const m = new Map<string, Set<string>>();
    const add = (dep: string, k: string) => {
      if (!m.has(dep)) m.set(dep, new Set());
      m.get(dep)!.add(k);
    };
    for (const n of byKey.values()) {
      if (n.prevLevel && byKey.has(n.prevLevel)) add(n.prevLevel, n.key);
      for (const r of n.requires) if (byKey.has(r.key)) add(r.key, n.key);
    }
    return m;
  }, [byKey]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<string | null>(null);

  const met = (n: SkillLevelNode, sel: Set<string>) =>
    (!n.prevLevel || !byKey.has(n.prevLevel) || sel.has(n.prevLevel)) &&
    (n.requires.length === 0 ||
      (n.requiresAll
        ? n.requires.every((r) => sel.has(r.key))
        : n.requires.some((r) => sel.has(r.key))));

  const click = (key: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (!next.has(key)) {
        next.add(key);
        return next;
      }
      next.delete(key);
      let changed = true;
      while (changed) {
        changed = false;
        for (const n of byKey.values())
          if (next.has(n.key) && !met(n, next)) {
            next.delete(n.key);
            changed = true;
          }
      }
      return next;
    });

  const hoverNode = hover ? byKey.get(hover) : null;
  const hoverPrereqs = hoverNode
    ? new Set(
        [
          ...(hoverNode.prevLevel ? [hoverNode.prevLevel] : []),
          ...hoverNode.requires.map((r) => r.key),
        ].filter((k) => byKey.has(k)),
      )
    : null;
  const hoverUnlocks = hover ? (unlocks.get(hover) ?? null) : null;

  const card = (n: SkillLevelNode) => {
    const sel = selected.has(n.key);
    const ok = met(n, selected);
    const locked = !sel && !ok;
    const asPrereq = hoverPrereqs?.has(n.key);
    const asUnlock = hoverUnlocks?.has(n.key);
    const ic = icons?.[n.id];

    const ring = asPrereq
      ? "ring-2 ring-amber-400/80"
      : asUnlock
        ? "ring-2 ring-sky-400/60"
        : sel
          ? "ring-1 ring-amber-500/40"
          : "";
    const tone = sel
      ? "border-amber-500/80 bg-amber-950/40"
      : locked
        ? "border-slate-800 bg-slate-950/40 opacity-55"
        : "border-slate-700 bg-slate-900/50 hover:border-amber-600/70 hover:bg-slate-900";

    return (
      <button
        key={n.key}
        type="button"
        aria-disabled={locked}
        onClick={() => {
          if (!locked) click(n.key);
        }}
        onMouseEnter={() => setHover(n.key)}
        onMouseLeave={() => setHover(null)}
        className={`relative flex w-[150px] flex-col rounded-md border px-2.5 py-2 text-left transition-all ${tone} ${ring} ${
          locked ? "cursor-help" : "cursor-pointer"
        }`}
      >
        {sel && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black shadow">
            ✓
          </span>
        )}
        <span className="flex items-center gap-2">
          {ic ? (
            <span
              className={`shrink-0 rounded border p-0.5 ${
                sel
                  ? "border-amber-600/50 bg-black/30"
                  : "border-slate-700/70 bg-black/40"
              }`}
            >
              <SpriteIcon
                icon={ic}
                appName={appName}
                size={26}
                iconsHash={iconsHash}
              />
            </span>
          ) : null}
          <span className="min-w-0 flex-1">
            <span
              className={`line-clamp-2 text-[13px] font-semibold leading-tight ${
                sel ? "text-amber-100" : "text-slate-100"
              }`}
            >
              {name(n.id)}
            </span>
            {n.total > 1 && (
              <span
                className="mt-0.5 flex items-center gap-0.5"
                title={`Level ${n.level} of ${n.total}`}
              >
                {Array.from({ length: n.total }, (_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${
                      i < n.level
                        ? sel
                          ? "bg-amber-400"
                          : "bg-amber-500/70"
                        : "bg-slate-700"
                    }`}
                  />
                ))}
              </span>
            )}
          </span>
        </span>

        {n.requires.length > 0 && (
          <span className="mt-1.5 flex items-center gap-1 border-t border-slate-800/70 pt-1.5">
            <span className="text-[8.5px] font-semibold uppercase tracking-wider text-slate-500">
              {n.requiresAll ? "all" : n.requires.length > 1 ? "any" : "needs"}
            </span>
            {n.requires.map((r) => {
              const ric = icons?.[r.id];
              const have = selected.has(r.key);
              return (
                <span
                  key={r.key}
                  title={`${name(r.id)}${r.level > 1 ? ` (Lv ${r.level})` : ""}`}
                  className={`relative inline-flex ${have ? "" : "opacity-45 grayscale"}`}
                >
                  {ric ? (
                    <SpriteIcon
                      icon={ric}
                      appName={appName}
                      size={15}
                      iconsHash={iconsHash}
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      {name(r.id)}
                    </span>
                  )}
                  {r.level > 1 && (
                    <span className="absolute -bottom-1 -right-1 rounded bg-slate-800 px-0.5 text-[7px] font-bold leading-none text-amber-300">
                      {r.level}
                    </span>
                  )}
                </span>
              );
            })}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="mt-2 mb-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3
            className={`${cinzel.className} text-lg font-bold text-amber-100`}
          >
            Skill Tree
          </h3>
          <p className="text-xs text-muted-foreground">
            Skills draftable at each wielder level — each pick is one level
            (dots show progress). Click to plan a build; a level needs the one
            before it plus any prerequisites. Hover to trace what it needs and
            unlocks.
          </p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={() => setSelected(new Set())}
            className="shrink-0 rounded border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-700/60 hover:text-amber-200"
          >
            Reset ({selected.size})
          </button>
        )}
      </div>

      <div className="space-y-4">
        {enrichedPools.map((pool, pi) => (
          <div key={pi}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`${cinzel.className} shrink-0 text-sm font-bold uppercase tracking-wide text-amber-200/90`}
              >
                {pool.label}
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-amber-800/40 to-transparent" />
            </div>
            <div className="flex flex-wrap gap-2">{pool.nodes.map(card)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
