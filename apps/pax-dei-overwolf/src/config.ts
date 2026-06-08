import { resolveOverwolfConfig } from "@repo/lib";

// title, domain and markerOptions are derived from the canonical games
// registry; only overwolf platform/store identifiers live here.
export const APP_CONFIG = resolveOverwolfConfig({
  name: "pax-dei",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Pax_Dei_Map",
  gameClassId: 23626,
  appId: "kgfnjdoonhclpamjbhiohlkbolgdmepfaimbdfjo",
  discordApplicationId: "1308777591305539675",
});
