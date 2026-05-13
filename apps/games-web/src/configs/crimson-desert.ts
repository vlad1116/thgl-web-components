import { type AppConfig } from "@repo/lib";

export const crimsonDesert: AppConfig = {
  name: "crimson-desert",
  title: "Crimson Desert",
  domain: "crimsondesert",
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
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    clusterPrecision: 10,
    zPos: {
      xyMaxDistance: 100,
      zDistance: 5,
    },
  },
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
};
