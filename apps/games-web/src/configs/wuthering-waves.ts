import { type AppConfig } from "@repo/lib";

export const wutheringWaves: AppConfig = {
  name: "wuthering-waves",
  title: "Wuthering Waves",
  domain: "wuthering",
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    clusterPrecision: 50,
    zPos: {
      xyMaxDistance: 15000,
      zDistance: 400,
    },
  },
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
};
