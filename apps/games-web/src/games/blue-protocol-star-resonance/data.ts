import {
  findEntry as findEntryGeneric,
  loadAllWikiItems,
  loadSection as loadSectionGeneric,
  type WikiSection,
} from "@/lib/db/wiki";
import { BPSR_SECTIONS } from "./sections";

const APP_NAME = "blue-protocol-star-resonance";

/** BPSR-specific item props the generic WikiItemProps doesn't enumerate. */
export type BpsrItemProps = {
  title: string;
  content: string;
  description?: string;
  icon?: string;
  entryCount?: number;
  phaseOrder?: number;
  episode?: number | string;
  dictionaryType?: number | string;
  titlePic?: string;
  unlock?: number | string;
};

export function loadSection(section: WikiSection, locale = "en") {
  return loadSectionGeneric(APP_NAME, section, locale);
}

export function findEntry(section: WikiSection, id: string, locale = "en") {
  return findEntryGeneric(APP_NAME, section, id, locale);
}

/** Flat item list for the header search index. */
export function loadAllItems() {
  return loadAllWikiItems(APP_NAME, Object.values(BPSR_SECTIONS));
}
