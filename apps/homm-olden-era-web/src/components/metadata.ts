import { type Metadata } from "next";
import { fetchDatabase, fetchDict, getMetadataAlternates } from "@repo/lib";
import { APP_CONFIG } from "@/config";
import { resolveDict } from "@/components/resolve-dict";

const GAME_TITLE = "Heroes of Might & Magic: Olden Era";

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
    openGraph: { title, description, url: canonical },
  };
}

/** Generate metadata for a category listing page (e.g. /db/units) */
export async function generateCategoryMetadata(
  locale: string,
  section: string,
): Promise<Metadata> {
  const dict = await fetchDict(APP_CONFIG.name, locale);
  const sectionLabel = resolveDict(dict, section);
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
    openGraph: { title, description, url: canonical },
  };
}

/** Generate metadata for a detail page (e.g. /db/units/angel) */
export async function generateEntryMetadata(
  locale: string,
  section: string,
  id: string,
): Promise<Metadata> {
  const dict = await fetchDict(APP_CONFIG.name, locale);

  // Resolve name based on section type
  let entryName: string;
  if (section === "factions") {
    const factionLabel = resolveDict(dict, `faction_${id}`);
    entryName = factionLabel !== `faction_${id}` ? factionLabel : resolveDict(dict, id);
  } else {
    entryName = resolveDict(dict, id);
  }

  const sectionLabel = resolveDict(dict, section);
  const desc = resolveDict(dict, section === "factions" ? `faction_${id}_desc` : `${id}_desc`);
  const hasDesc = desc && desc !== `${id}_desc` && desc !== `faction_${id}_desc` && desc !== id;

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
    openGraph: { title, description, url: canonical },
  };
}
