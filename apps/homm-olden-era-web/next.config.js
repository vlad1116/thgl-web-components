/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ],
  },
  async redirects() {
    return [
      {
        source: "/db/items",
        destination: "/db/artifacts",
        permanent: true,
      },
      {
        source: "/db/items/:path*",
        destination: "/db/artifacts/:path*",
        permanent: true,
      },
      {
        source: "/:locale/db/items",
        destination: "/:locale/db/artifacts",
        permanent: true,
      },
      {
        source: "/:locale/db/items/:path*",
        destination: "/:locale/db/artifacts/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
