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

  // thgl-app's root-level static assets — the native client downloads
  // these from app.th.gl by exact path (installer + auto-update manifest
  // + version marker), so we keep the URL but bundle the files under
  // public/games/thgl-app/.
  if (
    config.name === "thgl-app" &&
    (path === "/THGL_Installer.exe" ||
      path === "/manifest.bin" ||
      path === "/version.txt" ||
      path === "/cave128.png")
  ) {
    url.pathname = `/games/thgl-app${path}`;
    return NextResponse.rewrite(url);
  }

  // thgl-app Patreon OAuth entrypoint. Done in middleware (not next.config
  // redirects) because the `has: { type: "host" }` rule there only does
  // exact-string matching, breaking `app.localhost:3100` in dev. We
  // already have host resolution here.
  if (config.name === "thgl-app" && path === "/authenticate") {
    const dest = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${process.env.PATREON_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.PATREON_REDIRECT_URL ?? "")}`;
    return NextResponse.redirect(dest, 302);
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
