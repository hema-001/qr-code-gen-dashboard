import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["http://localhost:3001", "http://198.18.0.1:3001"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://192.168.2.100:3000/api/v1/:path*",
      },
    ];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
    
    turbopack: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);

// export default nextConfig;
