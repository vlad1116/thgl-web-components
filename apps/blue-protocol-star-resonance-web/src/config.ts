import { type AppConfig, getPreviewImageUrl } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "blue-protocol-star-resonance",
  title: "Blue Protocol: Star Resonance",
  domain: "starresonance",
  supportedLocales: ["en", "ja", "zh-CN", "zh-TW", "th"],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Asteria Plains Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Asteria Plains with our interactive maps.",
      href: "/maps/Asteria%20Plains",
      iconName: "Map",
      bgImage: getPreviewImageUrl(
        "blue-protocol-star-resonance",
        "asteria_plains",
      ),
      linkText: "Explore the Asteria Plains Map",
    },
    {
      title: "Asterleeds Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Asterleeds with our interactive maps.",
      href: "/maps/Asterleeds",
      iconName: "Map",
      bgImage: getPreviewImageUrl("blue-protocol-star-resonance", "asterleeds"),
      linkText: "Explore the Asterleeds Map",
    },
    {
      title: "Moonshadow Wilds Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Moonshadow Wilds with our interactive maps.",
      href: "/maps/Moonshadow%20Wilds",
      iconName: "Map",
      bgImage: getPreviewImageUrl(
        "blue-protocol-star-resonance",
        "moonshadow_wilds",
      ),
      linkText: "Explore the Moonshadow Wilds Map",
    },
    {
      title: "Bahamar Highlands Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Bahamar Highlands with our interactive maps.",
      href: "/maps/Bahamar%20Highlands",
      iconName: "Map",
      bgImage: getPreviewImageUrl(
        "blue-protocol-star-resonance",
        "bahamar_highlands",
      ),
      linkText: "Explore the Bahamar Highlands Map",
    },
    {
      title: "Bahamar Highlands (Deepreach) Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Bahamar Highlands Deepreach with our interactive maps.",
      href: "/maps/Bahamar%20Highlands%20(Deepreach)",
      iconName: "Map",
      bgImage: getPreviewImageUrl(
        "blue-protocol-star-resonance",
        "bahamar_highlands_deepreach",
      ),
      linkText: "Explore the Bahamar Highlands Deepreach Map",
    },
    {
      title: "Windhowl Canyon Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Windhowl Canyon with our interactive maps.",
      href: "/maps/Windhowl%20Canyon",
      iconName: "Map",
      bgImage: getPreviewImageUrl(
        "blue-protocol-star-resonance",
        "windhowl_canyon",
      ),
      linkText: "Explore the Windhowl Canyon Map",
    },
    {
      title: "Everfall Forest Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Everfall Forest with our interactive maps.",
      href: "/maps/Everfall%20Forest",
      iconName: "Map",
      bgImage: getPreviewImageUrl(
        "blue-protocol-star-resonance",
        "everfall_forest",
      ),
      linkText: "Explore the Everfall Forest Map",
    },
    {
      title: "Duskdye Woods Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Duskdye Woods with our interactive maps.",
      href: "/maps/Duskdye%20Woods",
      iconName: "Map",
      bgImage: getPreviewImageUrl(
        "blue-protocol-star-resonance",
        "duskdye_woods",
      ),
      linkText: "Explore the Duskdye Woods Map",
    },
    {
      title: "Underground District Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Underground District with our interactive maps.",
      href: "/maps/Underground%20District",
      iconName: "Map",
      bgImage: getPreviewImageUrl(
        "blue-protocol-star-resonance",
        "underground_district",
      ),
      linkText: "Explore the Underground District Map",
    },
    {
      title: "Stray Starway Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Stray Starway with our interactive maps.",
      href: "/maps/Stray%20Starway",
      iconName: "Map",
      bgImage: getPreviewImageUrl(
        "blue-protocol-star-resonance",
        "stray_starway",
      ),
      linkText: "Explore the Stray Starway Map",
    },
    {
      title: "Skimmer's Lair Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Skimmer's Lair with our interactive maps.",
      href: "/maps/Skimmer's%20Lair",
      iconName: "Map",
      bgImage: getPreviewImageUrl(
        "blue-protocol-star-resonance",
        "skimmer_s_lair",
      ),
      linkText: "Explore the Skimmer's Lair Map",
    },
    {
      href: "/activities-tracker",
      title: "Activities Tracker",
      linkText: "Track Daily & Weekly Activities",
      bgImage: "https://www.th.gl/activity-tracker.webp",
      iconName: "SquareCheckBig",
    },
    {
      href: "/db/story",
      title: "Story Episodes",
      linkText: "Follow the Story Episodes",
      iconName: "BookOpen",
    },
    {
      href: "/db/reading-books",
      title: "Reading Books",
      linkText: "Explore all Reading Books",
      iconName: "BookOpen",
    },
    {
      href: "/db/dictionary",
      title: "Lore Dictionary",
      linkText: "Browse the Lore Dictionary",
      iconName: "BookOpen",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: ["BPSR", "Bosses", "Guides", "Maps", "Rare Spawns", "Engram Hubs"],
  topFilters: ["monster_ignisor", "camera_point", "wind_barrier"],
};
