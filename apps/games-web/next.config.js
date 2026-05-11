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
  headers: async () => [
    {
      source: "/:path*",
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
