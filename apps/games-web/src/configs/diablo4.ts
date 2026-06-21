import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

const preview = (mapId: string) =>
  `${DATA_FORGE_CDN_URL}/diablo4/map-tiles/${mapId}/preview.webp`;

export const diablo4 = resolveAppConfig({
  name: "diablo4",
  appUrl: "https://arpg-life.ru/d4-map",
  supportedLocales: ["en", "ru"],
  withoutLiveMode: true,
  internalLinks: [
    {
      title: "Карта Diablo IV",
      description:
        "Интерактивная карта Diablo IV с отмеченными локациями: алтари, подземелья, точки телепорта и многое другое.",
      href: "/maps/Sanctuary",
      iconName: "Map",
      linkText: "Открыть карту",
      bgImage: preview("Sanctuary"),
    },
  ],
  externalLinks: [],
  keywords: [
    "Подземелья",
    "Алтари Лилит",
    "Точки телепорта",
    "Интерактивная карта",
  ],
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
