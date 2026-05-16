import { resolveDict } from "@/components/resolve-dict";
import { SpriteIcon } from "@/components/sprite-icon";
import {
  ResourceCostList,
  buildResourceIconLookup,
} from "@/components/resource-cost";

type SpellProps = {
  school: string;
  rank: number;
  spellType: string;
  usedOnMap: boolean;
  manaCost: number[];
  learnCost?: { name: string; cost: number }[];
  upgradeCost?: number[];
  descriptionLevels?: string[];
  bonusDescriptions?: { level: number; description: string }[];
  /** Per-mastery [duration, ...statValues] for substituting `{0}`, `{1}`, … in
   *  the description text. Comes from `battleMagic.magicDealers[i].buff`. */
  levelParams?: number[][];
  /** Spellpower scaling rule for the duration: `+increment` rounds per
   *  `threshold` Spellpower. From `magicDealers[i].buff.durationPerStack`. */
  spellPowerScaling?: { threshold: number; increment: number };
};

/** Substitute `{N}` placeholders with values from a params array. Missing
 *  values render as `?` to signal "data not extracted" rather than blanks. */
function fillPlaceholders(text: string, params?: number[]): string {
  if (!params || params.length === 0) return text.replace(/\{(\d+)\}/g, "?");
  return text.replace(/\{(\d+)\}/g, (_, idx) => {
    const i = parseInt(idx, 10);
    const v = params[i];
    return v != null ? String(v) : "?";
  });
}

/**
 * Substitute placeholders in a bonus description (the lines under "Upgrade"
 * that describe what a single mastery upgrade adds).
 *
 * Two patterns appear in the data:
 *   - "X: {0} > {1}" — a value transitions from old to new (typical for
 *     duration upgrades). We fill `{0}` and `{1}` from the first index where
 *     the previous and current mastery's params differ.
 *   - "X deals –{0}% Y" — a brand-new value is introduced at this level. We
 *     fill placeholders from the list of values in `curr` that weren't in
 *     `prev` (in order of their first appearance).
 */
function fillBonusPlaceholders(
  text: string,
  prev: number[] | undefined,
  curr: number[] | undefined,
): string {
  const prevP = prev ?? [];
  const currP = curr ?? [];
  if (/\{0\}\s*>\s*\{1\}/.test(text)) {
    for (let i = 0; i < Math.max(prevP.length, currP.length); i++) {
      if (prevP[i] !== currP[i]) {
        return text
          .replace("{0}", String(prevP[i] ?? "?"))
          .replace("{1}", String(currP[i] ?? "?"));
      }
    }
  }
  const newValues: number[] = [];
  for (let i = 0; i < currP.length; i++) {
    if (prevP[i] !== currP[i]) newValues.push(currP[i]);
  }
  return text.replace(/\{(\d+)\}/g, (_, idx) => {
    const v = newValues[parseInt(idx, 10)];
    return v != null ? String(v) : "?";
  });
}

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const SCHOOL_COLORS: Record<string, string> = {
  day: "text-yellow-400 border-yellow-800/50 bg-yellow-900/20",
  night: "text-purple-400 border-purple-800/50 bg-purple-900/20",
  primal: "text-green-400 border-green-800/50 bg-green-900/20",
  space: "text-cyan-400 border-cyan-800/50 bg-cyan-900/20",
  neutral: "text-slate-300 border-slate-600 bg-slate-800/30",
};

const MASTERY_LABELS = ["None", "Basic", "Advanced", "Expert"];

