import { type AppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

export const soulframe: AppConfig = {
  name: "soulframe",
  title: "Soulframe",
  domain: "soulframe",
  supportedLocales: ["en"],
  appUrl: null,
  internalLinks: [
    {
      title: "Midrath Map",
      description: "Navigate Soulframe's Midrath with our interactive maps.",
      href: "/maps/Midrath",
      iconName: "Map",
      // Inlined getPreviewImageUrl("soulframe", "Midrath", "2")
      bgImage: `${DATA_FORGE_CDN_URL}/soulframe/map-tiles/Midrath/preview.webp?v=2`,
      linkText: "Explore the Midrath Map",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: ["World Trees", "Shrines", "Dungeons", "Items"],
  topFilters: ["shrine", "dungeon", "world_tree"],
};
