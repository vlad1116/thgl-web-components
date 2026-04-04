import { games, type AppConfig, getPreviewImageUrl } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  game: games.find((g) => g.id === "palworld")!,
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
  internalLinks: [
    {
      href: "/maps/Palpagos%20Island",
      title: "Palpagos Island Map",
      description: "Navigate Palpagos Island with our interactive maps.",
      iconName: "Map",
      bgImage: getPreviewImageUrl("palworld", "default"),
      linkText: "Explore the Palpagos Island Map",
    },
  ],
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
