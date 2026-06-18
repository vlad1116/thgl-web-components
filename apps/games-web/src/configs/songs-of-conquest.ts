import { resolveAppConfig } from "@repo/lib";

/**
 * Songs of Conquest — database-only codex (migrated from the standalone
 * soc.th.gl site). Renders entirely through the generic `/db/[section]` +
 * `/db/[section]/[id]` routes and `GenericEntityView`; no per-game React code.
 *
 * Section slugs are intentionally singular (Gothic pattern) so they don't
 * collide with HoMM Olden Era's static `/db/units`, `/db/spells`, … route
 * folders (those `requireApp("homm-olden-era")` and 404 other tenants).
 */
export const songsOfConquest = resolveAppConfig({
  name: "songs-of-conquest",
  supportedLocales: [
    "en",
    "ru",
    "cs",
    "fr",
    "de",
    "it",
    "pl",
    "es",
    "zh-CN",
    "ja",
    "ko",
    "pt-BR",
    "uk",
  ],
  appUrl: null,
  internalLinks: [
    {
      href: "/db/unit",
      title: "Units",
      linkText: "Browse units",
      iconName: "Axe",
      description: "All units and their upgrades, stats and costs.",
    },
    {
      href: "/db/wielder",
      title: "Wielders",
      linkText: "Browse wielders",
      iconName: "Trophy",
      description: "Commanders, their stats, starting armies and skill pools.",
    },
    {
      href: "/db/spell",
      title: "Spells",
      linkText: "Browse spells",
      iconName: "ScrollText",
      description: "Battle and world spells with costs and tier effects.",
    },
    {
      href: "/db/artifact",
      title: "Artifacts",
      linkText: "Browse artifacts",
      iconName: "Gift",
      description: "Artifacts and the bonuses they grant.",
    },
    {
      href: "/db/skill",
      title: "Skills",
      linkText: "Browse skills",
      iconName: "BookOpen",
      description: "Wielder skills and their per-level effects.",
    },
    {
      href: "/db/faction",
      title: "Factions",
      linkText: "Browse factions",
      iconName: "ShieldCheck",
      description: "The factions of Aerbor and their identities.",
    },
    {
      href: "/db/building",
      title: "Buildings",
      linkText: "Browse buildings",
      iconName: "House",
      description: "Town buildings, costs, requirements and income.",
    },
    {
      href: "/db/random-event",
      title: "Random Events",
      linkText: "Browse random events",
      iconName: "FileText",
      description: "Random events, their triggers and rewards.",
    },
    {
      href: "/db/town",
      title: "Town Builds",
      linkText: "Plan a town build",
      iconName: "House",
      description: "Interactive build-order planner per faction.",
    },
    {
      href: "/db/savegame",
      title: "Savegames",
      linkText: "Analyze a savegame",
      iconName: "NotepadText",
      description: "Chart a savegame's army value, battles and economy.",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Songs of Conquest",
    "SoC",
    "Database",
    "Codex",
    "Units",
    "Wielders",
    "Spells",
    "Artifacts",
    "Skills",
    "Factions",
    "Buildings",
  ],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search units, wielders, spells...",
    homeSections: [
      { href: "/db/unit", type: "units", titleFallback: "Units", icon: "⚔" },
      {
        href: "/db/wielder",
        type: "wielders",
        titleFallback: "Wielders",
        icon: "👑",
      },
      { href: "/db/spell", type: "spells", titleFallback: "Spells", icon: "✦" },
      {
        href: "/db/artifact",
        type: "artifacts",
        titleFallback: "Artifacts",
        icon: "◆",
      },
      { href: "/db/skill", type: "skills", titleFallback: "Skills", icon: "◎" },
      {
        href: "/db/faction",
        type: "factions",
        titleFallback: "Factions",
        icon: "⛊",
      },
      {
        href: "/db/building",
        type: "buildings",
        titleFallback: "Buildings",
        icon: "🏛",
      },
      {
        href: "/db/random-event",
        type: "random_events",
        titleFallback: "Random Events",
        icon: "🎲",
      },
      {
        href: "/db/town",
        type: "towns",
        titleFallback: "Town Builds",
        icon: "🏰",
      },
    ],
    typeLabels: {
      units: "Unit",
      wielders: "Wielder",
      spells: "Spell",
      artifacts: "Artifact",
      skills: "Skill",
      factions: "Faction",
      buildings: "Building",
      random_events: "Random Event",
      towns: "Town",
    },
    typeColors: {
      units: "bg-red-900/40 text-red-400",
      wielders: "bg-amber-900/40 text-amber-400",
      spells: "bg-indigo-900/40 text-indigo-400",
      artifacts: "bg-purple-900/40 text-purple-400",
      skills: "bg-emerald-900/40 text-emerald-400",
      factions: "bg-yellow-900/40 text-yellow-400",
      buildings: "bg-orange-900/40 text-orange-400",
      random_events: "bg-teal-900/40 text-teal-400",
    },
    languageCount: 13,
  },
});
