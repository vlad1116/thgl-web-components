import { type AppConfig, getPreviewImageUrl } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "conan-exiles",
  title: "Conan Exiles",
  domain: "conan-exiles",
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pl",
    "pt",
    "ru",
    "zh-Hans",
    "zh-Hant",
  ],
  appUrl: null,
  internalLinks: [
    {
      title: "Exiled Lands Map",
      description:
        "Navigate Conan Exiles' Exiled Lands with our interactive map. Find camps, creatures, dungeons, chests, and more.",
      href: "/maps/Exiled%20Lands",
      iconName: "Map",
      bgImage: getPreviewImageUrl("conan-exiles", "ExiledLands", "2"),
      linkText: "Explore the Exiled Lands",
    },
    {
      title: "Isle of Siptah Map",
      description:
        "Explore the Isle of Siptah with our interactive map. Discover vaults, surge altars, camps, and creatures.",
      href: "/maps/Isle%20of%20Siptah",
      iconName: "Map",
      bgImage: getPreviewImageUrl("conan-exiles", "IsleOfSiptah", "2"),
      linkText: "Explore the Isle of Siptah",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Camps",
    "Dungeons",
    "Caves",
    "Wildlife",
    "Thralls",
    "Chests",
    "Emotes",
    "Recipes",
  ],
  topFilters: ["cave", "dungeon", "ruins", "chest_metal", "wildlife_boss"],
};
