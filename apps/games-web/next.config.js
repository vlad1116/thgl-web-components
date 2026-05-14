/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker container deployment
  output: "standalone",
  images: {
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
  headers: async () => [
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
  ],
};

module.exports = nextConfig;
