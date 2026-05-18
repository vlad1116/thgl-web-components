import { localizePath } from "@repo/lib";
import { loadAllItems } from "./data";

/**
 * Build the header-search index for BPSR. Unlike homm-olden-era, BPSR
 * entries don't carry icons (their `icon` field references an item-icon
 * sprite that isn't part of the header-search UX yet) — the dropdown
 * shows the type badge + category instead.
 *
 * `type` is the *root* type (not the category-specific
 * `dictionary_concepts`) so the dropdown badge can use the simple
 * typeLabels/typeColors maps from appConfig.db.
 */
export async function buildBpsrSearchIndex(locale: string) {
  const all = await loadAllItems();
  const entries = all.map((entry) => ({
    id: entry.id,
    name: entry.title,
    // Map the BPSR-specific category type (e.g. `dictionary_concepts`) to
    // the section's umbrella key so the typeLabels/typeColors lookup in
    // the dropdown returns a hit ("Dictionary", "Book", "Story").
    type:
      entry.section === "reading-books"
        ? "reading_books"
        : entry.section === "story"
          ? "story_episode"
          : "dictionary",
    section: entry.section,
    href: localizePath(`/db/${entry.section}/${entry.id}`, locale),
    /** Category label (e.g. "Historical Events") used as dropdown subtitle. */
    subtitle: entry.category,
  }));

  // No sprite atlas for BPSR yet; clients should treat empty iconsUrl as
  // "no icons available" and fall back to text-only rows.
  return { entries, iconsUrl: "" };
}
