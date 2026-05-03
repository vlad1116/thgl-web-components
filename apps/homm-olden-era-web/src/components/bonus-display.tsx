import type { ReactNode } from "react";
import Link from "next/link";
import { localizePath } from "@repo/lib";
import { resolveDict } from "@/components/resolve-dict";

type Bonus = {
  type: string;
  params: (string | number)[];
  upgrade?: { increment: number; levelStep: number };
  activationLevel?: number;
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
    <Link
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
      const stat = humanizeStat(statKey);
      const value = params[1];
      return `${stat}: ${formatValue(value)}`;
    }
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
      const buffName = resolveDict(dict, params[1] as string);
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
