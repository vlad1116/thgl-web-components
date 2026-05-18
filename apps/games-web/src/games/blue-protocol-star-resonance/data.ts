import { fetchDatabase, fetchDict, type DatabaseConfig } from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";
import { BPSR_SECTIONS, humanizeCategory, type BpsrSection } from "./sections";

const APP_NAME = "blue-protocol-star-resonance";

/**
 * BPSR `props` shape used by all 3 DB sections. Some fields are
 * section-specific (entryCount on books, phaseOrder on story) and
 * surface only where applicable.
 */
export type BpsrItemProps = {
  title: string;
  content: string;
  description?: string;
  icon?: string;
  quality?: number;
  entryCount?: number;
  phaseOrder?: number;
  episode?: number | string;
  dictionaryType?: number | string;
  titlePic?: string;
  unlock?: number | string;
};

export type BpsrItem = {
  id: string;
  type: string;
  /** Localized category label (e.g. "Historical Events"). */
  category: string;
  props: BpsrItemProps;
};

/**
 * Fetch all items belonging to a BPSR section, keyed by category. Each
 * category is a `database.json` row whose `type` starts with the
 * section's `typePrefix`. Categories are sorted alphabetically by their
 * English label so the sidebar order stays stable across deploys.
 */
export async function loadSection(
  section: BpsrSection,
  locale = "en",
): Promise<{ category: { type: string; label: string }; items: BpsrItem[] }[]> {
  const [database, enDict, localeDict] = await Promise.all([
    fetchDatabase(APP_NAME),
    fetchDict(APP_NAME),
    locale === "en"
      ? Promise.resolve(null as Record<string, string> | null)
      : fetchDict(APP_NAME, locale),
  ]);

  const dict = localeDict ?? enDict;

  const matching = database
    .filter((cat) => cat.type.startsWith(section.typePrefix))
    .sort((a, b) => {
      const la =
        resolveDict(enDict, a.type) !== a.type
          ? resolveDict(enDict, a.type)
          : humanizeCategory(a.type, section.typePrefix);
      const lb =
        resolveDict(enDict, b.type) !== b.type
          ? resolveDict(enDict, b.type)
          : humanizeCategory(b.type, section.typePrefix);
      return la.localeCompare(lb, undefined, { numeric: true });
    });

  return matching.map((cat) => {
    const label =
      resolveDict(dict, cat.type) !== cat.type
        ? resolveDict(dict, cat.type)
        : humanizeCategory(cat.type, section.typePrefix);

    const items: BpsrItem[] = cat.items.map((i) => ({
      id: i.id,
      type: cat.type,
      category: label,
      props: i.props as BpsrItemProps,
    }));

    return { category: { type: cat.type, label }, items };
  });
}

/** Lookup an item by id across every category in a section. */
export async function findEntry(
  section: BpsrSection,
  id: string,
  locale = "en",
): Promise<{ item: BpsrItem; neighbors: { prev?: BpsrItem; next?: BpsrItem }; siblings: BpsrItem[] } | null> {
  const sections = await loadSection(section, locale);
  for (const { items } of sections) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) continue;
    const item = items[idx];
    return {
      item,
      neighbors: { prev: items[idx - 1], next: items[idx + 1] },
      // Up to 5 other entries in the same category (excluding the current one)
      siblings: items.filter((i) => i.id !== id).slice(0, 5),
    };
  }
  return null;
}

/** Total item count across all categories of a section (for the hero). */
export async function countSection(section: BpsrSection): Promise<number> {
  const grouped = await loadSection(section);
  return grouped.reduce((s, g) => s + g.items.length, 0);
}

/** All BPSR DB items as a flat list (for /api/db/search-index). */
export async function loadAllItems(): Promise<
  Array<{
    id: string;
    section: BpsrSection["segment"];
    sectionLabel: string;
    type: string;
    category: string;
    title: string;
  }>
> {
  const database: DatabaseConfig = await fetchDatabase(APP_NAME);
  const enDict = await fetchDict(APP_NAME);
  const out: Array<{
    id: string;
    section: BpsrSection["segment"];
    sectionLabel: string;
    type: string;
    category: string;
    title: string;
  }> = [];

  for (const cat of database) {
    if (cat.type.startsWith("_")) continue;
    const sec = Object.values(BPSR_SECTIONS).find((s) =>
      cat.type.startsWith(s.typePrefix),
    );
    if (!sec) continue;
    const category =
      resolveDict(enDict, cat.type) !== cat.type
        ? resolveDict(enDict, cat.type)
        : humanizeCategory(cat.type, sec.typePrefix);
    for (const item of cat.items) {
      const props = item.props as BpsrItemProps;
      out.push({
        id: item.id,
        section: sec.segment,
        sectionLabel: sec.label,
        type: cat.type,
        category,
        title: props.title ?? item.id,
      });
    }
  }
  return out;
}
