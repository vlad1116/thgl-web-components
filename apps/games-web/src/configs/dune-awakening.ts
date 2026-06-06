import { type AppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

// Inlined per-map preview URLs; the originals used getPreviewImageUrl()
// which would drag cbor-x into middleware via @repo/lib.
const preview = (mapId: string, version?: string) => {
  const url = `${DATA_FORGE_CDN_URL}/dune-awakening/map-tiles/${mapId}/preview.webp`;
  return version ? `${url}?v=${version}` : url;
};

export const duneAwakening: AppConfig = {
  name: "dune-awakening",
  title: "Dune: Awakening",
  domain: "duneawakening",
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pl",
    "pt-BR",
    "ru",
    "tr",
    "uk",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      href: "/maps/Hagga%20Basin",
      title: "config.internalLinks.hagga.title",
      description: "config.internalLinks.hagga.description",
      linkText: "config.internalLinks.hagga.linkText",
      iconName: "Map",
      bgImage: preview("survival_1", "3"),
    },
    {
      href: "/maps/Arrakeen",
      title: "config.internalLinks.arrakeen.title",
      description: "config.internalLinks.arrakeen.description",
      linkText: "config.internalLinks.arrakeen.linkText",
      iconName: "Map",
      bgImage: preview("sh_arrakeen", "3"),
    },
    {
      href: "/maps/Harko%20Village",
      title: "config.internalLinks.harko.title",
      description: "config.internalLinks.harko.description",
      linkText: "config.internalLinks.harko.linkText",
      iconName: "Map",
      bgImage: preview("sh_harkovillage", "4"),
    },
    {
      href: "/maps/The%20Deep%20Desert",
      title: "config.internalLinks.deep.title",
      description: "config.internalLinks.deep.description",
      linkText: "config.internalLinks.deep.linkText",
      iconName: "Map",
      bgImage: preview("deepdesert_1", "4"),
    },
    {
      href: "/maps/Blushing%20Cavern",
      title: "config.internalLinks.blushing.title",
      description: "config.internalLinks.blushing.description",
      linkText: "config.internalLinks.blushing.linkText",
      iconName: "Map",
      bgImage: preview("cb_overland_s_04"),
    },
    {
      href: "/maps/Wreck%20of%20the%20Tyche",
      title: "config.internalLinks.tyche.title",
      description: "config.internalLinks.tyche.description",
      linkText: "config.internalLinks.tyche.linkText",
      iconName: "Map",
      bgImage: preview("cb_overland_m_01"),
    },
    {
      href: "/maps/Smuggler's%20Run",
      title: "config.internalLinks.smugglers.title",
      description: "config.internalLinks.smugglers.description",
      linkText: "config.internalLinks.smugglers.linkText",
      iconName: "Map",
      bgImage: preview("cb_overland_s_06"),
    },
  ],
  externalLinks: [
    {
      href: "https://dune.gaming.tools/",
      title: "config.external.database.title",
    },
  ],
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 10000,
      zDistance: 400,
    },
  },
  keywords: [
    "config.keywords.trials",
    "config.keywords.resources",
    "config.keywords.trainers",
  ],
  topFilters: ["house_representativeswydras"],
};
