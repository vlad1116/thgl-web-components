import { isOverwolf } from "./env";
import { HOTKEYS } from "./thgl-app/hotkeys";
import type { MarkerOptions } from "./types";

export const DEFAULT_PATREON_TIER_IDS = [
  "21470801",
  "21470797",
  "21470809",
  "special",
];

export const games: Array<Game> = [
  {
    id: "diablo4",
    discordId: "diablo4",
    title: "Diablo IV",
    logo: "https://www.th.gl/global_icons/diablo4.webp",
    web: "https://diablo4.th.gl",
    markerOptions: {
      radius: 6,
      playerIcon: "player.webp",
      imageSprite: true,
      zPos: {
        xyMaxDistance: 10,
        zDistance: 2,
      },
    },
    overwolf: {
      id: "olbbpfjombddiijdbjeeegeclifleaifdeonllfd",
      title: "Diablo 4 Map",
      protocol: "thgl-diablo4-map",
      url: "https://www.overwolf.com/app/Leon_Machens-Diablo_4_Map",
      supportsCopySecret: true,
    },
    patreonTierIDs: ["9878731", ...DEFAULT_PATREON_TIER_IDS],
    partnerApps: [
      {
        id: "diablo4-companion",
        title: "Diablo IV Companion App",
        description:
          "Ingame overlay to help you find your perfect gear affixes.",
        author: "Uthar",
        web: "https://github.com/josdemmers/Diablo4Companion",
      },
    ],
  },
];

export type PartnerApp = {
  id: string;
  title: string;
  description?: string;
  author: string;
  web: string;
};

export type AdditionalContent =
  | "PlayerDetails"
  | "PaliaWeeklyWants"
  | "PaliaGrid"
  | "PaliaGridToggle"
  | "PaliaTime"
  | "DuneDeepDesertGrid"
  | "DuneHeatmaps"
  | "CrimsonDesertZones"
  | "CrimsonDesertSaveImport";

export type AdditionalTooltip = "PalworldCoordinates" | "DuneAltitude";

export type Game = {
  id: string;
  discordId: string;
  title: string;
  logo: string;
  lockedWindowComponents?: Array<AdditionalContent>;
  additionalComponents?: Array<AdditionalContent>;
  additionalFilters?: Array<AdditionalContent>;
  additionalTooltip?: Array<AdditionalTooltip>;
  /**
   * Canonical marker render options for this game. For companion games these
   * historically live under `companion.markerOptions`; this top-level field is
   * for games that need marker options without a companion block (e.g. diablo4,
   * pax-dei, hogwarts-legacy). Read via `getGameMarkerOptions(game)`, which
   * prefers this field and falls back to `companion.markerOptions`.
   */
  markerOptions?: MarkerOptions;
  companion?: {
    baseURL: string;
    controllerURL: string;
    desktopURL: string;
    overlayURL: string;
    markerOptions: {
      radius: number;
      playerIcon: string;
      imageSprite: boolean;
      zPos: {
        xyMaxDistance: number;
        zDistance: number;
      };
      clusterPrecision?: number;
      coordinateCopyFormat?: string;
    };
    games: {
      title: string;
      processNames: string[];
    }[];
    defaultHotkeys: Record<string, string>;
  };
  web?: string;
  overwolf?: {
    id: string;
    title: string;
    protocol: string;
    url: string;
    supportsCopySecret?: boolean;
  };
  patreonTierIDs: string[];
  premiumFeatures?: string[];
  partnerApps?: PartnerApp[];
};

/** The web subdomain for a game (e.g. "starresonance"), derived from `web`. */
export function getAppDomain(game: Game): string {
  return game.web ? new URL(game.web).host.split(".")[0] : game.id;
}

/**
 * Resolve the current game's canonical `Game.id` from the runtime context.
 * Works across all three places we render, and ALWAYS returns the canonical
 * id (not a surface-specific alias) so per-game data keyed by it — community
 * and personal filters, settings — agrees across surfaces:
 *
 *   - Game tenant on the web (paxdei.th.gl, *.localhost): the first subdomain
 *     is the `AppConfig` domain, which differs from `Game.id` for ~17 games
 *     (e.g. `starresonance` → `blue-protocol-star-resonance`). Mapped back to
 *     the canonical id via the registry. Skips infra subdomains (www/app).
 *   - THGLApp WebView (app.th.gl/apps/<id>): the path segment after `/apps/`
 *     is already the `Game.id`.
 *   - Overwolf extension (overwolf-extension://<extId>): hostname is the
 *     extension id; look it up in the registry to recover the canonical id.
 *
 * Returns null when running SSR, on www/app roots, or when no game matches —
 * callers should treat null as "don't render game-scoped UI" rather than
 * guessing.
 */
export function getCurrentGameId(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  if (path.startsWith("/apps/")) return path.split("/")[2] ?? null;
  if (isOverwolf) {
    const ext = window.location.hostname;
    return games.find((g) => g.overwolf?.id === ext)?.id ?? null;
  }
  let sub = window.location.hostname.split(".")[0];
  if (!sub || ["www", "app", "localhost", "127", "0"].includes(sub))
    return null;
  // Map the tenant subdomain back to the canonical id; fall back to the raw
  // subdomain for web-only games with no registry entry (e.g. drakantos).
  return games.find((g) => getAppDomain(g) === sub)?.id ?? sub;
}
