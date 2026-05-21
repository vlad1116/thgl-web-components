import { type AppConfig } from "@repo/lib";

/**
 * Marketing site at https://www.th.gl. Multi-tenant container routes
 * www.th.gl → this config; all www routes live under app/_www/ on disk
 * and the middleware rewrites /<path> → /_www/<path> to keep them out
 * of Next's URL-collision detector (thgl-app already owns /apps/[id]
 * and /api/patreon/redirect on app.th.gl, and games-web tenants own /).
 *
 * Like thgl-app's config, this is intentionally minimal — the marketing
 * site doesn't use AppConfig's internalLinks / topFilters / etc. The
 * container only needs `name` + `domain` so getAppConfigByHost can
 * resolve www.th.gl and middleware can branch.
 */
export const thglWeb: AppConfig = {
  name: "thgl-web",
  title: "The Hidden Gaming Lair",
  domain: "www",
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [],
  externalLinks: [],
  keywords: [],
};
