import { type AppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

export const soulmask: AppConfig = {
  name: "soulmask",
  title: "Soulmask",
  domain: "soulmask",
  supportedLocales: [
    "de",
    "en",
    "es",
    "fr",
    "ja",
    "ko",
    "pt-BR",
    "ru",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Cloud Mist Forest Map",
      description:
        "Navigate Soulmask's Cloud Mist Forest with our interactive map.",
      href: "/maps/Cloud%20Mist%20Forest",
      iconName: "Map",
      // Inlined getPreviewImageUrl("soulmask", "Level01")
      bgImage: `${DATA_FORGE_CDN_URL}/soulmask/map-tiles/Level01/preview.webp`,
      linkText: "Explore the Cloud Mist Forest Map",
    },
    {
      title: "Shifting Sands Map",
      description:
        "Navigate Soulmask's Shifting Sands with our interactive map.",
      href: "/maps/Shifting%20Sands",
      iconName: "Map",
      // Inlined getPreviewImageUrl("soulmask", "DLC_Level01")
      bgImage: `${DATA_FORGE_CDN_URL}/soulmask/map-tiles/DLC_Level01/preview.webp`,
      linkText: "Explore the Shifting Sands Map",
    },
  ],
  promoLinks: [],
  externalLinks: [
    {
      href: "https://soulmask.gaming.tools/",
      title: "Database",
    },
  ],
  keywords: [
    "Chests",
    "Dungeons",
    "Teleporters",
    "Resources",
    "Animals",
    "NPCs",
  ],
  topFilters: ["teleporter", "dungeon", "chest_mysterious", "boss_altar"],
};
