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
        "Navigate the world of Crimson Desert with our interactive map featuring Abyss Cressets, treasures, shops, gathering nodes, and more.",
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
  ],
  keywords: [
    "Abyss Cresset",
    "Treasure",
    "Shops",
    "Mining",
    "Gathering",
    "Bosses",
  ],
};
