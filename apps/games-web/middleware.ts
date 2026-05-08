import { NextRequest, NextResponse } from "next/server";
import { getAppConfigByHost } from "./src/configs";

/**
 * Hostname-based multi-tenancy.
 *
 * For each request, look up the app config by the Host header (e.g.
 * "avowed.th.gl" → "avowed"). If matched, set an `x-thgl-app` header
 * downstream so that server components can resolve the right config
 * via getAppConfig(). If no app matches, let the request through
 * unchanged — the layout will 404 via notFound().
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const config = getAppConfigByHost(host);

  if (!config) {
    return NextResponse.next();
  }

  const headers = new Headers(req.headers);
  headers.set("x-thgl-app", config.name);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Skip middleware for static assets and Next internals
  matcher: ["/((?!_next/|favicon\\.ico|robots\\.txt).*)"],
};
