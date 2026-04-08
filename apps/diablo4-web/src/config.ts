import { type AppConfig, getPreviewImageUrl } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "diablo4",
  title: "Diablo IV",
  domain: "diablo4",
  supportedLocales: ["en"],
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Diablo_4_Map",
  withoutLiveMode: true,
  internalLinks: [
    {
      title: "Diablo IV Map",
      description:
        "Explore Diablo 4 Interactive Maps with real-time position tracking. Find Altars of Lilith, dungeons, bosses, events, and more.",
      href: "/maps/Sanctuary",
      iconName: "Map",
      linkText: "Explore the Map",
      bgImage: getPreviewImageUrl("diablo4", "Sanctuary"),
    },
  ],
  externalLinks: [],
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 10,
      zDistance: 2,
    },
  },
  keywords: ["Dungeons", "World Events", "Strongholds", "Nightmare Dungeons"],
  topFilters: [
    "altarsOfLilith",
    "tenetOfAkarat",
    "dungeons",
    "strongholds",
    "worldBossArenas",
    "waypoints",
    "cellars",
    "sideQuests",
  ],
};
