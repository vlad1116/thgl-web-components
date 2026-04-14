/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/ads.txt",
        destination: "https://api.nitropay.com/v1/ads-1487.txt",
        permanent: true,
      },
      {
        source: "/support-me/patreon",
        destination: "/api/patreon/authorize",
        permanent: false,
      },
      {
        source: "/discord",
        destination:
          "https://discord.com/invite/the-hidden-gaming-lair-320539672663031818",
        permanent: false,
      },
    ];
  },
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
  headers: async () => {
    return [
      {
        source: "/global_icons/:fileName*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
