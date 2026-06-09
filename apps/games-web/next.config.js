/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker container deployment
  output: "standalone",
  env: {
    // Dev-only forge proxy: forge URLs become same-origin paths that
    // src/proxy.ts forwards per request — *-dev.localhost tenants (e.g.
    // palia-dev.localhost:3100) hit the local data-forge dev server,
    // every other host the prod endpoints. See FORGE_DEV_PROXY in
    // packages/lib/src/config.ts. Empty string in prod keeps the
    // absolute prod URLs.
    NEXT_PUBLIC_FORGE_DEV_PROXY:
      process.env.NODE_ENV === "development" ? "1" : "",
  },
  experimental: {
    // Persist Turbopack compiler artifacts to disk between dev runs for
    // faster cold starts after a restart (Next 16 beta).
    turbopackFileSystemCacheForDev: true,
  },
  images: {
    // Next.js 16 blocks optimizing images served from local/private IPs by
    // default (returns 400 "url parameter is not allowed"). In development
    // assets are served from a local host (e.g. localhost:33033 via
    // DATA_FORGE_*), so allow it there. Production assets come from
    // cdn.th.gl, so keep the secure default in prod.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.th.gl",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Next.js sends Cache-Control: private, no-cache, no-store, ... on dynamic
  // routes — Bunny respects `private` and refuses to cache. Override:
  //
  //   max-age=0:                browser always revalidates with edge
  //   s-maxage=60:              shared caches (Bunny) keep response 60s
  //   stale-while-revalidate:   serve stale up to 5min while refreshing
  //
  // We avoid `must-revalidate` — it forces Bunny to recheck origin on every
  // request, defeating s-maxage. CDN-Cache-Control duplicates s-maxage so
  // Bunny prefers it explicitly.
  //
  // RSC carve-out: Next.js returns different content (text/html vs
  // text/x-component) for the same URL based on the `RSC` request header.
  // The origin signals this with `Vary: rsc, ...` but Bunny doesn't honor
  // the HTTP Vary header — it relies on its own pull zone settings. Until
  // we enable Bunny's "Vary by Header" for RSC, tell Bunny not to cache
  // RSC responses at all (client-side navigation fetches always hit
  // origin). Plain HTML requests still benefit from edge cache.
  headers: async () => {
    const rules = [
      {
        source: "/:path*",
        has: [{ type: "header", key: "rsc" }],
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store",
          },
          {
            key: "CDN-Cache-Control",
            value: "no-store",
          },
        ],
      },
      {
        source: "/:path*",
        // Skip this rule for RSC requests — the rule above sets no-store
        // for them. Without this `missing` guard, both rules match and the
        // later one overrides, breaking the carve-out.
        missing: [{ type: "header", key: "rsc" }],
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];

    // The /_next/static and /_next/image overrides are PRODUCTION-ONLY.
    // In `next dev` they break HMR — immutable caching serves stale
    // chunks — and Next.js warns about custom Cache-Control on these
    // routes. They aren't needed in dev (no CDN, no deploys) and only
    // earn their keep behind Bunny in prod.
    if (process.env.NODE_ENV === "production") {
      rules.push(
        // Hashed build assets are content-addressed (the hash is in the
        // filename), so a given URL's bytes never change. Cache them
        // immutably. Critical for container deploys: when a new image
        // replaces the old one, the old chunks vanish from origin — a
        // user still on the old HTML relies on the edge having kept
        // them. Without this they'd inherit the 60s s-maxage, get
        // evicted, then 404 into Bunny's HTML → "Unexpected token '<'".
        {
          source: "/_next/static/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
            {
              key: "CDN-Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
        // Optimized images keyed by (url, w, q). Source files (map-tile
        // previews, etc.) can change under a stable URL, so don't make
        // these immutable — cache a day at the edge with a week of SWR,
        // and let the browser revalidate hourly via ETag.
        {
          source: "/_next/image",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=3600, must-revalidate",
            },
            {
              key: "CDN-Cache-Control",
              value: "public, s-maxage=86400, stale-while-revalidate=604800",
            },
          ],
        },
      );
    }

    return rules;
  },
};

export default nextConfig;
