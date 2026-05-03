import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "homm-olden-era",
  title: "Heroes of Might & Magic: Olden Era",
  domain: "oldenera",
  supportedLocales: [
    "en",
    "fr",
    "de",
    "es",
    "ru",
    "pl",
    "cs",
    "hu",
    "tr",
    "uk",
    "ja",
    "ko",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: null,
  internalLinks: [
    {
      href: "/db/units",
      title: "ui.nav_units",
      linkText: "Browse all Units",
      iconName: "Axe",
      description:
        "Complete database of all units across all factions — stats, abilities, and upgrade paths.",
    },
    {
      href: "/db/heroes",
      title: "ui.nav_heroes",
      linkText: "Browse all Heroes",
      iconName: "Trophy",
      description:
        "All heroes with their stats, specializations, starting armies, and skills.",
    },
    {
      href: "/db/spells",
      title: "ui.nav_spells",
      linkText: "Browse all Spells",
      iconName: "ScrollText",
      description:
        "Battle and world spells across all magic schools — Day, Night, Primal, Space, and Neutral.",
    },
    {
      href: "/db/items",
      title: "ui.nav_artifacts",
      linkText: "Browse all Artifacts",
      iconName: "Gift",
      description:
        "All artifacts, equipment, scrolls, and item sets with their bonuses and upgrade paths.",
    },
    {
      href: "/db/skills",
      title: "ui.nav_skills",
      linkText: "Browse all Skills",
      iconName: "BookOpen",
      description:
        "Hero skills and sub-skills with their progression levels and bonuses.",
    },
    {
      href: "/db/factions",
      title: "ui.nav_factions",
      linkText: "Explore Factions",
      iconName: "ShieldCheck",
      description:
        "Faction overviews with faction laws, specializations, and unique mechanics.",
    },
    {
      href: "/db/buildings",
      title: "ui.nav_buildings",
      linkText: "Browse Buildings",
      iconName: "House",
      description:
        "City buildings per faction with costs, prerequisites, and unit recruitment.",
    },
    {
      href: "/db/map-objects",
      title: "ui.nav_map_objects",
      linkText: "Browse Map Objects",
      iconName: "MapPin",
      description:
        "Dwellings, resource sites, adventure encounters, magic shrines, and more.",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "HoMM",
    "Olden Era",
    "Heroes of Might and Magic",
    "Database",
    "Units",
    "Heroes",
    "Spells",
    "Artifacts",
    "Skills",
    "Factions",
  ],
};
