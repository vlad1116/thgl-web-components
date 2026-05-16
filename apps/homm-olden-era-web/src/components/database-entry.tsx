import { notFound } from "next/navigation";
import { fetchDatabaseIndex, fetchDatabaseType, fetchDict, fetchVersion, type DatabaseConfig } from "@repo/lib";
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

  // Resource labels for cost rows (gold, gemstones, …) — used by units, heroes, buildings.
  if (entryType === "units" || entryType === "heroes" || entryType === "buildings") {
    for (const r of ["gold", "wood", "ore", "dust", "crystals", "gemstones", "mercury"]) {
      keys.add(`resource_${r}`);
    }
  }

  // Hero pages render the specialization name + description inline using
  // `{baseId}_spec` / `{baseId}_spec_desc` keys (separate from the spec entry's own
  // `{id}_specialization_desc` key). Both can be @-pointers, so we keep both.
  if (entryType === "heroes" && typeof props.specialization === "string") {
    const baseId = (props.specialization as string).replace("_specialization", "");
    keys.add(`${baseId}_spec`);
    keys.add(`${baseId}_spec_desc`);
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

  // Skill level description keys (e.g. skill_faction_humans_level_1_desc)
  if ((entryType === "skills" || entryType === "sub_skills") && Array.isArray(props.levels)) {
    for (const lvl of props.levels) {
      const level = lvl?.level;
      if (typeof level === "number") {
        keys.add(`${id}_level_${level}`);
        keys.add(`${id}_level_${level}_desc`);
      }
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
  // 1. Fetch the index + dict + version in parallel.
  // 2. Resolve which type the entry belongs to (typePrefix may be a section
  //    that maps to multiple types — e.g. "items" can match items or item_sets).
  // 3. Fetch the full props for that one type only.
  // 4. For faction entries, additionally fetch buildings (for the build tree).
  const [index, dict, version] = await Promise.all([
    fetchDatabaseIndex(APP_CONFIG.name),
    fetchDict(APP_CONFIG.name, locale),
    fetchVersion(APP_CONFIG.name),
  ]);
  const iconsHash = version.more.icons;

  let entryType: string = typePrefix;
  if (id) {
    const matchingType = index.find((cat) =>
      cat.items.some((i) => i.id === id),
    )?.type;
    if (!matchingType) notFound();
    entryType = matchingType;
  }

  // Faction views render a per-faction build tree, so we fetch buildings too.
  // Hero pages need the matching specialization's bonuses for inline desc resolution.
  // Sub-skill pages need the parent skill so we can show which skill they belong to.
  const needsBuildings = entryType === "factions";
  const needsSpecializations = entryType === "heroes";
  const needsSkills = entryType === "sub_skills";
  const [entryCat, buildingsCat, specializationsCat, skillsCat] = await Promise.all([
    fetchDatabaseType(APP_CONFIG.name, entryType),
    needsBuildings
      ? fetchDatabaseType(APP_CONFIG.name, "buildings")
      : Promise.resolve(null),
    needsSpecializations
      ? fetchDatabaseType(APP_CONFIG.name, "specializations")
      : Promise.resolve(null),
    needsSkills
      ? fetchDatabaseType(APP_CONFIG.name, "skills")
      : Promise.resolve(null),
  ]);

  let item: DatabaseConfig[number]["items"][number] | undefined;
  if (id) {
    item = entryCat.items.find((i) => i.id === id);
  } else {
    item = entryCat.items[0];
  }
  if (!item) notFound();

  // Compose a single database for cross-link lookups: index for ids/icons
  // across all types, plus full buildings when on a faction page.
  const database: DatabaseConfig = buildingsCat
    ? [
        ...index.filter((cat) => cat.type !== "buildings"),
        buildingsCat,
      ]
    : index;

  const dictKey = entryType === "factions" ? `faction_${item.id}` : item.id;
  const name = resolveDict(dict, dictKey);
  const desc = resolveDict(dict, `${dictKey}_desc`);
  const icon = item.icon as IconSprite | undefined;
  const props = item.props as any;

  // Strip database to only id/icon/type for cross-link lookups
  const liteDatabase = database.map((cat) => ({
    type: cat.type,
    items: cat.items.map((i) => {
      // Include building data (faction, category, prerequisites) when viewing a faction
      // so the FactionView can render a build tree
      if (
        entryType === "factions" &&
        cat.type === "buildings" &&
        (i.props as any)?.faction === item.id
      ) {
        const lvls = ((i.props as any).levels ?? []).map((lvl: any) => ({
          name: lvl.name,
          icon: lvl.icon,
          costs: lvl.costs,
          prerequisites: lvl.prerequisites,
          nodePos: lvl.nodePos,
        }));
        return {
          id: i.id,
          icon: i.icon,
          groupId: i.groupId,
          props: {
            faction: (i.props as any).faction,
            category: (i.props as any).category,
            sid: (i.props as any).sid,
            levels: lvls,
          },
        };
      }
      // Keep bonuses for the hero's own specialization (used to resolve {0}/{1}
      // placeholders in the inline description on the hero page).
      if (
        entryType === "heroes" &&
        cat.type === "specializations" &&
        specializationsCat &&
        i.id === (item.props as any)?.specialization
      ) {
        const specFull = specializationsCat.items.find((s) => s.id === i.id);
        return {
          id: i.id,
          icon: i.icon,
          groupId: i.groupId,
          props: { bonuses: (specFull?.props as any)?.bonuses ?? [] },
        };
      }
      return {
        id: i.id,
        icon: i.icon,
        groupId: i.groupId,
        itemSet: i.props?.itemSet,
        // Keep ultimateSkills for hero→faction cross-reference
        ...(cat.type === "factions" && i.props?.ultimateSkills ? { props: { ultimateSkills: i.props.ultimateSkills } } : {}),
      };
    }),
  }));

  // Slice dict to only keys needed by this entry
  const neededKeys = collectKeys(dict, props, item.id, entryType);
  // Also add all item IDs from the database (for cross-link name resolution)
  for (const cat of database) {
    for (const i of cat.items) {
      neededKeys.add(i.id);
      if (cat.type === "factions") {
        neededKeys.add(`faction_${i.id}`);
        // Add ultimate skill IDs for hero→faction cross-reference
        for (const ult of (i.props as any)?.ultimateSkills ?? []) {
          neededKeys.add(ult.id);
          neededKeys.add(`${ult.id}_desc`);
        }
      }
    }
  }

  // For faction pages: add building label keys so the build tree can render names
  if (entryType === "factions") {
    for (const cat of database) {
      if (cat.type !== "buildings") continue;
      for (const i of cat.items) {
        if ((i.props as any)?.faction !== item.id) continue;
        neededKeys.add(i.id);
        for (const lvl of ((i.props as any).levels ?? [])) {
          if (lvl.name) neededKeys.add(lvl.name);
        }
      }
    }
    // Also UI labels used by the build tree
    neededKeys.add("ui.cat_mains");
    neededKeys.add("ui.cat_taverns");
    neededKeys.add("ui.cat_markets");
    neededKeys.add("ui.cat_artifactMarkets");
    neededKeys.add("ui.cat_hires");
    neededKeys.add("ui.cat_magicGuilds");
    neededKeys.add("ui.cat_banks");
    neededKeys.add("ui.cat_walls");
    neededKeys.add("ui.cat_intelligences");
    neededKeys.add("ui.cat_trainingRanges");
    neededKeys.add("ui.cat_graals");
    neededKeys.add("ui.building_costs");
    neededKeys.add("ui.building_requires");
  }
  // Resolve a sub-skill's parent skill (the skill whose `levels[].subSkills`
  // includes this sub-skill's id). Used by the skill view to render a
  // "belongs to" link on sub-skill pages.
  let parentSkill: { id: string; level: number } | null = null;
  if (entryType === "sub_skills" && skillsCat) {
    for (const skill of skillsCat.items) {
      const levels = ((skill.props as any)?.levels ?? []) as {
        level: number;
        subSkills?: string[];
      }[];
      for (const lvl of levels) {
        if (lvl.subSkills?.includes(item.id)) {
          parentSkill = { id: skill.id, level: lvl.level };
          break;
        }
      }
      if (parentSkill) break;
    }
    if (parentSkill) {
      // Keep the parent skill's dict keys (name + level label) survives slicing.
      neededKeys.add(parentSkill.id);
      neededKeys.add(`${parentSkill.id}_level_${parentSkill.level}`);
    }
  }
  const slicedDict = sliceDict(dict, neededKeys);

  const viewProps = { name, desc, icon, props, dict: slicedDict, database: liteDatabase, locale, entryId: item.id, iconsHash };

  return (
    <div className="py-4 text-left">
      {entryType === "units" && <UnitView {...viewProps} />}
      {entryType === "heroes" && <HeroView {...viewProps} />}
      {entryType === "spells" && <SpellView {...viewProps} />}
      {(entryType === "items" || entryType === "item_sets") && <ItemView {...viewProps} />}
      {(entryType === "skills" || entryType === "sub_skills") && (
        <SkillView
          {...viewProps}
          isSubSkill={entryType === "sub_skills"}
          parentSkill={parentSkill}
        />
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
