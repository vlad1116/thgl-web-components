/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/en/rummage-pile",
        destination: "/rummage-pile",
        permanent: true,
      },
      {
        source: "/en/leaderboard",
        destination: "/leaderboard",
        permanent: true,
      },
      {
        source: "/:lang/download",
        destination: "https://www.th.gl/companion-app",
        permanent: true,
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
};

module.exports = nextConfig;
