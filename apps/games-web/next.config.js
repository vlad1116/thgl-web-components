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
  // routes. The `private` directive tells CDNs not to cache in shared caches,
  // overriding our intent. Strip it: replace with `public, must-revalidate`
  // (browser revalidates; edge is allowed to cache via CDN-Cache-Control).
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
