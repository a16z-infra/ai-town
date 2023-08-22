/** @type {import('next').NextConfig} */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
const nextConfig = {
  basePath: '/ai-town',
  experimental: {
    serverActions: true,
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Adjust the path to match the location of your "AI-town" project

    const aiTownModulePath = path.join(__dirname, 'AI-town/node_modules');

    // Configure webpack to resolve modules from the "AI-town" module path
    config.resolve.modules.push(aiTownModulePath);

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'tjzk.replicate.delivery',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'a16z.com',
        port: '',
        pathname: '**',
      },
    ],
  },
  async redirects() {
    return [
      // Redirect / to /ai-town for users running the project locally
      {
        source: '/',
        destination: '/ai-town',
        basePath: false,
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
