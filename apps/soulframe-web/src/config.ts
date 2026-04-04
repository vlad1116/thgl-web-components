import { type AppConfig, getPreviewImageUrl } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
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
      bgImage: getPreviewImageUrl("soulframe", "Midrath", "2"),
      linkText: "Explore the Midrath Map",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: ["World Trees", "Shrines", "Dungeons", "Items"],
  topFilters: ["shrine", "dungeon", "world_tree"],
};
