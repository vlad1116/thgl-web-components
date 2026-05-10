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
  // Override Next.js's default Cache-Control: no-cache for dynamic routes.
  // Routes need headers() to read the Host, so they can't be statically
  // pre-rendered — but the response is identical for all visitors of a
  // given (host, path) pair, so we can let Bunny edge-cache aggressively.
  //
  // Cache-Control is for browsers (revalidate on every visit).
  // CDN-Cache-Control is for Bunny (cache 60s, serve stale up to 5 min).
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=0, must-revalidate",
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
