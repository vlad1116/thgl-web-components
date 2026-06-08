import { resolveAppConfig } from "@repo/lib";

export const crimsonDesert = resolveAppConfig({
  name: "crimson-desert",
  supportedLocales: [
    "en",
    "ko",
    "ja",
    "fr",
    "de",
    "it",
    "pl",
    "pt-BR",
    "ru",
    "es",
    "tr",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: "https://www.th.gl/companion-app",
  externalLinks: [
    {
      href: "https://crimsondesert.gaming.tools/",
      title: "Database",
    },
  ],
  // No internalLinks: map cards are auto-generated from version.data.tiles
  // (Pywel + Abyss). Header "Maps" link now derives from hasMap in layout.
  keywords: [
    "Pywel",
    "Abyss Cresset",
    "Sealed Artifact",
    "Treasure Chest",
    "Stronghold",
    "Fast Travel",
    "Bonfire",
    "Mining",
    "Gathering",
    "Iron Ore",
    "Copper Ore",
    "Faction Quest",
    "Hernand",
    "Delesyia",
    "Demeniss",
  ],
  topFilters: [
    "abyss_gate",
    "treasure_box",
    "faction_quest",
    "memory_fragment",
    "bonfire",
    "camp",
    "mine_copper",
    "chest",
  ],
});
