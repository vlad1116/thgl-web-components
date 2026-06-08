import { resolveOverwolfConfig } from "@repo/lib";

// title, domain and markerOptions are derived from the canonical games
// registry; only overwolf platform/store identifiers live here.
export const APP_CONFIG = resolveOverwolfConfig({
  name: "diablo4",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Diablo_4_Map",
  gameClassId: 22700,
  appId: "olbbpfjombddiijdbjeeegeclifleaifdeonllfd",
  discordApplicationId: "1182968067802812456",
});
