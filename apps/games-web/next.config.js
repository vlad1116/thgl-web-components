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
  // Tell Bunny it can edge-cache dynamic responses despite Next.js sending
  // Cache-Control: no-cache. The browser still revalidates (correct), but
  // Bunny serves from edge for up to 60s + 5min stale.
  //
  // We don't override Cache-Control: Next's default "no-cache" is what we
  // want for browsers — store but revalidate (304 from edge).
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "CDN-Cache-Control",
          value: "public, s-maxage=60, stale-while-revalidate=300",
        },
      ],
    },
  ],
};

module.exports = nextConfig;
