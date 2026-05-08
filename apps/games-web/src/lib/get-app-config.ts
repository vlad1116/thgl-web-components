import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { type AppConfig } from "@repo/lib";
import { getAppConfigBySlug, getAppConfigByHost } from "@/configs";

/**
 * Header name used by middleware.ts to communicate the resolved app slug
 * to server components and route handlers.
 */
export const APP_SLUG_HEADER = "x-thgl-app";

/**
 * Resolve the AppConfig for the current request.
 *
 * Order of resolution:
 * 1. `x-thgl-app` header set by middleware (production path)
 * 2. Fallback: parse the `host` header directly (handles cases where
 *    middleware didn't run, e.g. /opengraph-image routes)
 *
 * Calls notFound() if no app matches the hostname.
 */
export async function getAppConfig(): Promise<AppConfig> {
  const h = await headers();

  const slug = h.get(APP_SLUG_HEADER);
  if (slug) {
    const config = getAppConfigBySlug(slug);
    if (config) return config;
  }

  const host = h.get("host");
  if (host) {
    const config = getAppConfigByHost(host);
    if (config) return config;
  }

  notFound();
}
