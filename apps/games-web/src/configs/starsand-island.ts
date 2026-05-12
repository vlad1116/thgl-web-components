import { type AppConfig } from "@repo/lib";

export const starsandIsland: AppConfig = {
  name: "starsand-island",
  title: "Starsand Island",
  domain: "starsandisland",
  supportedLocales: ["en", "ja", "zh-CN", "zh-TW"],
  appUrl: "https://www.th.gl/companion-app",
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 100,
      zDistance: 5,
    },
  },
  internalLinks: [
    {
      title: "Starsand Island Map",
      description:
        "Navigate Starsand Island with our interactive map featuring resources, shops, fishing spots, and more.",
      href: "/maps/Starsand%20Island",
      iconName: "Map",
      // Inlined getPreviewImageUrl("starsand-island", "StarSandIsland")
      bgImage:
        "https://cdn.th.gl/starsand-island/map-tiles/StarSandIsland/preview.webp",
      linkText: "Explore the Island Map",
    },
    {
      title: "Moonlit Forest Map",
      description:
        "Explore the Moonlit Forest cave with campsites, chests, gravecrystals, and relics.",
      href: "/maps/Moonlit%20Forest",
      iconName: "Map",
      // Inlined getPreviewImageUrl("starsand-island", "MineCave_MainLand")
      bgImage:
        "https://cdn.th.gl/starsand-island/map-tiles/MineCave_MainLand/preview.webp",
      linkText: "Explore the Moonlit Forest Map",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Treasure Chests",
    "Campsites",
    "Gravecrystals",
    "Fishing Spots",
    "Shops",
    "Resources",
    "Moonlit Forest",
  ],
  topFilters: ["chest_island", "campsite", "elf_stone"],
};
