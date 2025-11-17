/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:lang/rummage-pile",
        destination: "/rummage-pile",
        permanent: true,
      },
      {
        source: "/:lang/leaderboard",
        destination: "/leaderboard",
        permanent: true,
      },
      {
        source: "/:lang/download",
        destination: "https://www.overwolf.com/app/Leon_Machens-Palia_Map",
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
