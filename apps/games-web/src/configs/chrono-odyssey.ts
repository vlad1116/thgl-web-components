import { type AppConfig } from "@repo/lib";

export const chronoOdyssey: AppConfig = {
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
      // Inlined getPreviewImageUrl("chrono-odyssey", "setera"): keeps
      // middleware (which transitively imports this config) free of
      // cbor-x's dynamic eval which Edge Runtime forbids.
      bgImage: "https://cdn.th.gl/chrono-odyssey/map-tiles/setera/preview.webp",
      linkText: "Explore the Setera Map",
    },
  ],
  externalLinks: [],
  keywords: ["Bound Stones", "Resources"],
};
