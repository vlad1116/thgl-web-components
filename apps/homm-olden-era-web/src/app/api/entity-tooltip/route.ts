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
        if (!isNaN(n) && String(p) !== "true" && String(p) !== "false") {
          numericValues.push(
            n > 0 && n < 1 ? `${Math.round(n * 100)}` : String(n),
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

  return NextResponse.json(
    {
      id,
      name,
      type: entryType,
      desc: hasDesc ? desc : null,
      bonuses,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
