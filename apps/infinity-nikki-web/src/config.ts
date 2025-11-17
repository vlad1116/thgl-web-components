import { type AppConfig, getPreviewImageUrl } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "infinity-nikki",
  title: "Infinity Nikki",
  domain: "infinitynikki",
  supportedLocales: ["en"],
  appUrl: null,
  withoutLiveMode: true,
  internalLinks: [
    {
      title: "Miraland Map",
      description:
        "Navigate Infinity Nikki's expansive world with our interactive maps.",
      href: "/maps/Miraland",
      iconName: "Map",
      bgImage: getPreviewImageUrl("infinity-nikki", "1"),
      linkText: "Explore the Overworld Map",
    },
    {
      title: "Danqing Island Map",
      description: "Navigate the Danqing Island with our interactive maps.",
      href: "/maps/Danqing%20Island",
      iconName: "Map",
      bgImage: getPreviewImageUrl("infinity-nikki", "10000010"),
      linkText: "View the Danqing Island Map",
    },
    {
      title: "Danqing Realm Map",
      description: "Navigate the Danqing Realm with our interactive maps.",
      href: "/maps/Danqing%20Realm",
      iconName: "Map",
      bgImage: getPreviewImageUrl("infinity-nikki", "10000027"),
      linkText: "View the Danqing Realm Map",
    },
    {
      title: "Firework Isles Map",
      description: "Navigate the Firework Isles with our interactive maps.",
      href: "/maps/Firework%20Isles",
      iconName: "Map",
      bgImage: getPreviewImageUrl("infinity-nikki", "10000001"),
      linkText: "View the Firework Isles Map",
    },
    {
      title: "Serenity Island Map",
      description: "Navigate the Serenity Island with our interactive maps.",
      href: "/maps/Serenity%20Island",
      iconName: "Map",
      bgImage: getPreviewImageUrl("infinity-nikki", "10000002"),
      linkText: "View the Serenity Island Map",
    },
    {
      title: "Sea of Stars Map",
      description: "Navigate the Sea of Stars with our interactive maps.",
      href: "/maps/Sea%20of%20Stars",
      iconName: "Map",
      bgImage: getPreviewImageUrl("infinity-nikki", "14000000"),
      linkText: "View the Sea of Stars Map",
    },
  ],
  externalLinks: [],
  keywords: [
    "Whimstar & Whim Balloon spots",
    "Dew of Inspiration & Dew of Firework routes",
  ],
};
