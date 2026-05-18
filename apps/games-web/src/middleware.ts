import { NextRequest, NextResponse } from "next/server";
import { getAppConfigByHost } from "./configs";

/**
 * Hostname-based multi-tenancy.
 *
 * For each request, look up the app config by the Host header (e.g.
 * "avowed.th.gl" → "avowed"). If matched, set an `x-thgl-app` header
 * downstream so that server components can resolve the right config
 * via getAppConfig(). If no app matches, let the request through
 * unchanged — the layout will 404 via notFound().
 *
 * Per-game static assets (favicon, OG image) live under public/games/<slug>/
 * and are rewritten transparently based on the host.
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const config = getAppConfigByHost(host);

  if (!config) {
    return NextResponse.next();
  }

  const url = req.nextUrl;
  const path = url.pathname;

  // Rewrite per-game OG images (favicon is shared, served from app/favicon.ico)
  if (
    path === "/opengraph-image.jpg" ||
    path === "/activities-tracker/opengraph-image.jpg"
  ) {
    url.pathname = `/games/${config.name}${path}`;
    return NextResponse.rewrite(url);
  }

  // Per-game raw assets bundled under public/games/<slug>/. Used by game
  // components that reference root-relative paths (e.g. dune-awakening's
  // <DuneHeatmaps> loads "/heatmaps/<name>.webp").
  if (path.startsWith("/heatmaps/")) {
    url.pathname = `/games/${config.name}${path}`;
    return NextResponse.rewrite(url);
  }

  // Palia home-page card backgrounds: AppConfig.internalLinks point at
  // bare root paths (/leaderboard.webp, /rummage-pile.webp, /weekly-wants.webp).
  // Rewrite to the per-tenant bundle so other hosts don't collide.
  if (
    config.name === "palia" &&
    (path === "/leaderboard.webp" ||
      path === "/rummage-pile.webp" ||
      path === "/weekly-wants.webp")
  ) {
    url.pathname = `/games/palia${path}`;
    return NextResponse.rewrite(url);
  }

  // Once-human: legacy section URLs (/weapons, /remnants, etc.) moved
  // under /db/* during the games-web migration. Permanent-redirect the
  // old paths so external links + Search Console history stay intact.
  if (config.name === "once-human") {
    const legacy = ONCE_HUMAN_LEGACY_REDIRECTS.find((r) =>
      r.test.test(path),
    );
    if (legacy) {
      url.pathname = path.replace(legacy.test, legacy.replacement);
      return NextResponse.redirect(url, 308);
    }
  }

  const headers = new Headers(req.headers);
  headers.set("x-thgl-app", config.name);

  return NextResponse.next({ request: { headers } });
}

/**
 * Map every old once-human-web top-level section path to its new
 * `/db/*` home. Entries are tried in order, so list the most specific
 * patterns (with `/:id`) before the bare section index.
 *
 * The regex uses a leading anchor so we don't accidentally rewrite
 * arbitrary substrings — only the exact path stem matches.
 */
const ONCE_HUMAN_LEGACY_REDIRECTS: Array<{
  test: RegExp;
  replacement: string;
}> = [
  { test: /^\/weapons(\/.*)?$/, replacement: "/db/weapons$1" },
  { test: /^\/remnants(\/.*)?$/, replacement: "/db/remnants$1" },
  {
    test: /^\/regional-records(\/.*)?$/,
    replacement: "/db/regional-records$1",
  },
  {
    test: /^\/echoes-of-stardust(\/.*)?$/,
    replacement: "/db/echoes-of-stardust$1",
  },
  { test: /^\/mod-locations(\/.*)?$/, replacement: "/db/mod-locations$1" },
  {
    test: /^\/deviant-locations(\/.*)?$/,
    replacement: "/db/deviant-locations$1",
  },
];

export const config = {
  // Run middleware on everything except Next internals and robots
  matcher: ["/((?!_next/|robots\\.txt).*)"],
};
