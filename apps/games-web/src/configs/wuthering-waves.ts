import { resolveAppConfig } from "@repo/lib";

export const wutheringWaves = resolveAppConfig({
  name: "wuthering-waves",
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  // No internalLinks: home page auto-generates a card for each map in
  // version.data.tiles (Overworld, Lahai-Roi, Honami City, etc.).
  externalLinks: [],
  keywords: [
    "Echoes",
    "Waveplate Activities",
    "Tidal Heritage",
    "Collectibles",
  ],
  topFilters: ["Treasure005", "branch3.0_693_Treasure_3_4"],
});
