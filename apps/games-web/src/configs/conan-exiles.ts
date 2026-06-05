import { type AppConfig } from "@repo/lib";

export const conanExiles: AppConfig = {
  name: "conan-exiles",
  title: "Conan Exiles Enhanced",
  domain: "conanexiles",
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
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Exiled Lands Map",
      description:
        "Navigate the Exiled Lands in Conan Exiles Enhanced (UE5). Find camps, dungeons, caves, vistas, wildlife, NPC factions, iron ore deposits, and more.",
      href: "/maps/Exiled%20Lands",
      iconName: "Map",
      // Inlined getPreviewImageUrl("conan-exiles", "ExiledLands", "2"):
      // middleware imports configs, so any helper from @repo/lib would
      // drag cbor-x into Edge Runtime (forbidden — uses dynamic eval).
      bgImage:
        "https://cdn.th.gl/conan-exiles/map-tiles/ExiledLands/preview.webp?v=2",
      linkText: "Explore the Exiled Lands",
    },
    {
      title: "Isle of Siptah Map",
      description:
        "Explore the Isle of Siptah in Conan Exiles Enhanced. Find vaults, surge altars, camps, wildlife, and resource clusters.",
      href: "/maps/Isle%20of%20Siptah",
      iconName: "Map",
      bgImage:
        "https://cdn.th.gl/conan-exiles/map-tiles/IsleOfSiptah/preview.webp?v=2",
      linkText: "Explore the Isle of Siptah",
    },
  ],
  promoLinks: [],
  externalLinks: [
    {
      href: "https://conanexiles.gaming.tools/",
      title: "Database",
    },
  ],
  // Keywords used in <meta name="keywords">, page descriptions, and OG tags.
  // The app title is interpolated separately, so don't repeat "Conan Exiles
  // Enhanced" here.
  keywords: [
    "Exiled Lands",
    "Isle of Siptah",
    "Camps",
    "Dungeons",
    "Caves",
    "Vaults",
    "Surge Altars",
    "Wildlife",
    "Bosses",
    "Thralls",
    "NPCs",
    "Chests",
    "Iron Ore",
    "Resources",
    "Brimstone",
    "Crystal",
    "Map Markers",
    "Emotes",
    "Recipes",
  ],
  topFilters: [
    "cave",
    "dungeon",
    "ruins",
    "chest_metal",
    "wildlife_boss",
    "res_iron_ore",
    "res_crystal",
  ],
};
