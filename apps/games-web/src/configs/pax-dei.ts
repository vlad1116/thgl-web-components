import { resolveAppConfig } from "@repo/lib";

export const paxDei = resolveAppConfig({
  name: "pax-dei",
  supportedLocales: ["en"],
  // Pax Dei companion app was denied by the publisher (see memory) — website
  // only, no overlay / live mode.
  appUrl: null,
  withoutLiveMode: true,
  externalLinks: [
    { href: "https://paxdei.gaming.tools?ref=thgl", title: "Database" },
  ],
  keywords: ["Gateways", "Resources"],
});
