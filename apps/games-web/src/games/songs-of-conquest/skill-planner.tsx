"use client";

import { useMemo, useState } from "react";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { resolveDict } from "@/lib/db/resolve-dict";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Compact per-pool skill as emitted by the transform (nodes derived here). */
type RawSkill = {
  id: string;
  level: number;
  maxTier: number;
  requiresAll: boolean;
  requires: { id: string; level: number }[];
};
export type SkillPool = { label: string; skills: RawSkill[] };

/**
 * One pool occurrence of a skill. Each occurrence advances the skill by one tier
 * — EXCEPT the last occurrence, which can be advanced up to the skill's intrinsic
 * max tier (`baseTier+1 … baseTier+span`). A skill in 2 pools but with 3 in-game
 * tiers (e.g. Eye for Amber) therefore still reaches tier 3 on its last node.
 */
type TierNode = {
  key: string; // `${id}#${occIndex}`
  id: string;
  occIndex: number;
  baseTier: number; // tiers granted by earlier occurrences (the floor)
  span: number; // tiers this node steps through (1, or the remainder on the last)
  maxTier: number; // skill intrinsic tier ceiling (for the dots)
  poolIndex: number;
  requiresAll: boolean;
  requires: { id: string; level: number }[]; // cross-skill prerequisites (by tier)
  prevKey: string | null; // previous occurrence (must be full before this unlocks)
};

