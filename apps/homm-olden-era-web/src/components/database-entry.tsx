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

  // Faction items use "faction_" prefix in dict keys
  const dictKey = entryType === "factions" ? `faction_${item.id}` : item.id;
  const name = resolveDict(dict, dictKey);
  const desc = resolveDict(dict, `${dictKey}_desc`);
  const icon = item.icon as IconSprite | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = item.props as any;

  const viewProps = { name, desc, icon, props, dict, database, locale };

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
