import type { MetadataRoute } from "next";
import {
  fetchDatabase,
  type DatabaseConfig,
  DEFAULT_LOCALE,
  localizePath,
} from "@repo/lib";
import { APP_CONFIG } from "@/config";

const ENTRIES_PER_CHUNK = 150;

/** Map database entity types to their URL section */
const TYPE_TO_SECTION: Record<string, string> = {
  units: "units",
  heroes: "heroes",
  spells: "spells",
  items: "artifacts",
  skills: "skills",
  sub_skills: "skills",
  factions: "factions",
  specializations: "factions",
  faction_laws: "factions",
  buildings: "buildings",
  map_objects: "map-objects",
};

/** Types that do not have detail pages */
const SKIP_TYPES = new Set(["item_sets"]);

/** Types that support group pages (section → type(s) to scan for groupIds) */
const GROUP_PAGE_TYPES: Record<string, string[]> = {
  units: ["units"],
  heroes: ["heroes"],
  spells: ["spells"],
  artifacts: ["items"],
  buildings: ["buildings"],
  "map-objects": ["map_objects"],
};

function collectDatabaseEntries(database: DatabaseConfig) {
  const entries: { section: string; id: string }[] = [];
  for (const group of database) {
    if (SKIP_TYPES.has(group.type)) continue;
    const section = TYPE_TO_SECTION[group.type];
    if (!section) continue;
    for (const item of group.items) {
      entries.push({ section, id: item.id });
    }
  }
  return entries;
}

function collectGroupPages(database: DatabaseConfig) {
  const entries: { section: string; groupId: string }[] = [];
  for (const [section, types] of Object.entries(GROUP_PAGE_TYPES)) {
    const seen = new Set<string>();
    for (const group of database) {
      if (!types.includes(group.type)) continue;
      for (const item of group.items) {
        const gid = item.groupId;
        if (gid && !seen.has(gid)) {
          seen.add(gid);
          entries.push({ section, groupId: gid });
        }
      }
    }
  }
  return entries;
}

export async function generateSitemaps() {
  const database = await fetchDatabase(APP_CONFIG.name);
  const dbEntries = collectDatabaseEntries(database);
  const dbChunks = Math.ceil(dbEntries.length / ENTRIES_PER_CHUNK);
  const total = 1 + dbChunks;
  return Array.from({ length: total }, (_, i) => ({ id: i }));
}

export default async function sitemap(
  props?: { id: Promise<string> } | undefined,
): Promise<MetadataRoute.Sitemap> {
  const id = props?.id ? Number(await props.id) : 0;

  const baseUrl = `https://${APP_CONFIG.domain}.th.gl`;
  const locales = APP_CONFIG.supportedLocales;
  const hasLocales = locales.length > 1;
  const now = new Date();

  const getAlternates = (
    path: string,
  ): MetadataRoute.Sitemap[number]["alternates"] | undefined => {
    if (!hasLocales) return undefined;
    const canonical = `${baseUrl}${path}`;
    const languages = Object.fromEntries([
      ...locales.map((locale) => [
        locale,
        locale === DEFAULT_LOCALE
          ? canonical
          : `${baseUrl}${localizePath(path, locale)}`,
      ]),
      ["x-default", canonical],
    ]);
    return { languages };
  };

  const makeEntry = (
    path: string,
    opts: {
      changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
      priority: number;
    },
  ): MetadataRoute.Sitemap[number] => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: getAlternates(path),
  });

  if (id === 0) {
    // Core pages: home + db listing pages
    const entries: MetadataRoute.Sitemap = [];

    entries.push(
      makeEntry("/", { changeFrequency: "daily", priority: 1 }),
    );

    for (const link of APP_CONFIG.internalLinks || []) {
      entries.push(
        makeEntry(link.href, { changeFrequency: "daily", priority: 0.8 }),
      );
    }

    // Group pages (e.g., /db/spells/day, /db/units/human)
    const database = await fetchDatabase(APP_CONFIG.name);
    for (const { section, groupId } of collectGroupPages(database)) {
      entries.push(
        makeEntry(`/db/${section}/${encodeURIComponent(groupId)}`, {
          changeFrequency: "weekly",
          priority: 0.7,
        }),
      );
    }

    // Item Sets page
    entries.push(
      makeEntry("/db/artifacts/sets", { changeFrequency: "weekly", priority: 0.7 }),
    );

    return entries;
  }

  // Database detail page chunks
  const database = await fetchDatabase(APP_CONFIG.name);
  const dbEntries = collectDatabaseEntries(database);
  const chunkIndex = id - 1;
  const start = chunkIndex * ENTRIES_PER_CHUNK;
  const chunk = dbEntries.slice(start, start + ENTRIES_PER_CHUNK);

  return chunk.map(({ section, id: entityId }) =>
    makeEntry(`/db/${section}/${encodeURIComponent(entityId)}`, {
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  );
}
