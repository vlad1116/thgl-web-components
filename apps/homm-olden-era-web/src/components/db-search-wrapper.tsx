import {
  fetchDatabase,
  fetchDict,
  fetchVersion,
  getIconsUrl,
  localizePath,
} from "@repo/lib";
import { APP_CONFIG } from "@/config";
import { DbSearch } from "./db-search";

const SECTION_MAP: Record<string, string> = {
  units: "units",
  heroes: "heroes",
  spells: "spells",
  items: "items",
  item_sets: "items",
  skills: "skills",
  sub_skills: "skills",
  specializations: "factions",
  factions: "factions",
  faction_laws: "factions",
  buildings: "buildings",
  map_objects: "map-objects",
};

function resolveDict(dict: Record<string, string>, key: string): string {
  const value = dict[key];
  if (!value) return key;
  if (value[0] === "@") return dict[value] ?? value;
  return value;
}

export async function DbSearchWrapper({ locale = "en" }: { locale?: string }) {
  const [database, dict, version] = await Promise.all([
    fetchDatabase(APP_CONFIG.name),
    fetchDict(APP_CONFIG.name, locale),
    fetchVersion(APP_CONFIG.name),
  ]);

  const iconsUrl = getIconsUrl(
    APP_CONFIG.name,
    "icons.webp",
    version.more.icons,
  );

  const entries = database.flatMap((category) =>
    category.items.map((item) => {
      const section = SECTION_MAP[category.type] ?? category.type;
      const dictKey = category.type === "factions" ? `faction_${item.id}` : item.id;
      const icon =
        item.icon && typeof item.icon === "object"
          ? (item.icon as {
              url: string;
              x: number;
              y: number;
              width: number;
              height: number;
            })
          : undefined;

      return {
        id: item.id,
        name: resolveDict(dict, dictKey),
        type: category.type,
        section,
        href: localizePath(`/db/${section}/${item.id}`, locale),
        icon,
      };
    }),
  );

  return <DbSearch entries={entries} iconsUrl={iconsUrl} />;
}
