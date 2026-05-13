import { type AppConfig } from "@repo/lib";

export const paxDei: AppConfig = {
  name: "pax-dei",
  title: "Pax Dei",
  domain: "paxdei",
  supportedLocales: ["en"],
  // Pax Dei companion app was denied by the publisher (see memory) — website
  // only, no overlay / live mode.
  appUrl: null,
  withoutLiveMode: true,
  externalLinks: [
    { href: "https://paxdei.gaming.tools?ref=thgl", title: "Database" },
  ],
  markerOptions: {
    imageSprite: true,
    radius: 6,
    playerIcon: "player.webp",
  },
  keywords: ["Gateways", "Resources"],
};
