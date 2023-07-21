/** @type {import('next').NextConfig} */

const path = require("path");
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Adjust the path to match the location of your "AI-town" project

    const aiTownModulePath = path.join(__dirname, "AI-town/node_modules");

    // Configure webpack to resolve modules from the "AI-town" module path
    config.resolve.modules.push(aiTownModulePath);

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "tjzk.replicate.delivery",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "a16z.com",
        port: "",
        pathname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
