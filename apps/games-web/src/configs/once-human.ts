import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

// Inlined per-map preview URLs (getPreviewImageUrl would drag cbor-x
// into middleware via @repo/lib).
const preview = () =>
  `${DATA_FORGE_CDN_URL}/once-human/map-tiles/default/preview.webp`;

export const onceHuman = resolveAppConfig({
  name: "once-human",
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      href: "/maps/Deviation%20Secure",
      title: "Deviation Secure Map",
      description: "Navigate Deviation Secure with our interactive maps.",
      iconName: "Map",
      bgImage: preview(),
      linkText: "Explore the Deviation Secure Map",
    },
    {
      href: "/maps/Manibus%20&%20Evolution's%20Call",
      title: "Manibus Evolution's Call Map",
      description:
        "Navigate Manibus Evolution's Call with our interactive maps.",
      iconName: "Map",
      bgImage: preview(),
      linkText: "Explore the Manibus Evolution's Call Map",
    },
    {
      href: "/maps/Prismverse's%20Clash",
      title: "Prismverse's Clash Map",
      description: "Navigate Prismverse's Clash with our interactive maps.",
      iconName: "Map",
      bgImage: preview(),
      linkText: "Explore the Prismverse's Clash Map",
    },
    {
      href: "/maps/The%20Way%20of%20Winter",
      title: "The Way of Winter Map",
      description: "Navigate The Way of Winter with our interactive maps.",
      iconName: "Map",
      bgImage: preview(),
      linkText: "Explore the The Way of Winter Map",
    },
    {
      href: "/maps/Endless%20Dream",
      title: "Endless Dream Map",
      description: "Navigate Endless Dream with our interactive maps.",
      iconName: "Map",
      bgImage: preview(),
      linkText: "Explore the Endless Dream Map",
    },
    {
      href: "/db/mod-locations",
      title: "Mod Locations",
      iconName: "ArrowUp",
      linkText: "View Mod Locations",
    },
    {
      href: "/db/deviant-locations",
      title: "Deviant Locations",
      iconName: "Bug",
      linkText: "View Deviant Locations",
    },
    {
      href: "/db/remnants",
      title: "Remnants",
      iconName: "NotepadText",
      linkText: "View Remnants",
    },
    {
      href: "/db/regional-records",
      title: "Regional Records",
      iconName: "NotepadText",
      linkText: "View Regional Records",
    },
    {
      href: "/db/echoes-of-stardust",
      title: "Echoes Of Stardust",
      iconName: "NotepadText",
      linkText: "View Echoes Of Stardust",
    },
    {
      href: "/db/weapons",
      title: "Weapons",
      iconName: "Axe",
      linkText: "View Weapons",
    },
  ],
  keywords: ["Ores", "Resources", "Riddles", "Deviants"],
  topFilters: ["mystical_crate", "landscape_viewpoint_camera", "hoard_loot_crate"],
  db: {
    heroSubtitle: "Codex & Compendium",
    searchPlaceholder: "Search remnants, records, weapons...",
    homeSections: [
      {
        href: "/db/weapons",
        type: "weapon",
        icon: "⚔",
        titleFallback: "Weapons",
      },
      {
        href: "/db/remnants",
        type: "remnants",
        typePrefix: "remnants_",
        icon: "📓",
        titleFallback: "Remnants",
      },
      {
        href: "/db/regional-records",
        type: "regional_records",
        typePrefix: "regional_records_",
        icon: "🗺",
        titleFallback: "Regional Records",
      },
      {
        href: "/db/echoes-of-stardust",
        type: "echoes_of_stardust",
        typePrefix: "echoes_of_stardust_",
        icon: "✦",
        titleFallback: "Echoes of Stardust",
      },
    ],
    homeExtraLinks: [
      {
        href: "/db/mod-locations",
        title: "Mod Locations",
        description:
          "Comprehensive list of mod drop locations, item types, enemy types, and map regions.",
        icon: "⬆",
      },
      {
        href: "/db/deviant-locations",
        title: "Deviant Locations",
        description:
          "Where to find each Deviant, what type they are, and what they like.",
        icon: "🐛",
      },
    ],
    typeLabels: {
      weapon: "Weapon",
      remnants: "Remnant",
      regional_records: "Record",
      echoes_of_stardust: "Echo",
    },
    typeColors: {
      weapon: "bg-orange-900/40 text-orange-400",
      remnants: "bg-emerald-900/40 text-emerald-400",
      regional_records: "bg-cyan-900/40 text-cyan-400",
      echoes_of_stardust: "bg-indigo-900/40 text-indigo-400",
    },
    languageCount: 1,
  },
});
