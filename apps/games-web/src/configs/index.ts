import { type AppConfig, isDevForgeHost } from "@repo/lib";
import { diablo4 } from "./diablo4";

/**
 * All app configs that this multi-tenant deployment serves.
 * Add a new game by importing its config and adding it to this array.
 */
const ALL_CONFIGS: AppConfig[] = [diablo4];

/**
 * Registry keyed by hostname subdomain (AppConfig.domain). This is what
 * appears in the URL — e.g. "nightcrows" for nightcrows.th.gl, even when
 * the canonical AppConfig.name uses a different slug ("night-crows").
 */
const BY_DOMAIN: Record<string, AppConfig> = Object.fromEntries(
  ALL_CONFIGS.map((c) => [c.domain, c]),
);

/**
 * Registry keyed by AppConfig.name (canonical slug used internally).
 */
const BY_NAME: Record<string, AppConfig> = Object.fromEntries(
  ALL_CONFIGS.map((c) => [c.name, c]),
);

/**
 * Resolve an app config from a hostname like "avowed.th.gl" or
 * "nightcrows.localhost:3100". Returns null if the hostname doesn't
 * match a registered app.
 */
export function getAppConfigByHost(host: string): AppConfig | null {
  const cleanHost = host.split(":")[0].replace(/\.$/, "");
  let subdomain = cleanHost.split(".")[0];
  // palia-dev.localhost serves the palia tenant against the local
  // data-forge (see the forge dev proxy in @repo/lib config + proxy.ts).
  if (isDevForgeHost(host)) {
    subdomain = subdomain.slice(0, -"-dev".length);
  }
  return BY_DOMAIN[subdomain] ?? null;
}

/**
 * Resolve an app config from its canonical slug (AppConfig.name).
 */
export function getAppConfigBySlug(slug: string): AppConfig | null {
  return BY_NAME[slug] ?? null;
}

/**
 * List all registered apps.
 */
export function getRegisteredApps(): AppConfig[] {
  return ALL_CONFIGS;
}
