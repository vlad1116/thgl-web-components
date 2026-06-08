import { resolveAppConfig } from "@repo/lib";

export const palworld = resolveAppConfig({
  name: "palworld",
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  // No internalLinks: Palpagos Island and any future map auto-generate from
  // version.data.tiles. multiTenantMapPage looks up game-specific
  // additionalFilters/additionalTooltip via the games registry by name.
  externalLinks: [],
  keywords: ["Tides of Terraria", "Feybreak", "Predator & Alpha Pals"],
  topFilters: [
    "lifmunk_effigy",
    "dungeon_random",
    "coal",
    "junk_yard",
    "boss_thunderbird",
    "predator_sifudog",
    "fasttravel",
    "skill_fruit",
  ],
});
