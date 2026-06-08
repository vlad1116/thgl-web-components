import { resolveOverwolfConfig } from "@repo/lib";

// title, domain and markerOptions are derived from the canonical games
// registry; only overwolf platform/store identifiers live here.
export const APP_CONFIG = resolveOverwolfConfig({
  name: "wuthering-waves",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Wuthering_Waves_Map",
  gameClassId: 24300,
  appId: "gjohaodckfkkodlmmmmeifkdkifddegkleppngad",
  discordApplicationId: "1249803392822546512",
});
