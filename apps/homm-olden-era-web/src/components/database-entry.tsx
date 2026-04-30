import { notFound } from "next/navigation";
import { type Database } from "@repo/ui/providers";
import { fetchDatabase, fetchDict } from "@repo/lib";
import { APP_CONFIG } from "@/config";
import { resolveDict } from "@/components/resolve-dict";
import { UnitView } from "@/components/entity-views/unit-view";
import { HeroView } from "@/components/entity-views/hero-view";
import { SpellView } from "@/components/entity-views/spell-view";
import { ItemView } from "@/components/entity-views/item-view";
import { SkillView } from "@/components/entity-views/skill-view";
import { FactionView } from "@/components/entity-views/faction-view";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Collect all dict keys referenced by an entry's props (string values and arrays)
function collectKeys(props: Record<string, any>, id: string, entryType: string): Set<string> {
  const keys = new Set<string>();

  // Entry-specific keys
  const dictKey = entryType === "factions" ? `faction_${id}` : id;
  keys.add(dictKey);
  keys.add(`${dictKey}_desc`);
  keys.add(`${dictKey}_description`);

  // All UI keys
  for (const k of [
    "ui.tier", "ui.base", "ui.upgrade_label", "ui.alt_upgrade", "ui.hp", "ui.atk",
    "ui.def", "ui.dmg", "ui.init", "ui.speed", "ui.value", "ui.cost", "ui.class",
    "ui.abilities", "ui.passives", "ui.alt_attacks", "ui.upgrade_path", "ui.related",
    "ui.school", "ui.mana", "ui.level", "ui.target", "ui.duration", "ui.cooldown",
    "ui.range", "ui.type", "ui.effect", "ui.slot", "ui.rarity", "ui.set_bonus",
    "ui.items_in_set", "ui.specialization", "ui.laws", "ui.starting_hero",
    "ui.starting_army", "ui.starting_spell", "ui.starting_skills",
    "ui.leadership", "ui.offence", "ui.defence", "ui.spellpower", "ui.knowledge",
    "ui.required_level", "ui.parent_skill", "ui.sub_skills",
    "units", "heroes", "spells", "items", "skills", "factions",
  ]) {
    keys.add(k);
  }

  // Recursively collect string values from props (faction IDs, ability IDs, etc.)
  function walk(val: any) {
    if (typeof val === "string") {
      keys.add(val);
      keys.add(`${val}_desc`);
      keys.add(`${val}_description`);
      // Faction prefix variant
      keys.add(`faction_${val}`);
    } else if (Array.isArray(val)) {
      for (const v of val) walk(v);
    } else if (val && typeof val === "object") {
      for (const v of Object.values(val)) walk(v);
    }
  }
  walk(props);

  // Upgrade chain keys
  if (props.baseId) {
    for (const suffix of ["", "_upg", "_upg_alt"]) {
      const uid = `${props.baseId}${suffix}`;
      keys.add(uid);
      keys.add(`${uid}_desc`);
    }
  }

  return keys;
}

// Create a minimal dict containing only the needed keys (plus any @-referenced values)
function sliceDict(dict: Record<string, string>, keys: Set<string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of keys) {
    const value = dict[key];
    if (value !== undefined) {
      result[key] = value;
      // Follow @-references
      if (value.startsWith("@") && dict[value]) {
        result[value] = dict[value];
      }
    }
  }
  return result;
}

export async function DatabaseEntryContent({
  id,
  typePrefix,
  locale = "en",
}: {
  id?: string;
  typePrefix: string;
  locale?: string;
}) {
  const database = await fetchDatabase(APP_CONFIG.name);
  const dict = await fetchDict(APP_CONFIG.name, locale);

  let item: Database[number]["items"][number] | undefined;
  let entryType: string = typePrefix;

  if (id) {
    const category = database.find((cat) =>
      cat.items.some((i) => i.id === id),
    ) as Database[number] | undefined;
    if (!category) notFound();
    item = category.items.find((i) => i.id === id);
    entryType = category.type;
    if (!item) notFound();
  } else {
    const category = database.find(
      (cat) => cat.type === typePrefix,
    ) as Database[number] | undefined;
    if (!category || !category.items[0]) notFound();
    item = category.items[0];
  }

  const dictKey = entryType === "factions" ? `faction_${item.id}` : item.id;
  const name = resolveDict(dict, dictKey);
  const desc = resolveDict(dict, `${dictKey}_desc`);
  const icon = item.icon as IconSprite | undefined;
  const props = item.props as any;

  // Strip database to only id/icon/type for cross-link lookups
  const liteDatabase = database.map((cat) => ({
    type: cat.type,
    items: cat.items.map((i) => ({
      id: i.id,
      icon: i.icon,
      groupId: i.groupId,
    })),
  }));

  // Slice dict to only keys needed by this entry
  const neededKeys = collectKeys(props, item.id, entryType);
  // Also add all item IDs from the database (for cross-link name resolution)
  for (const cat of database) {
    for (const i of cat.items) {
      neededKeys.add(i.id);
      if (cat.type === "factions") neededKeys.add(`faction_${i.id}`);
    }
  }
  const slicedDict = sliceDict(dict, neededKeys);

  const viewProps = { name, desc, icon, props, dict: slicedDict, database: liteDatabase, locale };

  return (
    <div className="py-4 text-left">
      {entryType === "units" && <UnitView {...viewProps} />}
      {entryType === "heroes" && <HeroView {...viewProps} />}
      {entryType === "spells" && <SpellView {...viewProps} />}
      {entryType === "items" && <ItemView {...viewProps} />}
      {(entryType === "skills" || entryType === "sub_skills") && (
        <SkillView {...viewProps} isSubSkill={entryType === "sub_skills"} />
      )}
      {(entryType === "factions" || entryType === "specializations") && (
        <FactionView {...viewProps} />
      )}
      {entryType === "faction_laws" && (
        <FactionView {...viewProps} isFactionLaw />
      )}
    </div>
  );
}
