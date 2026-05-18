import { NextResponse } from "next/server";
import { fetchDatabaseIndex, fetchDatabaseType, fetchDict } from "@repo/lib";
import { requireApp } from "@/lib/get-app-config";

function resolveDict(dict: Record<string, string>, key: string): string {
  const value = dict[key];
  if (!value) return key;
  if (value[0] === "@") return dict[value] ?? value;
  return value;
}

function resolveBuffName(dict: Record<string, string>, key: string): string {
  if (dict[key]) return dict[key].startsWith("@") ? resolveDict(dict, key) : dict[key];

  let m = key.match(/^skill_.+?_sub_skill_[a-z0-9_]+?_(warrior|mage|campaign|arena)_bonus$/);
  if (m) return resolveDict(dict, `ui.variant_${m[1]}`);

  m = key.match(/^(sub_skill_[a-z0-9_]+?)_bonus$/);
  if (m && dict[m[1]]) return resolveDict(dict, m[1]);

  m = key.match(/^(sub_skill_[a-z0-9_]+?)_(offence|defence)$/);
  if (m && dict[m[1]]) {
    const sub = resolveDict(dict, m[1]);
    const side = resolveDict(dict, `ui.side_${m[2]}`);
    return `${sub} (${side})`;
  }

  m = key.match(/^skill_(.+)_(\d+)_bonus$/);
  if (m) {
    const candidate = `sub_skill_${m[1]}_${m[2]}`;
    if (dict[candidate]) return resolveDict(dict, candidate);
  }
  m = key.match(/^skill_([^_]+)_.*_bonus_(\d+)$/);
  if (m) {
    const candidate = `sub_skill_${m[1]}_${m[2]}`;
    if (dict[candidate]) return resolveDict(dict, candidate);
  }

  const tail = key.replace(/^skill_[^_]+(?:_[^_]+)*?_(?=(?:warrior|mage|campaign|arena|bonus|offence|defence))/i, "");
  return humanizeStat(tail !== key ? tail : key);
}

function stripHtml(text: string): string {
  return text.replace(/<\/?[a-zA-Z][^>]*>/g, "");
}

