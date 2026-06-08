import { resolveOverwolfConfig } from "@repo/lib";

// title, domain and markerOptions are derived from the canonical games
// registry; only overwolf platform/store identifiers live here.
export const APP_CONFIG = resolveOverwolfConfig({
  name: "palia",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Palia_Map",
  gameClassId: 23186,
  appId: "fgbodfoepckgplklpccjedophlahnjemfdknhfce",
  discordApplicationId: "1181323945866178560",
});
