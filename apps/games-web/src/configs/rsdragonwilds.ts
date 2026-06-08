import { resolveAppConfig } from "@repo/lib";

export const rsdragonwilds = resolveAppConfig({
  name: "rsdragonwilds",
  // Production URL is dragonwilds.th.gl (NOT rsdragonwilds.th.gl)
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [],
  externalLinks: [],
  keywords: ["Chests", "Lore", "Quests"],
});