/**
 * Songs of Conquest wielder skill pool — interactive draft planner.
 *
 * Skills are grouped by the wielder level pools (Lv 0-4, 5-9, …) in order. A
 * skill shown in several pools is a separate node in each (the 5-9 node needs the
 * 0-4 node), and each click advances that skill one tier; the LAST pool node can
 * be clicked up to the skill's intrinsic max tier. A node unlocks when its
 * previous occurrence is complete and its cross-skill prerequisites (RequireAll →
 * all of / any → one of, at the listed tier) are met. Deselecting cascades to
 * anything that depended on it. Hover to trace what a node needs and unlocks.
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

  // Build per-pool tier nodes from the compact data.
  const { poolsOut, byKey, nodesBySkill } = useMemo(() => {
    // Occurrences of each skill across pools, in pool order.
    const occ = new Map<
      string,
      {
        poolIndex: number;
        requiresAll: boolean;
        requires: { id: string; level: number }[];
        maxTier: number;
      }[]
    >();
    (pools ?? []).forEach((p, pi) => {
      for (const s of p.skills ?? [])
        (occ.get(s.id) ?? occ.set(s.id, []).get(s.id)!).push({
          poolIndex: pi,
          requiresAll: s.requiresAll,
          requires: s.requires ?? [],
          maxTier: s.maxTier ?? 1,
        });
    });

    const byKey = new Map<string, TierNode>();
    const nodesBySkill = new Map<string, TierNode[]>();
    for (const [id, occs] of occ) {
      const MT = Math.max(1, ...occs.map((o) => o.maxTier));
      const nEff = Math.min(occs.length, MT); // can't have more nodes than tiers
      for (let i = 0; i < nEff; i++) {
        const isLast = i === nEff - 1;
        const node: TierNode = {
          key: `${id}#${i}`,
          id,
          occIndex: i,
          baseTier: i,
          span: isLast ? MT - i : 1,
          maxTier: MT,
          poolIndex: occs[i].poolIndex,
          requiresAll: occs[i].requiresAll,
          requires: occs[i].requires,
          prevKey: i > 0 ? `${id}#${i - 1}` : null,
        };
        byKey.set(node.key, node);
        (nodesBySkill.get(id) ?? nodesBySkill.set(id, []).get(id)!).push(node);
      }
    }

    const poolsOut = (pools ?? []).map((p, pi) => ({
      label: p.label,
      nodes: [...byKey.values()].filter((n) => n.poolIndex === pi),
    }));
    return { poolsOut, byKey, nodesBySkill };
  }, [pools]);

  const [sel, setSel] = useState<Map<string, number>>(new Map());
  const [hover, setHover] = useState<string | null>(null);

  // Current drafted tier of a skill = the highest cumulative tier across its nodes.
  const skillTier = (id: string, s: Map<string, number>) => {
    let t = 0;
    for (const n of nodesBySkill.get(id) ?? []) {
      const taken = s.get(n.key) ?? 0;
      if (taken > 0) t = Math.max(t, n.baseTier + taken);
    }
    return t;
  };

  const reqMet = (n: TierNode, s: Map<string, number>) =>
    n.requires.length === 0 ||
    (n.requiresAll
      ? n.requires.every((r) => skillTier(r.id, s) >= r.level)
      : n.requires.some((r) => skillTier(r.id, s) >= r.level));

  // A node is unlocked when its previous occurrence is complete and its
  // cross-skill prerequisites are met.
  const unlocked = (n: TierNode, s: Map<string, number>) => {
    if (n.prevKey) {
      const prev = byKey.get(n.prevKey);
      if (prev && (s.get(prev.key) ?? 0) < prev.span) return false;
    }
    return reqMet(n, s);
  };

  const click = (key: string) =>
    setSel((cur) => {
      const node = byKey.get(key);
      if (!node) return cur;
      const next = new Map(cur);
      const taken = next.get(key) ?? 0;
      if (taken === 0) {
        if (!unlocked(node, next)) return cur; // locked
        next.set(key, 1);
      } else if (taken < node.span) {
        next.set(key, taken + 1); // advance one tier
      } else {
        next.set(key, 0); // full → deselect
      }
      // Cascade: drop anything that lost its prerequisites.
      let changed = true;
      while (changed) {
        changed = false;
        for (const n of byKey.values())
          if ((next.get(n.key) ?? 0) > 0 && !unlocked(n, next)) {
            next.set(n.key, 0);
            changed = true;
          }
      }
      return next;
    });

  const hoverNode = hover ? byKey.get(hover) : null;
  // Prereqs of the hovered node: its previous occurrence + every node of each
  // required skill. Unlocks: its next occurrence + every node that requires it.
  const { hoverPrereqs, hoverUnlocks } = useMemo(() => {
    if (!hoverNode) return { hoverPrereqs: null, hoverUnlocks: null };
    const pre = new Set<string>();
    if (hoverNode.prevKey) pre.add(hoverNode.prevKey);
    for (const r of hoverNode.requires)
      for (const n of nodesBySkill.get(r.id) ?? []) pre.add(n.key);
    const un = new Set<string>();
    const nextKey = `${hoverNode.id}#${hoverNode.occIndex + 1}`;
    if (byKey.has(nextKey)) un.add(nextKey);
    for (const n of byKey.values())
      if (n.requires.some((r) => r.id === hoverNode.id)) un.add(n.key);
    return { hoverPrereqs: pre, hoverUnlocks: un };
  }, [hoverNode, byKey, nodesBySkill]);

  const card = (n: TierNode) => {
    const taken = sel.get(n.key) ?? 0;
    const isSel = taken > 0;
    const ok = unlocked(n, sel);
    const locked = !isSel && !ok;
    const asPrereq = hoverPrereqs?.has(n.key);
    const asUnlock = hoverUnlocks?.has(n.key);
    const ic = icons?.[n.id];
    const curTier = n.baseTier + taken; // tier reached when selected
    const tierLabel =
      n.span > 1
        ? `Tiers ${n.baseTier + 1}-${n.baseTier + n.span}`
        : `Tier ${n.baseTier + 1}`;

    const ring = asPrereq
      ? "ring-2 ring-amber-400/80"
      : asUnlock
        ? "ring-2 ring-sky-400/60"
        : isSel
          ? "ring-1 ring-amber-500/40"
          : "";
    const tone = isSel
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
          if (!locked || isSel) click(n.key);
        }}
        onMouseEnter={() => setHover(n.key)}
        onMouseLeave={() => setHover(null)}
        title={
          n.span > 1
            ? `${name(n.id)} — click to advance tier (up to ${n.maxTier})`
            : undefined
        }
        className={`relative flex w-[184px] flex-col rounded-md border px-3 py-2.5 text-left transition-all ${tone} ${ring} ${
          locked ? "cursor-help" : "cursor-pointer"
        }`}
      >
        {isSel && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-black shadow">
            {n.span > 1 ? curTier : "✓"}
          </span>
        )}
        <span className="flex items-center gap-2.5">
          {ic ? (
            <span
              className={`shrink-0 rounded border p-1 ${
                isSel
                  ? "border-amber-600/50 bg-black/30"
                  : "border-slate-700/70 bg-black/40"
              }`}
            >
              <SpriteIcon
                icon={ic}
                appName={appName}
                size={44}
                iconsHash={iconsHash}
              />
            </span>
          ) : null}
          <span className="min-w-0 flex-1">
            <span
              className={`line-clamp-2 text-[13px] font-semibold leading-tight ${
                isSel ? "text-amber-100" : "text-slate-100"
              }`}
            >
              {name(n.id)}
            </span>
            {n.maxTier > 1 && (
              <span
                className="mt-1 flex items-center gap-1"
                title={`${tierLabel} of ${n.maxTier}`}
              >
                {Array.from({ length: n.maxTier }, (_, i) => {
                  const t = i + 1;
                  const filled = t <= curTier; // taken
                  const reachable = t <= n.baseTier + n.span; // this node grants it
                  return (
                    <span
                      key={i}
                      className={`h-2 w-2 rounded-full ${
                        filled
                          ? "bg-amber-400"
                          : reachable && t > n.baseTier
                            ? "bg-amber-500/30 ring-1 ring-amber-500/40"
                            : "bg-slate-700"
                      }`}
                    />
                  );
                })}
              </span>
            )}
          </span>
        </span>

        {n.requires.length > 0 && (
          <span className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-800/70 pt-2">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
              {n.requiresAll ? "all" : n.requires.length > 1 ? "any" : "needs"}
            </span>
            {n.requires.map((r) => {
              const ric = icons?.[r.id];
              const have = skillTier(r.id, sel) >= r.level;
              return (
                <span
                  key={`${r.id}:${r.level}`}
                  title={`${name(r.id)}${r.level > 1 ? ` (Tier ${r.level})` : ""}`}
                  className={`relative inline-flex ${have ? "" : "opacity-45 grayscale"}`}
                >
                  {ric ? (
                    <SpriteIcon
                      icon={ric}
                      appName={appName}
                      size={30}
                      iconsHash={iconsHash}
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      {name(r.id)}
                    </span>
                  )}
                  {r.level > 1 && (
                    <span className="absolute -bottom-1 -right-1 rounded bg-slate-800 px-0.5 text-[8px] font-bold leading-none text-amber-300">
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

  // Each tier-pick is one wielder level-up, so the wielder's level ≈ the number
  // of tiers drafted. The LevelInterval pool (label "Lv 8, 16, 24…") holds the
  // "power" picks taken at those levels — track how many have been drafted.
  const totalPicks = [...sel.values()].reduce((a, b) => a + b, 0);
  const level = totalPicks;
  const intervalPools = new Set(
    poolsOut.flatMap((p, i) => (/…|\.\.\./.test(p.label) ? [i] : [])),
  );
  const intervalLabel = poolsOut.find((_, i) => intervalPools.has(i))?.label;
  let powerPicks = 0;
  for (const [k, v] of sel) {
    const n = byKey.get(k);
    if (n && intervalPools.has(n.poolIndex)) powerPicks += v;
  }
  // Interval pool levels (e.g. 8, 16, 24, …) parsed from its label. By the
  // current level you "owe" one power pick per interval level reached — surface
  // when one is due so the draft order respects the forced level-8/16/24 picks.
  const intervalNums = (intervalLabel?.match(/\d+/g) ?? []).map(Number);
  const intervalStart = intervalNums[0];
  const intervalStep =
    intervalNums.length > 1 ? intervalNums[1] - intervalNums[0] : intervalStart;
  const powerDue =
    intervalStart && level >= intervalStart
      ? Math.floor((level - intervalStart) / intervalStep) + 1
      : 0;
  const nextPowerLevel = intervalStart
    ? intervalStart + powerPicks * intervalStep
    : 0;
  const powerOverdue = powerPicks < powerDue;

  return (
    <div className="mt-2 mb-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Skill Tree
          </div>
          <p className="max-w-2xl text-xs text-muted-foreground/80">
            Skills draftable at each wielder level. Each pick advances a skill
            one tier (dots show progress to its max); the last pool node steps
            up to the skill&apos;s top tier. A node needs the one before it plus
            any prerequisites. Hover to trace what it needs and unlocks.
          </p>
        </div>
        {totalPicks > 0 && (
          <button
            onClick={() => setSel(new Map())}
            className="shrink-0 rounded border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-700/60 hover:text-amber-200"
          >
            Reset ({totalPicks})
          </button>
        )}
      </div>

      {/* Floating wielder-level readout — sticks beside the tree while you draft
          so you can track the level sequence as you plan the ordering. */}
      <div className="pointer-events-none sticky top-2 z-20 mb-1 flex justify-end">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-600/50 bg-zinc-900/95 px-3 py-1 text-xs shadow-lg backdrop-blur">
          <span className="font-semibold text-amber-100">
            Wielder level: {level}
          </span>
          {intervalLabel && (
            <span
              className={`border-l border-slate-700 pl-2 ${
                powerOverdue ? "font-semibold text-rose-300" : "text-slate-300"
              }`}
              title={`Power picks come from the "${intervalLabel}" pool, taken at those levels`}
            >
              {powerOverdue
                ? `Power pick due (Lv ${nextPowerLevel})`
                : `Power picks: ${powerPicks}`}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {poolsOut.map((pool, pi) =>
          pool.nodes.length === 0 ? null : (
            <div key={pi}>
              <div className="mb-2 flex items-center gap-2">
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {pool.label}
                </span>
                <span className="h-px flex-1 bg-slate-800" />
              </div>
              <div className="flex flex-wrap gap-2.5">
                {pool.nodes.map(card)}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
