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

  // Rewrite per-game static assets
  if (path === "/favicon.ico" || path === "/opengraph-image.jpg") {
    url.pathname = `/games/${config.name}${path}`;
    return NextResponse.rewrite(url);
  }

  const headers = new Headers(req.headers);
  headers.set("x-thgl-app", config.name);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Run middleware on everything except Next internals and robots
  matcher: ["/((?!_next/|robots\\.txt).*)"],
};
