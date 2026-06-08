import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

export const starsandIsland = resolveAppConfig({
  name: "starsand-island",
  supportedLocales: ["en", "ja", "zh-CN", "zh-TW"],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Starsand Island Map",
      description:
        "Navigate Starsand Island with our interactive map featuring resources, shops, fishing spots, and more.",
      href: "/maps/Starsand%20Island",
      iconName: "Map",
      // Inlined getPreviewImageUrl("starsand-island", "StarSandIsland")
      bgImage:
        `${DATA_FORGE_CDN_URL}/starsand-island/map-tiles/StarSandIsland/preview.webp`,
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
        `${DATA_FORGE_CDN_URL}/starsand-island/map-tiles/MineCave_MainLand/preview.webp`,
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
});