export function SpellView({
  name,
  desc,
  icon,
  props,
  dict,
  database,
  iconsHash,
}: {
  name: string;
  desc: string;
  icon?: IconSprite;
  props: SpellProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
  iconsHash?: string;
}) {
  const schoolStyle = SCHOOL_COLORS[props.school] ?? SCHOOL_COLORS.neutral;
  const resourceIcons = buildResourceIconLookup(database);

  // Per-mastery descriptions (0=None, 1=Basic, 2=Advanced, 3=Expert).
  // Each level's `{N}` placeholders are filled from `levelParams[mastery]`,
  // which carries [duration, ...statValues] extracted from the spell's buff.
  // Some spells share the same text across multiple levels — collapse duplicates.
  const masteryLevels: { mastery: number; text: string }[] = [];
  if (props.descriptionLevels && props.descriptionLevels.length > 0) {
    let prevText: string | null = null;
    for (let i = 0; i < props.descriptionLevels.length; i++) {
      const raw = resolveDict(dict, props.descriptionLevels[i]);
      if (raw === props.descriptionLevels[i]) continue; // sid didn't resolve
      const text = fillPlaceholders(raw, props.levelParams?.[i]);
      if (text === prevText) continue;
      masteryLevels.push({ mastery: i, text });
      prevText = text;
    }
  }

  // Upgrade bonus descriptions (what changes when you upgrade to mastery
  // level N). Placeholders here describe the transition `prev → curr`, so we
  // substitute from the diff between `levelParams[level-2]` and `levelParams[level-1]`.
  const bonusLines = (props.bonusDescriptions ?? [])
    .map((b) => {
      const raw = resolveDict(dict, b.description);
      if (raw === b.description || raw === "") {
        return { level: b.level, text: "" };
      }
      const prev = props.levelParams?.[b.level - 2];
      const curr = props.levelParams?.[b.level - 1];
      return {
        level: b.level,
        text: fillBonusPlaceholders(raw, prev, curr),
      };
    })
    .filter((b) => b.text !== "");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        {icon && <SpriteIcon icon={icon} size={64} iconsHash={iconsHash} />}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`text-sm px-2.5 py-0.5 rounded border capitalize ${schoolStyle}`}
            >
              {resolveDict(dict, `ui.school_${props.school}`)}
            </span>
            <span className="text-sm px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {resolveDict(dict, "ui.rank")} {props.rank}
            </span>
            <span className="text-sm px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 capitalize">
              {props.spellType === "battle"
                ? resolveDict(dict, "ui.battle_magic")
                : resolveDict(dict, "ui.world_magic")}
            </span>
          </div>
        </div>
      </div>

      {/* Fallback description (only if we have no per-mastery breakdown) */}
      {masteryLevels.length === 0 && desc && desc !== name && (
        <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
          {desc}
        </p>
      )}

      {/* Per-mastery descriptions */}
      {masteryLevels.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.effects")}
          </h2>
          <div className="space-y-2">
            {masteryLevels.map(({ mastery, text }) => (
              <div
                key={mastery}
                className="bg-slate-900/30 border border-slate-800/50 rounded px-3 py-2"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-xs uppercase tracking-wider text-amber-400 shrink-0">
                    {MASTERY_LABELS[mastery] ?? `Lv. ${mastery + 1}`}
                  </span>
                  <span className="text-sm whitespace-pre-line">{text}</span>
                </div>
              </div>
            ))}
          </div>
          {props.spellPowerScaling && (
            <p className="text-xs text-muted-foreground mt-2">
              Duration scales with hero Spellpower: +
              {props.spellPowerScaling.increment} round
              {props.spellPowerScaling.increment === 1 ? "" : "s"} per{" "}
              {props.spellPowerScaling.threshold} Spellpower.
            </p>
          )}
        </div>
      )}

      {/* Upgrade bonuses (what changes per mastery upgrade) */}
      {bonusLines.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.upgrade_label")}
          </h2>
          <ul className="space-y-1">
            {bonusLines.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-amber-500 mt-0.5 shrink-0">
                  {MASTERY_LABELS[b.level - 1] ?? `Lv.${b.level}`}:
                </span>
                <span className="whitespace-pre-line">{b.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mana Cost per Level */}
      {props.manaCost && props.manaCost.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.mana_cost")}
          </h2>
          <div className="flex gap-1">
            {props.manaCost.map((cost, i) => (
              <div
                key={i}
                className="bg-slate-900/50 border border-slate-800 rounded px-4 py-2 text-center flex-1"
              >
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {MASTERY_LABELS[i] ?? `Lv. ${i + 1}`}
                </div>
                <div className="text-lg font-semibold text-blue-400">
                  {cost}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learn cost — one-time cost to add this spell to the Magic Guild */}
      {props.learnCost && props.learnCost.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.learn_cost")}
          </h2>
          <div className="bg-slate-900/50 border border-slate-800 rounded px-3 py-2 inline-block">
            <ResourceCostList
              costs={props.learnCost}
              resourceIcons={resourceIcons}
              iconsHash={iconsHash}
              dict={dict}
              size={20}
            />
          </div>
        </div>
      )}

      {/* Upgrade cost per mastery level */}
      {props.upgradeCost && props.upgradeCost.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.upgrade_cost")}
          </h2>
          <div className="flex gap-1">
            {props.upgradeCost.map((cost, i) => (
              <div
                key={i}
                className="bg-slate-900/50 border border-slate-800 rounded px-4 py-2 text-center flex-1"
              >
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  → {MASTERY_LABELS[i + 1] ?? `Lv. ${i + 2}`}
                </div>
                <div className="text-lg font-semibold text-yellow-400">
                  {cost}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
