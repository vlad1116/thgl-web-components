import { type AppConfig, getPreviewImageUrl } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "starsand-island",
  title: "Starsand Island",
  domain: "starsandisland",
  supportedLocales: ["en", "ja", "zh-CN", "zh-TW"],
  appUrl: null,
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 100,
      zDistance: 5,
    },
  },
  internalLinks: [
    {
      title: "Starsand Island Map",
      description:
        "Navigate Starsand Island with our interactive map featuring resources, shops, fishing spots, and more.",
      href: "/maps/Starsand%20Island",
      iconName: "Map",
      bgImage: getPreviewImageUrl("starsand-island", "StarSandIsland"),
      linkText: "Explore the Island Map",
    },
    {
      title: "Moonlit Forest Map",
      description:
        "Explore the Moonlit Forest cave with campsites, chests, elf stones, and relics.",
      href: "/maps/Moonlit%20Forest",
      iconName: "Map",
      bgImage: getPreviewImageUrl("starsand-island", "MineCave_MainLand"),
      linkText: "Explore the Moonlit Forest Map",
    },
    {
      href: "/guides",
      title: "config.internalLinks.guides.title",
      linkText: "config.internalLinks.guides.linkText",
      iconName: "BookOpen",
    },
    {
      href: "/guides/Treasure%20Chest",
      title: "Treasure Chests",
      linkText: "Find all Treasure Chests",
      iconName: "BookOpen",
    },
    {
      href: "/guides/Campsite",
      title: "Campsites",
      linkText: "Discover all Campsites",
      iconName: "BookOpen",
    },
    {
      href: "/guides/Elf%20Stone",
      title: "Elf Stones",
      linkText: "Locate all Elf Stones",
      iconName: "BookOpen",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Treasure Chests",
    "Campsites",
    "Elf Stones",
    "Fishing Spots",
    "Shops",
    "Resources",
    "Moonlit Forest",
  ],
};
