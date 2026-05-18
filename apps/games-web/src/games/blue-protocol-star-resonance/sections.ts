/**
 * BPSR DB section metadata.
 *
 * Three sections (dictionary, reading-books, story) each gather a set of
 * underlying `database.json` categories that share a type prefix
 * (`dictionary_*`, `reading_books_*`, `story_episode_*`). Configuration
 * lives here so the listing pages, detail pages, sidebar builder, and
 * sitemap stay in sync.
 */

export type BpsrSection = {
  /** URL segment under /db/ */
  segment: "dictionary" | "reading-books" | "story";
  /** Display label rendered in breadcrumbs and headings */
  label: string;
  /** One-sentence description rendered under the hero */
  tagline: string;
  /** Glyph rendered on the section landing hero */
  icon: string;
  /** Tailwind colour classes used by the category-pill accent */
  accent: string;
  /** Match every `database` category whose type starts with this prefix */
  typePrefix: string;
  /** SEO keywords appended to the standard config.keywords */
  keywords: string[];
};

export const BPSR_SECTIONS: Record<string, BpsrSection> = {
  dictionary: {
    segment: "dictionary",
    label: "Lore Dictionary",
    tagline:
      "An encyclopedia of lore, concepts, and historical events in Blue Protocol: Star Resonance.",
    icon: "📚",
    accent: "text-cyan-400 border-cyan-800/50 bg-cyan-900/20",
    typePrefix: "dictionary_",
    keywords: ["Lore Dictionary", "Encyclopedia", "World Lore", "History", "Concepts"],
  },
  "reading-books": {
    segment: "reading-books",
    label: "Reading Books",
    tagline:
      "A comprehensive collection of books, letters, posters, and records found throughout Blue Protocol: Star Resonance.",
    icon: "📖",
    accent: "text-amber-400 border-amber-800/50 bg-amber-900/20",
    typePrefix: "reading_books_",
    keywords: ["Reading Books", "Lore Books", "Travel Guides", "Letters", "Collectibles"],
  },
  story: {
    segment: "story",
    label: "Story Episodes",
    tagline:
      "Follow the epic story of Blue Protocol: Star Resonance through detailed episode summaries and quest phases.",
    icon: "✦",
    accent: "text-indigo-400 border-indigo-800/50 bg-indigo-900/20",
    typePrefix: "story_episode_",
    keywords: ["Story Episodes", "Main Story", "Quest Phases", "Lore", "Campaign"],
  },
};

/**
 * Humanise the trailing portion of a category type for display in the
 * sidebar / breadcrumb (e.g. `dictionary_historical_events` →
 * `Historical Events`). Used when the dict lookup for the full type key
 * returns nothing.
 */
export function humanizeCategory(catType: string, typePrefix: string): string {
  const trimmed = catType.startsWith(typePrefix)
    ? catType.slice(typePrefix.length)
    : catType;
  return trimmed
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
