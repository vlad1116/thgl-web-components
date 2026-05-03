import Link from "next/link";
import { localizePath } from "@repo/lib";
import { resolveDict, resolveDictWithFallback } from "@/components/resolve-dict";
import { SpriteIcon } from "@/components/sprite-icon";
import { EntityLink } from "@/components/cross-link";

type Variant = {
  chance: number;
  value?: number;
  guarded?: boolean;
  rewards: { type: string; params: (string | number)[] }[];
};

type SpellOffering = {
  school: string;
  tierChances: { tier: number; chance: number }[];
};

type MapObjectProps = {
  group: string;
  visitType?: string;
  guardUnits?: boolean;
  value?: number;
  resName?: string;
  resValue?: number;
  units?: { sids: string[]; weeklyGrowth: number }[];
  templateValues?: (string | number)[];
  variants?: Variant[];
  totalChance?: number;
  spellOfferings?: SpellOffering[];
};

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function FormatReward({
  type,
  params,
  dict,
  database,
  locale,
}: {
  type: string;
  params: (string | number)[];
  dict: Record<string, string>;
  database: any[];
  locale: string;
}) {
  switch (type) {
    case "SideResReward": {
      const parts: string[] = [];
      for (let i = 0; i < params.length; i += 2) {
        parts.push(`${Number(params[i + 1]).toLocaleString()} ${resolveDict(dict, String(params[i]))}`);
      }
      return <>{parts.join(", ")}</>;
    }
    case "HeroExpReward":
    case "SideExpReward":
      return <>{Number(params[0]).toLocaleString()} XP</>;
    case "HeroBoxOptionalVersionUnitReward":
      return <>Tier {params[0]} units (choice)</>;
    case "HeroBoxUnitReward":
      return <>Tier {params[0]} units</>;
    case "HeroStatsReward": {
      const stats: string[] = [];
      for (let i = 0; i < params.length; i += 2) {
        stats.push(`+${params[i + 1]} ${String(params[i]).replace(/([A-Z])/g, " $1").trim()}`);
      }
      return <>{stats.join(", ")}</>;
    }
    case "HeroMagicMassAdditionReward": {
      const school = params[0] === "any" ? "" : ` ${String(params[0])}`;
      const tier = params[2] === "any" ? "" : ` tier ${params[2]}`;
      if (school) return <>All{school} spells</>;
      if (tier) return <>All{tier} spells</>;
      return <>All spells</>;
    }
    case "HeroMagicAdditionReward":
      return <>{params.length} specific spells</>;
    case "HeroRandomItemsReward":
      return <>Random {params[0]} artifact</>;
    case "MovePointsAdditionReward":
      return <>+{params[0]} movement points</>;
    case "ManaAdditionReward":
      return <>+{params[0]} mana</>;
    case "ManaPercentSettingReward":
      return <>Set mana to {Math.round(Number(params[0]) * 100)}%</>;
    case "SideExpToLevelUpReward":
    case "HeroLevelUpReward":
      return <>Level up</>;
    case "HeroItemReward":
      return (
        <EntityLink itemId={String(params[0])} database={database} dict={dict} locale={locale} />
      );
    case "HeroUnitsReward":
      return (
        <span className="inline-flex items-center gap-1">
          {params[1] && <span>{params[1]}×</span>}
          <EntityLink itemId={String(params[0])} database={database} dict={dict} locale={locale} />
        </span>
      );
    case "HeroSkillAdditionReward":
      return (
        <EntityLink itemId={String(params[0])} database={database} dict={dict} locale={locale} />
      );
    case "HeroBoxUnitsReward":
      return (
        <span className="inline-flex items-center gap-1 flex-wrap">
          {params.map((p, i) => (
            <span key={i}>
              {i > 0 && ", "}
              <EntityLink itemId={String(p)} database={database} dict={dict} locale={locale} />
            </span>
          ))}
        </span>
      );
    case "HeroSkillReward":
      return (
        <EntityLink itemId={String(params[0])} database={database} dict={dict} locale={locale} />
      );
    case "RandomHeroSkillReward":
      return <>Random skill ({params[0]} choices)</>;
    case "SideRandomBuffReward": {
      // Params: [debuffId1, debuffId2, ..., durationType, durationValue]
      const duration = Number(params[params.length - 1]);
      const durationType = String(params[params.length - 2]);
      const durationLabel = durationType === "ForSeveralDays" ? `${duration} days` : `${duration} rounds`;
      return <>Random curse ({durationLabel})</>;
    }
    default:
      return <>{type.replace(/Reward$/, "").replace(/([A-Z])/g, " $1").trim()}: {params.join(", ")}</>;
  }
}

function substituteTemplateValues(text: string, values?: (string | number)[]): string {
  if (!values || values.length === 0) return text;
  let result = text;
  for (let i = 0; i < values.length; i++) {
    result = result.replaceAll(`{${i}}`, String(values[i]));
  }
  return result;
}