function humanizeStat(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
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

type Bonus = { type: string; params: (string | number)[] };

function formatBonus(bonus: Bonus, dict: Record<string, string>): string | null {
  const { type, params } = bonus;
  switch (type) {
    case "heroStatBattle":
    case "heroStat": {
      const statKey = params[0] as string;
      if (statKey === "magicSchoolSet") {
        const school = params[1] as string;
        const schoolName = resolveDict(dict, `ui.school_${school}`);
        const tier = Number(params[2]);
        const spellLevel = Number(params[3] ?? 0);
        const parts: string[] = [];
        if (tier > 0) parts.push(`Learn ${schoolName} spells (up to tier ${tier})`);
        if (spellLevel > 0) parts.push(`${schoolName} spells +${spellLevel} level`);
        if (spellLevel < 0) parts.push(`${schoolName} spells ${spellLevel} level`);
        return parts.length > 0 ? parts.join(", ") : `${schoolName} spells`;
      }
      if (statKey === "magicCostSchoolSet") {
        const school = params[1] as string;
        const schoolName = resolveDict(dict, `ui.school_${school}`);
        const cost = Number(params[2]);
        if (cost === 0) return `${schoolName} spell cost reduction`;
        return `${schoolName} spell cost: –${Math.round(cost * 100)}%`;
      }
      if (statKey === "magicCostSidSet") {
        const spellName = resolveDict(dict, params[1] as string);
        const cost = Number(params[2]);
        const sign = cost < 0 ? "–" : "+";
        return `${spellName} mana cost: ${sign}${Math.abs(cost)}`;
      }
      if (statKey === "spellPowerSchoolSet") {
        const school = params[1] as string;
        const schoolName = resolveDict(dict, `ui.school_${school}`);
        const value = Number(params[2]);
        return `${schoolName} Spell Power: ${value > 0 ? "+" : ""}${value}`;
      }
      if (statKey === "magicCounterSet") {
        const school = params[1] as string;
        const schoolName = resolveDict(dict, `ui.school_${school}`);
        return `Counters ${schoolName} magic`;
      }
      if (statKey === "heroResPercentSet") {
        const target = params[1] as string;
        const value = Number(params[2]);
        const label = target === "all" ? "All resources" : humanizeStat(target);
        return `${label}: ${value > 0 ? "+" : ""}${Math.round(value * 100)}%`;
      }
      if (statKey === "outDmgMultipliersSet") {
        const dmgType = humanizeStat(params[1] as string);
        const value = Number(params[3]);
        return `${dmgType}: ${value > 0 ? "+" : ""}${Math.round(value * 100)}%`;
      }
      if (statKey === "energyValuesSet") return null;
      if (statKey?.startsWith?.("enable")) return null;
      return `${humanizeStat(statKey)}: ${formatValue(params[1])}`;
    }
    case "unitStat": {
      if (params[0] === "modifierSet") {
        return `${humanizeStat(params[1] as string)} (${humanizeStat(params[2] as string)}): ${formatValue(params[3])}`;
      }
      return `Unit ${humanizeStat(params[0] as string)}: ${formatValue(params[1])}`;
    }
    case "battleSubskillBonus":
      return `${resolveDict(dict, "ui.battle_bonus")}: ${resolveBuffName(dict, params[1] as string)}`;
    case "heroBattleAbility":
      return `${resolveDict(dict, "ui.battle_ability")}: ${resolveDict(dict, params[0] as string)}`;
    case "heroWorldAbility":
      return `${resolveDict(dict, "ui.world_ability")}: ${resolveDict(dict, params[0] as string)}`;
    case "modifyMagic":
      return `${resolveDict(dict, "ui.modifies_spell")}: ${resolveDict(dict, params[0] as string)}`;
    case "addMagicToBook":
    case "heroMagicAddition":
      return `${resolveDict(dict, "ui.grants_spell")}: ${resolveDict(dict, params[0] as string)}`;
    case "heroMagicAdditionMass": {
      const school = params[0] as string;
      const tier = params[1];
      const count = params[2];
      const schoolLabel = school === "any" ? "" : ` ${resolveDict(dict, `ui.school_${school}`)}`;
      const tierLabel = tier === "any" ? "" : ` tier ${tier}`;
      return `Grants ${count}${schoolLabel}${tierLabel} spell(s)`;
    }
    case "heroActionBonusAddition":
      return null;
    case "heroStatMap":
      return `${humanizeStat(params[0] as string)} (map): ${formatValue(params[1])}`;
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
      return null;
    case "startBattleUnitsCountBonus":
    case "startBattleUnfrozenUnitCountBonus":
      return `Bonus units at battle start: +${Math.round(Number(params[1]) * 100)}%`;
    case "heroUnfrozenMovementRestoreBonus":
    case "heroUnfrozenBattleBonus":
      return `${humanizeStat(params[0] as string)}: ${formatValue(params[1])}`;
    default:
      return `${humanizeStat(type)}: ${params.map((p) => typeof p === "string" ? humanizeStat(p) : formatValue(p)).join(", ")}`;
  }
}

export async function GET(request: Request) {
  const appConfig = await requireApp("homm-olden-era");
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const locale = searchParams.get("locale") || "en";

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const [index, dict] = await Promise.all([
    fetchDatabaseIndex(appConfig.name),
    fetchDict(appConfig.name, locale),
  ]);

  let item: any;
  let entryType = "";
  for (const cat of index) {
    if (cat.items.some((i: any) => i.id === id)) {
      entryType = cat.type;
      break;
    }
  }
  if (entryType) {
    const fullCat = await fetchDatabaseType(appConfig.name, entryType);
    item = fullCat.items.find((i: any) => i.id === id);
  }

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dictKey = entryType === "factions" ? `faction_${id}` : id;
  const name = resolveDict(dict, dictKey);
  let desc = resolveDict(dict, `${dictKey}_desc`);
  const hasDesc = desc && desc !== `${dictKey}_desc` && desc !== name;

  if (hasDesc && desc.includes("{")) {
    const numericValues: string[] = [];
    for (const b of item.props?.bonuses ?? []) {
      for (const p of b.params) {
        const n = parseFloat(String(p));
        if (!isNaN(n) && n !== 0 && String(p) !== "true" && String(p) !== "false") {
          const abs = Math.abs(n);
          numericValues.push(
            abs > 0 && abs < 1 ? `${Math.round(abs * 100)}` : String(abs),
          );
        }
      }
    }
    desc = desc.replace(
      /\{(\d+)\}/g,
      (_, idx: string) => numericValues[parseInt(idx)] ?? "?",
    );
  }
  if (hasDesc) desc = stripHtml(desc);

  const bonuses: string[] = [];
  for (const b of item.props?.bonuses ?? []) {
    const formatted = formatBonus(b, dict);
    if (formatted) bonuses.push(stripHtml(formatted));
  }

  const extras: { label: string; value: string }[] = [];
  const stats: string[] = [];
  const p = item.props ?? {};
  switch (entryType) {
    case "units": {
      let base: any = null;
      if (p.baseId && p.upgradeLevel && p.upgradeLevel !== "base") {
        const fullCat = await fetchDatabaseType(appConfig.name, "units");
        base = fullCat.items.find((i: any) => i.id === p.baseId)?.props ?? null;
      }
      const fmtStat = (label: string, value: number, baseValue?: number): string => {
        if (typeof baseValue === "number" && baseValue !== value) {
          const delta = value - baseValue;
          const sign = delta > 0 ? "+" : "";
          return `${label}: ${value} (${sign}${delta})`;
        }
        return `${label}: ${value}`;
      };
      if (p.tier) stats.push(`Tier ${p.tier}`);
      if (p.hp != null) stats.push(fmtStat("HP", p.hp, base?.hp));
      if (p.offence != null) stats.push(fmtStat("ATK", p.offence, base?.offence));
      if (p.defence != null) stats.push(fmtStat("DEF", p.defence, base?.defence));
      if (p.damageMin != null && p.damageMax != null) {
        const dmg = `${p.damageMin}–${p.damageMax}`;
        if (base && (base.damageMin !== p.damageMin || base.damageMax !== p.damageMax)) {
          const dMin = p.damageMin - base.damageMin;
          const dMax = p.damageMax - base.damageMax;
          const sMin = dMin > 0 ? "+" : "";
          const sMax = dMax > 0 ? "+" : "";
          stats.push(`DMG: ${dmg} (${sMin}${dMin}/${sMax}${dMax})`);
        } else {
          stats.push(`DMG: ${dmg}`);
        }
      }
      if (p.initiative != null) stats.push(fmtStat("INI", p.initiative, base?.initiative));
      if (p.speed != null) stats.push(fmtStat("SPD", p.speed, base?.speed));
      break;
    }
    case "heroes": {
      const faction = p.faction ? resolveDict(dict, `faction_${p.faction}`) : null;
      if (faction && faction !== `faction_${p.faction}`) stats.push(faction);
      if (p.classType) stats.push(p.classType === "might" ? "Might" : "Magic");
      if (p.offence) stats.push(`ATK: ${p.offence}`);
      if (p.defence) stats.push(`DEF: ${p.defence}`);
      if (p.spellPower) stats.push(`SP: ${p.spellPower}`);
      if (p.intelligence) stats.push(`INT: ${p.intelligence}`);

      if (p.specialization) {
        const specName = resolveDict(dict, p.specialization as string);
        if (specName !== p.specialization) extras.push({ label: "Specialization", value: specName });
      }
      if (Array.isArray(p.startSkills) && p.startSkills.length > 0) {
        const names = (p.startSkills as string[])
          .map((s) => resolveDict(dict, s))
          .filter((n, i) => n !== (p.startSkills as string[])[i]);
        if (names.length > 0) extras.push({ label: "Starting Skills", value: names.join(", ") });
      }
      if (Array.isArray(p.startingArmy) && p.startingArmy.length > 0) {
        const army = (p.startingArmy as { unit: string; min: number; max: number }[])
          .map((a) => `${a.min}–${a.max} ${resolveDict(dict, a.unit)}`)
          .join(", ");
        extras.push({ label: "Starting Army", value: army });
      }
      break;
    }
    case "spells": {
      if (p.school) {
        const schoolName = resolveDict(dict, `ui.school_${p.school}`);
        stats.push(schoolName !== `ui.school_${p.school}` ? schoolName : humanizeStat(p.school as string));
      }
      if (p.tier) stats.push(`Tier ${p.tier}`);
      if (p.manaCost) stats.push(`${p.manaCost} Mana`);
      break;
    }
    case "items":
    case "item_sets": {
      if (p.slot) {
        const slotKey = `ui.slot_${p.slot}`;
        const resolved = resolveDict(dict, slotKey);
        stats.push(resolved !== slotKey ? resolved : (p.slot as string).replace(/_slot$/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
      }
      if (p.rarity) stats.push(humanizeStat(p.rarity as string));
      break;
    }
    case "skills":
    case "sub_skills": {
      if (p.skillType) stats.push(humanizeStat(p.skillType as string));
      break;
    }
    case "buildings": {
      if (p.costGold) stats.push(`${p.costGold} Gold`);
      break;
    }
    case "specializations": {
      if (item.groupId) {
        const factionName = resolveDict(dict, `faction_${item.groupId}`);
        if (factionName !== `faction_${item.groupId}`) stats.push(factionName);
      }
      break;
    }
  }

  return NextResponse.json(
    {
      id,
      name,
      type: entryType,
      desc: hasDesc ? desc : null,
      bonuses,
      stats,
      extras,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
