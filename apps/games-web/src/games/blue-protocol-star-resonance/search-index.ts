import { localizePath } from "@repo/lib";
import { loadAllItems } from "./data";

/**
 * Build the header-search index for BPSR. Unlike homm-olden-era, BPSR
 * entries don't carry icons (their `icon` field references an
 * item-icon sprite that isn't part of the header-search UX yet) —
 * the dropdown shows the type badge + category instead.
 *
 * `type` here is the umbrella section key (not the category-specific
 * `dictionary_concepts`) so the dropdown badge can use the simple
 * `typeLabels`/`typeColors` maps from `appConfig.db`.
 */
export async function buildBpsrSearchIndex(locale: string) {
  const all = await loadAllItems();
  const entries = all.map((entry) => {
    // entry.href is the section URL stem like "/db/dictionary"
    const sectionKey = entry.href.replace(/^\/db\//, "");
    return {
      id: entry.id,
      name: entry.title,
      type:
        sectionKey === "reading-books"
          ? "reading_books"
          : sectionKey === "story"
            ? "story_episode"
            : "dictionary",
      section: sectionKey,
      href: localizePath(`${entry.href}/${entry.id}`, locale),
      /** Category label (e.g. "Historical Events") used as dropdown subtitle. */
      subtitle: entry.category,
    };
  });

  // No sprite atlas for BPSR yet; clients should treat empty iconsUrl as
  // "no icons available" and fall back to text-only rows.
  return { entries, iconsUrl: "" };
}
