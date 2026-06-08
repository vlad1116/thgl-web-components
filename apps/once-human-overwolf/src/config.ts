import { resolveOverwolfConfig } from "@repo/lib";

// title, domain and markerOptions are derived from the canonical games
// registry; only overwolf platform/store identifiers live here.
export const APP_CONFIG = resolveOverwolfConfig({
  name: "once-human",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Once_Human_Map",
  gameClassId: 23930,
  appId: "hjolmidofgehhbnofcpdbcednenibgnblipabcko",
  discordApplicationId: "1271431538675814461",
});
