import { type AppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

export const grounded2: AppConfig = {
  name: "grounded2",
  title: "Grounded 2",
  domain: "grounded2",
  supportedLocales: ["en", "de", "es", "es-MX", "fr", "it", "zh-CN"],
  appUrl: null,
  internalLinks: [
    {
      title: "Brookhollow Park Map",
      description:
        "Navigate Grounded 2's Brookhollow Park with our interactive maps.",
      href: "/maps/Brookhollow%20Park",
      iconName: "Map",
      // Inlined getPreviewImageUrl("grounded2", "brookhollow-park")
      bgImage:
        `${DATA_FORGE_CDN_URL}/grounded2/map-tiles/brookhollow-park/preview.webp`,
      linkText: "Explore the Brookhollow Park Map",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: ["Wonders", "Ominent Facilities", "Resources"],
};
