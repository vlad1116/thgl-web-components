import { type AppConfig, getPreviewImageUrl } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "wuthering-waves",
  title: "Wuthering Waves",
  domain: "wuthering",
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    clusterPrecision: 50,
    zPos: {
      xyMaxDistance: 15000,
      zDistance: 400,
    },
  },
  internalLinks: [
    {
      title: "Dimmr Plains Map",
      description:
        "Explore the subterranean depths beneath Lahai-Roi where the Keystone resides.",
      href: "/maps/Dimmr%20Plains",
      iconName: "Map",
      bgImage: getPreviewImageUrl("wuthering-waves", "WP_3_3_RLG"),
      linkText: "Explore the Dimmr Plains Map",
    },
    {
      title: "Lahai-Roi Map",
      description: "Explore the underground haven beneath the Roya Frostlands.",
      href: "/maps/Lahai-Roi",
      iconName: "Map",
      bgImage: getPreviewImageUrl("wuthering-waves", "WP_Xueyuan"),
      linkText: "Explore the Lahai-Roi Map",
    },
    {
      title: "Overworld Map",
      description:
        "Navigate Wuthering Waves expansive world with our interactive maps.",
      href: "/maps/Overworld",
      iconName: "Map",
      bgImage: getPreviewImageUrl("wuthering-waves", "AkiWorld_WP"),
      linkText: "Explore the Overworld Map",
    },
    {
      title: "Chronorift Metropolis",
      description:
        "Navigate Wuthering Waves expansive world with our interactive maps.",
      href: "/maps/Chronorift%20Metropolis",
      iconName: "Map",
      bgImage: getPreviewImageUrl("wuthering-waves", "WP_2_8_Cafe"),
      linkText: "Explore the Chronorift Metropolis",
    },
    {
      title: "Honami City",
      description: "Explore Honami City with our interactive maps.",
      href: "/maps/Honami%20City",
      iconName: "Map",
      bgImage: getPreviewImageUrl("wuthering-waves", "WP_2_8_Suibo"),
      linkText: "Explore Honami City",
    },
    {
      title: "Fabricatorium of the Deep Map",
      description:
        "Explore the Fabricatorium of the Deep with our interactive maps.",
      href: "/maps/Fabricatorium%20of%20the%20Deep",
      iconName: "Map",
      bgImage: getPreviewImageUrl("wuthering-waves", "WP_HDSYC"),
      linkText: "View the Fabricatorium of the Deep Map",
    },
    {
      title: "Avinoleum Map",
      description: "Explore the Avinoleum with our interactive maps.",
      href: "/maps/Avinoleum",
      iconName: "Map",
      bgImage: getPreviewImageUrl("wuthering-waves", "WP_DianDaoTa2"),
      linkText: "View the Avinoleum Map",
    },
    {
      title: "Tethys' Deep Map",
      description: "Navigate the Tethys' Deep with our interactive maps.",
      href: "/maps/Tethys'%20Deep",
      iconName: "Map",
      bgImage: getPreviewImageUrl("wuthering-waves", "WP_HHA_Underground"),
      linkText: "View the Tethys' Deep Map",
    },
    {
      title: "Vault Underground Map",
      description: "Navigate the Vault Underground with our interactive maps.",
      href: "/maps/Vault%20Underground",
      iconName: "Map",
      bgImage: getPreviewImageUrl("wuthering-waves", "WP_JK_Underground"),
      linkText: "Open the Vault Underground Map",
    },
  ],
  externalLinks: [],
  keywords: [
    "Echoes",
    "Waveplate Activities",
    "Tidal Heritage",
    "Collectibles",
  ],
  topFilters: ["Treasure005", "branch3.0_693_Treasure_3_4"],
};
