import { type AppConfig } from "@repo/lib";

export const palworld: AppConfig = {
  name: "palworld",
  title: "Palworld",
  domain: "palworld",
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 15000,
      zDistance: 400,
    },
  },
  // No internalLinks: Palpagos Island and any future map auto-generate from
  // version.data.tiles. multiTenantMapPage looks up game-specific
  // additionalFilters/additionalTooltip via the games registry by name.
  externalLinks: [],
  keywords: ["Tides of Terraria", "Feybreak", "Predator & Alpha Pals"],
  topFilters: [
    "lifmunk_effigy",
    "dungeon_random",
    "coal",
    "junk_yard",
    "boss_thunderbird",
    "predator_sifudog",
    "fasttravel",
    "skill_fruit",
  ],
};
