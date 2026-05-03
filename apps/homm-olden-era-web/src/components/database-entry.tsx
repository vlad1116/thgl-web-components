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
import { BuildingView } from "@/components/entity-views/building-view";
import { MapObjectView } from "@/components/entity-views/map-object-view";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Collect all dict keys referenced by an entry's props
function collectKeys(dict: Record<string, string>, props: Record<string, any>, id: string, entryType: string): Set<string> {
  const keys = new Set<string>();

  // Entry-specific keys
  const dictKey = entryType === "factions" ? `faction_${id}` : id;
  keys.add(dictKey);
  keys.add(`${dictKey}_desc`);
  keys.add(`${dictKey}_description`);
  keys.add(`${dictKey}_narrative`);

  // All ui.* keys (small set, avoids maintaining a static list)
  for (const k of Object.keys(dict)) {
    if (k.startsWith("ui.")) keys.add(k);
  }

  // Category labels
  for (const k of ["units", "heroes", "spells", "items", "item_sets", "skills", "factions",
    "specializations", "faction_laws", "sub_skills", "buildings", "map_objects"]) {
    keys.add(k);
  }

  // Recursively collect string values from props (faction IDs, ability IDs, etc.)
  function walk(val: any) {
    if (typeof val === "string") {
      keys.add(val);
      keys.add(`${val}_desc`);
      keys.add(`${val}_description`);
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
      itemSet: i.props?.itemSet,
    })),
  }));

  // Slice dict to only keys needed by this entry
  const neededKeys = collectKeys(dict, props, item.id, entryType);
  // Also add all item IDs from the database (for cross-link name resolution)
  for (const cat of database) {
    for (const i of cat.items) {
      neededKeys.add(i.id);
      if (cat.type === "factions") neededKeys.add(`faction_${i.id}`);
    }
  }
  const slicedDict = sliceDict(dict, neededKeys);

  const viewProps = { name, desc, icon, props, dict: slicedDict, database: liteDatabase, locale, entryId: item.id };

  return (
    <div className="py-4 text-left">
      {entryType === "units" && <UnitView {...viewProps} />}
      {entryType === "heroes" && <HeroView {...viewProps} />}
      {entryType === "spells" && <SpellView {...viewProps} />}
      {(entryType === "items" || entryType === "item_sets") && <ItemView {...viewProps} />}
      {(entryType === "skills" || entryType === "sub_skills") && (
        <SkillView {...viewProps} isSubSkill={entryType === "sub_skills"} />
      )}
      {(entryType === "factions" || entryType === "specializations") && (
        <FactionView {...viewProps} />
      )}
      {entryType === "faction_laws" && (
        <FactionView {...viewProps} isFactionLaw />
      )}
      {entryType === "buildings" && <BuildingView {...viewProps} />}
      {entryType === "map_objects" && <MapObjectView {...viewProps} />}
    </div>
  );
}
