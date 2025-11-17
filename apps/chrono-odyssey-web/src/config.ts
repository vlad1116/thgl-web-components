import { type AppConfig, getPreviewImageUrl } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "chrono-odyssey",
  title: "Chrono Odyssey",
  domain: "chronoodyssey",
  supportedLocales: ["en"],
  appUrl: null,
  internalLinks: [
    {
      href: "/maps/Setera",
      title: "Setera Map",
      description: "Navigate Setera with our interactive maps.",
      iconName: "Map",
      bgImage: getPreviewImageUrl("chrono-odyssey", "setera"),
      linkText: "Explore the Setera Map",
    },
  ],
  externalLinks: [],
  keywords: ["Bound Stones", "Resources"],
};
