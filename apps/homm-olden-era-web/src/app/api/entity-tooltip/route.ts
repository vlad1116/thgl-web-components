import { NextResponse } from "next/server";
import { fetchDatabase, fetchDict } from "@repo/lib";
import { APP_CONFIG } from "@/config";

function resolveDict(dict: Record<string, string>, key: string): string {
  const value = dict[key];
  if (!value) return key;
  if (value[0] === "@") return dict[value] ?? value;
  return value;
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

function formatBonus(bonus: Bonus, dict: Record<string, string>): string {
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
      return `${humanizeStat(statKey)}: ${formatValue(params[1])}`;
    }
    case "unitStat": {
      if (params[0] === "modifierSet") {
        return `${humanizeStat(params[1] as string)} (${humanizeStat(params[2] as string)}): ${formatValue(params[3])}`;
      }
      return `Unit ${humanizeStat(params[0] as string)}: ${formatValue(params[1])}`;
    }
    case "battleSubskillBonus":
      return `Battle bonus: ${resolveDict(dict, params[1] as string)}`;
    case "heroBattleAbility":
      return `Battle ability: ${resolveDict(dict, params[0] as string)}`;
    case "heroWorldAbility":
      return `World ability: ${resolveDict(dict, params[0] as string)}`;
    case "modifyMagic":
      return `Modifies spell: ${resolveDict(dict, params[0] as string)}`;
    case "addMagicToBook":
      return `Grants spell: ${resolveDict(dict, params[0] as string)}`;
    default:
      return `${humanizeStat(type)}: ${params.map((p) => typeof p === "string" ? humanizeStat(p) : formatValue(p)).join(", ")}`;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const locale = searchParams.get("locale") || "en";

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const [database, dict] = await Promise.all([
    fetchDatabase(APP_CONFIG.name),
    fetchDict(APP_CONFIG.name, locale),
  ]);

  // Find the entity across all categories
  let item: any;
  let entryType = "";
  for (const cat of database) {
    const found = cat.items.find((i: any) => i.id === id);
    if (found) {
      item = found;
      entryType = cat.type;
      break;
    }
  }

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dictKey = entryType === "factions" ? `faction_${id}` : id;
  const name = resolveDict(dict, dictKey);
  let desc = resolveDict(dict, `${dictKey}_desc`);
  const hasDesc = desc && desc !== `${dictKey}_desc` && desc !== name;

  // Resolve {0}, {1}, ... template placeholders from bonus params
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
      (_, idx: string) => numericValues[parseInt(idx)] ?? "",
    );
  }

  // Format bonuses as plain text
  const bonuses: string[] = [];
  for (const b of item.props?.bonuses ?? []) {
    bonuses.push(formatBonus(b, dict));
  }

  // Build type-specific stats preview
  const stats: string[] = [];
  const p = item.props ?? {};
  switch (entryType) {
    case "units": {
      if (p.health) stats.push(`HP: ${p.health}`);
      if (p.attack) stats.push(`ATK: ${p.attack}`);
      if (p.defence) stats.push(`DEF: ${p.defence}`);
      if (p.damageMin && p.damageMax) stats.push(`DMG: ${p.damageMin}–${p.damageMax}`);
      if (p.tier) stats.push(`Tier ${p.tier}`);
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
  }

  return NextResponse.json(
    {
      id,
      name,
      type: entryType,
      desc: hasDesc ? desc : null,
      bonuses,
      stats,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
