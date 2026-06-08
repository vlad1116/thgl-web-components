import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

const preview = (mapId: string) =>
  `${DATA_FORGE_CDN_URL}/diablo4/map-tiles/${mapId}/preview.webp`;

export const diablo4 = resolveAppConfig({
  name: "diablo4",
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
      bgImage: preview("Sanctuary"),
    },
  ],
  externalLinks: [],
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
});
