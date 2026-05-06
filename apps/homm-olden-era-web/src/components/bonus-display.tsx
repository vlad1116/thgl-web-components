import type { ReactNode } from "react";
import Link from "next/link";
import { localizePath } from "@repo/lib";
import { resolveDict } from "@/components/resolve-dict";
import { MechanicTerm } from "@/components/mechanic-term";

type Bonus = {
  type: string;
  params: (string | number)[];
  upgrade?: { increment: number; levelStep: number };
  activationLevel?: number;
};

/** Map heroStat param keys to mechanic term keys for tooltip links */
const MECHANIC_STAT_MAP: Record<string, string> = {
  luck: "luck",
  morale: "morale",
  offence: "offence",
  defence: "defence",
  spellPower: "spellpower",
  intelligence: "intelligence",
  mana: "mana",
};

export function BonusList({
  bonuses,
  dict,
  locale = "en",
}: {
  bonuses: Bonus[];
  dict: Record<string, string>;
  locale?: string;
}) {
  if (!bonuses || bonuses.length === 0) return null;

  return (
    <ul className="space-y-2">
      {bonuses.map((bonus, i) => {
        const content = formatBonus(bonus, dict, locale);
        if (!content) return null;
        return (
          <li key={i} className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">&#x25C6;</span>
            <div>
              <span>{content}</span>
              {bonus.upgrade && bonus.upgrade.increment !== 0 && (
                <span className="text-sm text-muted-foreground ml-1">
                  (+{formatPercent(bonus.upgrade.increment)} per{" "}
                  {bonus.upgrade.levelStep} levels)
                </span>
              )}
              {bonus.activationLevel && (
                <span className="text-sm text-muted-foreground ml-1">
                  (unlocks at level {bonus.activationLevel})
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SchoolLink({ school, dict, locale, children }: { school: string; dict: Record<string, string>; locale: string; children: ReactNode }) {
  return (
    <Link prefetch={false}
      href={localizePath(`/db/spells/${school}`, locale)}
      className="text-amber-400 hover:text-amber-300 transition-colors"
    >
      {children}
    </Link>
  );
}

function formatBonus(bonus: Bonus, dict: Record<string, string>, locale: string): ReactNode {
  const { type, params } = bonus;

  switch (type) {
    case "heroStatBattle":
    case "heroStat": {
      const statKey = params[0] as string;
      if (statKey === "magicSchoolSet") {
        const school = params[1] as string;
        const schoolName = resolveSchool(dict, school);
        const tier = Number(params[2]);
        const spellLevel = Number(params[3] ?? 0);
        if (tier === 0 && spellLevel === 0) return null;
        const parts: ReactNode[] = [];
        if (tier > 0) parts.push(<span key="tier">Learn <SchoolLink school={school} dict={dict} locale={locale}>{schoolName}</SchoolLink> spells (up to tier {tier})</span>);
        if (spellLevel > 0) parts.push(<span key="lvl"><SchoolLink school={school} dict={dict} locale={locale}>{schoolName}</SchoolLink> spells +{spellLevel} level</span>);
        if (spellLevel < 0) parts.push(<span key="lvl"><SchoolLink school={school} dict={dict} locale={locale}>{schoolName}</SchoolLink> spells {spellLevel} level</span>);
        return parts.length > 0 ? <>{parts.map((p, i) => <span key={i}>{i > 0 && ", "}{p}</span>)}</> : <><SchoolLink school={school} dict={dict} locale={locale}>{schoolName}</SchoolLink> spells</>;
      }
      if (statKey === "magicCostSchoolSet") {
        const school = params[1] as string;
        const schoolName = resolveSchool(dict, school);
        const cost = Number(params[2]);
        if (cost === 0) return <><SchoolLink school={school} dict={dict} locale={locale}>{schoolName}</SchoolLink> spell cost reduction unlocked</>;
        return <><SchoolLink school={school} dict={dict} locale={locale}>{schoolName}</SchoolLink> spell cost: –{Math.round(cost * 100)}%</>;
      }
      if (statKey === "magicCostSidSet") {
        // [type, spellSid, costDelta, ?]
        const spellId = params[1] as string;
        const spellName = resolveDict(dict, spellId);
        const cost = Number(params[2]);
        const sign = cost < 0 ? "–" : "+";
        return <>{spellName} mana cost: {sign}{Math.abs(cost)}</>;
      }
      if (statKey === "spellPowerSchoolSet") {
        const school = params[1] as string;
        const schoolName = resolveSchool(dict, school);
        const value = Number(params[2]);
        return <><SchoolLink school={school} dict={dict} locale={locale}>{schoolName}</SchoolLink> Spell Power: {value > 0 ? "+" : ""}{value}</>;
      }
      if (statKey === "magicCounterSet") {
        // [type, school, ...flags] — internal mechanism, summarize compactly
        const school = params[1] as string;
        const schoolName = resolveSchool(dict, school);
        return <>Counters <SchoolLink school={school} dict={dict} locale={locale}>{schoolName}</SchoolLink> magic</>;
      }
      if (statKey === "heroResPercentSet") {
        // [type, "all" or specific resource, value]
        const target = params[1] as string;
        const value = Number(params[2]);
        const label = target === "all" ? "All resources" : humanizeStat(target);
        return `${label}: ${value > 0 ? "+" : ""}${Math.round(value * 100)}%`;
      }
      if (statKey === "outDmgMultipliersSet") {
        // [type, damageType, isAdditive?, value]
        const dmgType = humanizeStat(params[1] as string);
        const value = Number(params[3]);
        return `${dmgType}: ${value > 0 ? "+" : ""}${Math.round(value * 100)}%`;
      }
      if (statKey === "energyValuesSet") {
        // [type, faction/pool, ...values] — internal energy thresholds
        return null;
      }
      if (statKey?.startsWith?.("enable")) {
        // Boolean flags ("enableMagicStealing", etc.) — described in desc text
        return null;
      }
      const stat = humanizeStat(statKey);
      const value = params[1];
      const mechanicKey = MECHANIC_STAT_MAP[statKey];
      if (mechanicKey) {
        return <><MechanicTerm termKey={mechanicKey} locale={locale}>{stat}</MechanicTerm>: {formatValue(value)}</>;
      }
      return `${stat}: ${formatValue(value)}`;
    }
    case "heroActionBonusAddition":
      // Each sub-skill describes its action bonus in its own desc text;
      // the raw "action_bonus_sub_skill_X" id has no display name. Suppress.
      return null;
    case "heroMagicAddition": {
      const spellId = params[0] as string;
      const spellName = resolveDict(dict, spellId);
      return `Grants spell: ${spellName}`;
    }
    case "heroMagicAdditionMass": {
      // params: [school|"any", tier|"any", count]
      const school = params[0] as string;
      const tier = params[1];
      const count = params[2];
      const schoolLabel = school === "any" ? "" : ` ${resolveSchool(dict, school)}`;
      const tierLabel = tier === "any" ? "" : ` tier ${tier}`;
      return `Grants ${count}${schoolLabel}${tierLabel} spell(s)`;
    }
    case "heroStatMap": {
      const stat = humanizeStat(params[0] as string);
      return `${stat} (map): ${formatValue(params[1])}`;
    }
    case "sideRes":
      return `${humanizeStat(params[0] as string)}: +${params[1]}`;
    case "sideFactionRes":
      return `Faction resource: +${params[0]}`;
    case "heroExp":
      return params[0] === "true" ? "Bonus hero experience" : "Hero experience";
    case "astrologyExp":
      return `Astrology XP: +${params[0]}`;
    case "heroScouting":
      return `Scouting range: +${params[0]}`;
    case "restoreManaAfterBattle":
      return `Restores ${params[0]} mana after battle`;
    case "cityUnitsIncrement":
      return `Weekly city units: +${params[0]}/${params[1]}`;
    case "cityUnitsIncrementPerWhenHeroInCity":
      return `City units (in-city): +${Math.round(Number(params[1]) * 100)}%`;
    case "battleMechModBonus":
      // [mechanic, modifier, buffSid] — too internal to summarize meaningfully
      return null;
    case "startBattleUnitsCountBonus":
    case "startBattleUnfrozenUnitCountBonus":
      return `Bonus units at battle start: +${Math.round(Number(params[1]) * 100)}%`;
    case "heroUnfrozenMovementRestoreBonus":
    case "heroUnfrozenBattleBonus":
      return `${humanizeStat(params[0] as string)}: ${formatValue(params[1])}`;
    case "learnMagicRemoteFromMagicGuild": {
      const school = params[0] as string;
      const schoolName = resolveSchool(dict, school);
      return <>Learn <SchoolLink school={school} dict={dict} locale={locale}>{schoolName}</SchoolLink> spells remotely from Magic Guild</>;
    }
    case "unitStat": {
      if (params[0] === "modifierSet") {
        const modType = humanizeStat(params[1] as string);
        const attackType = humanizeStat(params[2] as string);
        const value = params[3];
        return `${modType} (${attackType}): ${formatValue(value)}`;
      }
      const stat = humanizeStat(params[0] as string);
      const value = params[1];
      return `Unit ${stat}: ${formatValue(value)}`;
    }
    case "battleSubskillBonus": {
      const rawKey = params[1] as string;
      const buffName = resolveBuffName(dict, rawKey);
      return `Battle bonus: ${buffName}`;
    }
    case "heroBattleAbility": {
      const abilityName = resolveName(dict, params[0] as string);
      return `Battle ability: ${abilityName}`;
    }
    case "heroWorldAbility": {
      const abilityName = resolveName(dict, params[0] as string);
      return `World ability: ${abilityName}`;
    }
    case "modifyMagic": {
      const spellId = params[0] as string;
      const spellName = resolveDict(dict, spellId);
      return `Modifies spell: ${spellName}`;
    }
    case "addMagicToBook": {
      const spellId = params[0] as string;
      const spellName = resolveDict(dict, spellId);
      return `Grants spell: ${spellName}`;
    }
    default: {
      const formattedParams = params
        .map((p) => {
          if (typeof p === "string") {
            const resolved = resolveDict(dict, p);
            return resolved !== p ? resolved : humanizeStat(p);
          }
          return formatValue(p);
        })
        .join(", ");
      return `${humanizeStat(type)}: ${formattedParams}`;
    }
  }
}

function resolveSchool(dict: Record<string, string>, school: string): string {
  const resolved = resolveDict(dict, `ui.school_${school}`);
  return resolved !== `ui.school_${school}` ? resolved : humanizeStat(school);
}

function humanizeStat(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Try dict key, then key_name, then humanize */
function resolveName(dict: Record<string, string>, key: string): string {
  const direct = resolveDict(dict, key);
  if (direct !== key) return direct;
  const withName = resolveDict(dict, `${key}_name`);
  if (withName !== `${key}_name`) return withName;
  return humanizeStat(key);
}

/**
 * Resolve buff/ability bonus name. Game data uses keys like
 * `skill_formation_1_bonus` or `skill_siege_attack_siege_ability_bonus_1`,
 * but display strings live under `sub_skill_*` keys. Try multiple patterns.
 */
function resolveBuffName(dict: Record<string, string>, key: string): string {
  // Try direct key first
  if (dict[key]) return dict[key].startsWith("@") ? resolveDict(dict, key) : dict[key];

  // Pattern 1: skill_X_N_bonus → sub_skill_X_N
  let m = key.match(/^skill_(.+)_(\d+)_bonus$/);
  if (m) {
    const candidate = `sub_skill_${m[1]}_${m[2]}`;
    if (dict[candidate]) return resolveDict(dict, candidate);
  }
  // Pattern 2: skill_X_..._bonus_N → sub_skill_X_N
  m = key.match(/^skill_([^_]+)_.*_bonus_(\d+)$/);
  if (m) {
    const candidate = `sub_skill_${m[1]}_${m[2]}`;
    if (dict[candidate]) return resolveDict(dict, candidate);
  }
  // Fall back to direct resolution (returns key if not found)
  return resolveDict(dict, key);
}

function formatValue(value: string | number): string {
  if (typeof value === "number") {
    if (value > 0 && value < 1) return `+${(value * 100).toFixed(0)}%`;
    if (value > 1 && value < 2) return `+${((value - 1) * 100).toFixed(0)}%`;
    return value > 0 ? `+${value}` : `${value}`;
  }
  const num = parseFloat(value);
  if (!isNaN(num)) {
    if (num > 0 && num < 1) return `+${(num * 100).toFixed(0)}%`;
    return num > 0 ? `+${num}` : `${num}`;
  }
  return value;
}

function formatPercent(value: number): string {
  if (value < 1) return `${(value * 100).toFixed(1)}%`;
  return `${value}`;
}
