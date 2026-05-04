import { type Metadata } from "next";
import { fetchDatabase, fetchDict, getMetadataAlternates } from "@repo/lib";
import { APP_CONFIG } from "@/config";
import { resolveDict } from "@/components/resolve-dict";

/** Resolve {0}, {1}, ... placeholders in description text using numeric bonus params */
function resolveTemplatePlaceholders(
  text: string,
  bonuses?: { type: string; params: (string | number)[] }[],
): string {
  if (!text.includes("{") || !bonuses?.length) return text;
  const values: string[] = [];
  for (const b of bonuses) {
    for (const p of b.params) {
      const n = parseFloat(String(p));
      if (!isNaN(n) && n !== 0 && String(p) !== "true" && String(p) !== "false") {
        const abs = Math.abs(n);
        values.push(abs > 0 && abs < 1 ? `${Math.round(abs * 100)}` : String(abs));
      }
    }
    if ((b as any).upgrade) {
      const inc = (b as any).upgrade.increment;
      if (typeof inc === "number" && inc !== 0) {
        const abs = Math.abs(inc);
        values.push(abs > 0 && abs < 1 ? `${Math.round(abs * 100)}` : String(abs));
      }
      if ((b as any).upgrade.levelStep) values.push(String((b as any).upgrade.levelStep));
    }
  }
  return text.replace(/\{(\d+)\}/g, (_, idx) => values[parseInt(idx)] ?? "");
}

const GAME_TITLE = "Heroes of Might & Magic: Olden Era";
const OG_IMAGE = {
  url: "https://oldenera.th.gl/opengraph-image.jpg",
  width: 1200,
  height: 630,
  alt: GAME_TITLE,
};

/** Generate metadata for the homepage */
export async function generateHomeMetadata(
  locale: string,
): Promise<Metadata> {
  const title = `${GAME_TITLE} Database | The Hidden Gaming Lair`;
  const description = `Complete database for ${GAME_TITLE} |browse units, heroes, spells, artifacts, skills, and factions with stats, abilities, and cross-references.`;
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/",
    locale,
    APP_CONFIG.supportedLocales,
  );

  return {
    title,
    description,
    keywords: APP_CONFIG.keywords,
    alternates: { canonical, languages: languageAlternates },
    openGraph: { title, description, url: canonical, images: [OG_IMAGE] },
  };
}

/** Generate metadata for a category listing page (e.g. /db/units) */
export async function generateCategoryMetadata(
  locale: string,
  section: string,
  labelOverride?: string,
): Promise<Metadata> {
  const dict = await fetchDict(APP_CONFIG.name, locale);
  const sectionLabel = labelOverride ?? resolveDict(dict, section);
  const title = `${sectionLabel} | ${GAME_TITLE}`;
  const description = `Browse all ${sectionLabel.toLowerCase()} in ${GAME_TITLE}. Complete stats, abilities, and detailed information.`;
  const path = `/db/${section}`;
  const { canonical, languageAlternates } = getMetadataAlternates(
    path,
    locale,
    APP_CONFIG.supportedLocales,
  );

  return {
    title,
    description,
    keywords: [...APP_CONFIG.keywords, sectionLabel],
    alternates: { canonical, languages: languageAlternates },
    openGraph: { title, description, url: canonical, images: [OG_IMAGE] },
  };
}

/** Generate metadata for a group page (e.g. /db/spells/day) */
export async function generateGroupMetadata(
  locale: string,
  section: string,
  groupId: string,
  groupLabelPrefix: string,
  sectionDictKey: string,
): Promise<Metadata> {
  const dict = await fetchDict(APP_CONFIG.name, locale);
  const sectionLabel = resolveDict(dict, sectionDictKey);
  const groupLabel = groupLabelPrefix
    ? (dict[`${groupLabelPrefix}${groupId}`] ?? groupId)
    : (dict[groupId] ?? groupId);
  // Follow @-references
  const resolved = groupLabel.startsWith("@") && dict[groupLabel] ? dict[groupLabel] : groupLabel;

  const title = resolved === sectionLabel
    ? `${resolved} | ${GAME_TITLE}`
    : `${resolved} ${sectionLabel} | ${GAME_TITLE}`;
  const description = `Browse all ${resolved.toLowerCase()} in ${GAME_TITLE}. Complete stats, abilities, and detailed information.`;
  const path = `/db/${section}/${groupId}`;
  const { canonical, languageAlternates } = getMetadataAlternates(
    path,
    locale,
    APP_CONFIG.supportedLocales,
  );

  return {
    title,
    description,
    keywords: [...APP_CONFIG.keywords, resolved, sectionLabel],
    alternates: { canonical, languages: languageAlternates },
    openGraph: { title, description, url: canonical, images: [OG_IMAGE] },
  };
}

/** Generate metadata for a detail page (e.g. /db/units/angel) */
export async function generateEntryMetadata(
  locale: string,
  section: string,
  id: string,
): Promise<Metadata> {
  const [dict, database] = await Promise.all([
    fetchDict(APP_CONFIG.name, locale),
    fetchDatabase(APP_CONFIG.name),
  ]);

  // Resolve name based on section type
  let entryName: string;
  if (section === "factions") {
    const factionLabel = resolveDict(dict, `faction_${id}`);
    entryName = factionLabel !== `faction_${id}` ? factionLabel : resolveDict(dict, id);
  } else {
    entryName = resolveDict(dict, id);
  }

  // Find item in database for bonus params
  let itemProps: any;
  for (const cat of database) {
    const found = cat.items.find((i) => i.id === id);
    if (found) { itemProps = found.props; break; }
  }

  const sectionLabel = resolveDict(dict, section);
  let desc = resolveDict(dict, section === "factions" ? `faction_${id}_desc` : `${id}_desc`);
  const hasDesc = desc && desc !== `${id}_desc` && desc !== `faction_${id}_desc` && desc !== id;

  // Resolve {0}, {1} placeholders from bonus params
  if (hasDesc) {
    desc = resolveTemplatePlaceholders(desc, itemProps?.bonuses ?? itemProps?.levels?.[0]?.bonuses);
  }

  const title = `${entryName} | ${sectionLabel} | ${GAME_TITLE}`;
  const description = hasDesc
    ? desc.substring(0, 160)
    : `${entryName} details in ${GAME_TITLE}. View stats, abilities, and related information.`;

  const path = `/db/${section}/${id}`;
  const { canonical, languageAlternates } = getMetadataAlternates(
    path,
    locale,
    APP_CONFIG.supportedLocales,
  );

  return {
    title,
    description,
    keywords: [...APP_CONFIG.keywords, entryName, sectionLabel],
    alternates: { canonical, languages: languageAlternates },
    openGraph: { title, description, url: canonical, images: [OG_IMAGE] },
  };
}
