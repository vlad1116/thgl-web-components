import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

export const chronoOdyssey = resolveAppConfig({
  name: "chrono-odyssey",
  supportedLocales: ["en"],
  appUrl: null,
  internalLinks: [
    {
      href: "/maps/Setera",
      title: "Setera Map",
      description: "Navigate Setera with our interactive maps.",
      iconName: "Map",
      // Inlined getPreviewImageUrl("chrono-odyssey", "setera"): keeps
      // middleware (which transitively imports this config) free of
      // cbor-x's dynamic eval which Edge Runtime forbids.
      bgImage: `${DATA_FORGE_CDN_URL}/chrono-odyssey/map-tiles/setera/preview.webp`,
      linkText: "Explore the Setera Map",
    },
  ],
  externalLinks: [],
  keywords: ["Bound Stones", "Resources"],
});
