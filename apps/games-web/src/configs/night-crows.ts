import { resolveAppConfig } from "@repo/lib";

export const nightCrows = resolveAppConfig({
  name: "night-crows",
  supportedLocales: ["en"],
  appUrl: null,
  withoutLiveMode: true,
  internalLinks: [
    {
      href: "/",
      title: "Maps",
      description: "Explore Night Crows Interactive Maps",
      iconName: "Map",
      linkText: "Explore Maps",
    },
    {
      title: "Activities Tracker",
      description:
        "Track your progress and conquer the challenges of Night Crows",
      href: "/activities-tracker",
      iconName: "SquareCheckBig",
    },
  ],
  externalLinks: [],
  keywords: ["Wandering Tyrant", "World Bosses", "Activities Tracker"],
});
