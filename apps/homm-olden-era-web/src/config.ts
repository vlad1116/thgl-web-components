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
      title: "Units Database",
      linkText: "Browse all Units",
      iconName: "Axe",
      description:
        "Complete database of all units across all factions — stats, abilities, and upgrade paths.",
    },
    {
      href: "/db/heroes",
      title: "Heroes Database",
      linkText: "Browse all Heroes",
      iconName: "Trophy",
      description:
        "All heroes with their stats, specializations, starting armies, and skills.",
    },
    {
      href: "/db/spells",
      title: "Spells Database",
      linkText: "Browse all Spells",
      iconName: "ScrollText",
      description:
        "Battle and world spells across all magic schools — Day, Night, Primal, Space, and Neutral.",
    },
    {
      href: "/db/items",
      title: "Artifacts Database",
      linkText: "Browse all Artifacts",
      iconName: "Gift",
      description:
        "All artifacts, equipment, scrolls, and item sets with their bonuses and upgrade paths.",
    },
    {
      href: "/db/skills",
      title: "Skills Database",
      linkText: "Browse all Skills",
      iconName: "BookOpen",
      description:
        "Hero skills and sub-skills with their progression levels and bonuses.",
    },
    {
      href: "/db/factions",
      title: "Factions",
      linkText: "Explore Factions",
      iconName: "ShieldCheck",
      description:
        "Faction overviews with faction laws, unique magics, and building trees.",
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
