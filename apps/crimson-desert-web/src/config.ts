import { type AppConfig, getPreviewImageUrl } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "crimson-desert",
  title: "Crimson Desert",
  domain: "crimsondesert",
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Crimson Desert Interactive Map",
      description:
        "Navigate the Continent of Pywel with our interactive map featuring Abyss Cressets, treasures, shops, gathering nodes, and more.",
      href: "/maps/Continent%20of%20Pywel",
      iconName: "Map",
      bgImage: getPreviewImageUrl("crimson-desert", "OpenWorld"),
      linkText: "Explore the Map",
    },
    {
      href: "/guides",
      title: "config.internalLinks.guides.title",
      linkText: "config.internalLinks.guides.linkText",
      iconName: "BookOpen",
    },
    {
      href: "/guides/Abyss",
      title: "Abyss",
      linkText: "Unlock all Abyss locations",
      iconName: "BookOpen",
    },
    {
      href: "/guides/Treasure%20Chest",
      title: "Treasure Chest",
      linkText: "Discover all Treasure Chests",
      iconName: "BookOpen",
    },
    {
      href: "/guides/Gathering",
      title: "Gathering",
      linkText: "Find all Gathering Nodes",
      iconName: "BookOpen",
    },
  ],
  keywords: [
    "Pywel",
    "Abyss Cresset",
    "Sealed Artifact",
    "Treasure Chest",
    "Stronghold",
    "Fast Travel",
    "Bonfire",
    "Mining",
    "Gathering",
    "Iron Ore",
    "Copper Ore",
    "Faction Quest",
    "Hernand",
    "Delesyia",
    "Demeniss",
  ],
};
