import { type AppConfig } from "@repo/lib";
import { avowed } from "./avowed";

/**
 * Registry of all app configs that this multi-tenant deployment serves.
 * Add a new game by importing its config and adding it here.
 *
 * The key is the AppConfig.name (used as canonical app slug).
 */
export const APP_CONFIGS: Record<string, AppConfig> = {
  avowed,
};

/**
 * Resolve an app config from a hostname like "avowed.th.gl" or "avowed.localhost:3100".
 * Returns null if the hostname doesn't match a registered app.
 */
export function getAppConfigByHost(host: string): AppConfig | null {
  // Strip port and trailing dot
  const cleanHost = host.split(":")[0].replace(/\.$/, "");
  // First subdomain segment is the app slug
  const slug = cleanHost.split(".")[0];
  return APP_CONFIGS[slug] ?? null;
}

/**
 * Resolve an app config from its canonical slug.
 */
export function getAppConfigBySlug(slug: string): AppConfig | null {
  return APP_CONFIGS[slug] ?? null;
}

/**
 * List all registered app slugs.
 */
export function getRegisteredApps(): string[] {
  return Object.keys(APP_CONFIGS);
}
