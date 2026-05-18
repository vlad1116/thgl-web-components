import {
  findEntry as findEntryGeneric,
  loadAllWikiItems,
  loadSection as loadSectionGeneric,
  type WikiSection,
} from "@/lib/db/wiki";
import { ONCE_HUMAN_SECTIONS } from "./sections";

const APP_NAME = "once-human";

/**
 * Once-Human remnants/regional-records props shape. The `title*` fields
 * carry the author / location / date for remnants (the entries are
 * authored as in-game letters and journals).
 */
export type OnceHumanItemProps = {
  title: string;
  content: string;
  description?: string;
  title1?: string;
  title2?: string;
  title3?: string;
  /**
   * Optional in-world [x, y] coordinate. Echoes-of-stardust entries
   * ship coordinates so the detail page can pin them on the map; the
   * old once-human-web rendered the map and the migration restores
   * the feature parity.
   */
  location?: [number, number] | null;
};

export function loadSection(section: WikiSection, locale = "en") {
  return loadSectionGeneric(APP_NAME, section, locale);
}

export function findEntry(section: WikiSection, id: string, locale = "en") {
  return findEntryGeneric(APP_NAME, section, id, locale);
}

/** Flat item list for the header search index. */
export function loadAllWikiItemsForOnceHuman() {
  return loadAllWikiItems(APP_NAME, Object.values(ONCE_HUMAN_SECTIONS));
}