export function MapObjectView({
  name,
  desc,
  icon,
  props,
  dict,
  database,
  locale = "en",
  entryId,
}: {
  name: string;
  desc: string;
  icon?: IconSprite;
  props: MapObjectProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
  entryId?: string;
}) {
  const groupLabel = resolveDict(dict, props.group);
  const rawDesc = desc && desc !== name && !desc.includes("_desc") && !desc.includes("_description")
    ? desc
    : undefined;
  const resolvedDesc = rawDesc
    ? substituteTemplateValues(rawDesc, props.templateValues)
    : undefined;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        {icon && <SpriteIcon icon={icon} size={64} />}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {groupLabel}
            </span>
            {props.visitType && (
              <span className="text-xs text-muted-foreground capitalize">
                {props.visitType.replace(/([A-Z])/g, " $1").trim()}
              </span>
            )}
            {props.guardUnits && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-800/50">
                Guarded
              </span>
            )}
          </div>
        </div>
      </div>

      {resolvedDesc && (
        <p className="text-muted-foreground border-l-2 border-amber-800/50 pl-3">
          {resolvedDesc}
        </p>
      )}

      {(() => {
        if (!entryId) return null;
        const narrative = resolveDict(dict, `${entryId}_narrative`);
        if (narrative.endsWith("_narrative")) return null;
        return (
          <p className="text-sm text-muted-foreground italic">
            {narrative}
          </p>
        );
      })()}

      {/* Stats row */}
      {(props.resValue != null || props.value != null) && (
        <div className="flex gap-2 flex-wrap">
          {props.resValue != null && (
            <div className="bg-slate-900/50 border border-slate-800 rounded px-4 py-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Daily Production
              </div>
              <div className="text-lg font-semibold text-amber-400">
                {props.resValue} {props.resName}
              </div>
            </div>
          )}
          {props.value != null && props.value > 0 && (
            <div className="bg-slate-900/50 border border-slate-800 rounded px-4 py-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {resolveDict(dict, "ui.value")}
              </div>
              <div className="text-lg font-semibold text-slate-300">
                {props.value.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spell offerings (altars/shrines) */}
      {props.spellOfferings && props.spellOfferings.length > 0 && (() => {
        const school = props.spellOfferings[0].school;
        const schoolLabel = resolveDictWithFallback(dict, `ui.school_${school}`, school);
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm uppercase tracking-wider text-muted-foreground">
                Spell Offerings
              </h4>
              <Link
                href={localizePath(`/db/spells/${school}`, locale)}
                className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                Browse {schoolLabel} Spells →
              </Link>
            </div>
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800">
                    <th className="px-4 py-2 text-sm font-medium text-muted-foreground">Spell Slot</th>
                    {(() => {
                      const allTiers = new Set<number>();
                      for (const o of props.spellOfferings!) for (const tc of o.tierChances) allTiers.add(tc.tier);
                      return [...allTiers].sort((a, b) => a - b).map(tier => (
                        <th key={tier} className="px-4 py-2 text-sm font-medium text-muted-foreground text-center">
                          Tier {tier}
                        </th>
                      ));
                    })()}
                  </tr>
                </thead>
                <tbody>
                  {props.spellOfferings.map((offering, i) => {
                    const allTiers = new Set<number>();
                    for (const o of props.spellOfferings!) for (const tc of o.tierChances) allTiers.add(tc.tier);
                    const sortedTiers = [...allTiers].sort((a, b) => a - b);
                    const chanceMap = new Map(offering.tierChances.map(tc => [tc.tier, tc.chance]));
                    return (
                      <tr key={i} className="border-b border-slate-800/50 last:border-0">
                        <td className="px-4 py-2 text-sm">Spell {i + 1}</td>
                        {sortedTiers.map(tier => (
                          <td key={tier} className="px-4 py-2 text-sm text-center tabular-nums">
                            {chanceMap.has(tier) ? (
                              <span className="text-amber-400">{chanceMap.get(tier)}%</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Reward variants */}
      {props.variants && props.totalChance && props.variants.length > 0 && (
        <div>
          <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            Possible Rewards
          </h4>
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800">
                  <th className="px-4 py-2 text-sm font-medium text-muted-foreground w-20">Chance</th>
                  <th className="px-4 py-2 text-sm font-medium text-muted-foreground">Reward</th>
                </tr>
              </thead>
              <tbody>
                {props.variants.map((v, i) => {
                  const pct = Math.round((v.chance / props.totalChance!) * 1000) / 10;
                  return (
                    <tr key={i} className="border-b border-slate-800/50 last:border-0">
                      <td className="px-4 py-2 text-sm tabular-nums text-amber-400">
                        {pct}%
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {v.rewards.map((r, j) => (
                          <span key={j}>
                            {j > 0 && " + "}
                            <FormatReward type={r.type} params={r.params} dict={dict} database={database} locale={locale} />
                          </span>
                        ))}
                        {v.guarded && (
                          <span className="ml-2 text-xs text-red-400">(guarded)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unit recruitment */}
      {props.units && props.units.length > 0 && (
        <div>
          <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.cat_hires")}
          </h4>
          <div className="space-y-1">
            {props.units.map((u, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-slate-900/30 border border-slate-800/50 rounded px-3 py-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {u.sids.map((sid) => (
                    <EntityLink
                      key={sid}
                      itemId={sid}
                      database={database}
                      locale={locale}
                      dict={dict}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground shrink-0 ml-2">
                  +{u.weeklyGrowth}/week
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
