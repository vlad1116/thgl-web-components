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
  internalLinks: [
    {
      title: "Crimson Desert Map",
      description:
        "Navigate the Continent of Pywel with our interactive map featuring Abyss Cressets, treasures, shops, gathering nodes, and more.",
      href: "/maps/Continent%20of%20Pywel",
      iconName: "Map",
      // Inlined getPreviewImageUrl("crimson-desert", "OpenWorld")
      bgImage:
        "https://cdn.th.gl/crimson-desert/map-tiles/OpenWorld/preview.webp",
      linkText: "Explore the Map",
    },
  ],
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
