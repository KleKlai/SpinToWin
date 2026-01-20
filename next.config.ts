import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to the embed route
        source: '/embed',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL', // Allow embedding from any site
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https: http:;", // Allow embedding
          },
        ],
      },
      {
        // Also apply to the main widget route if needed
        source: '/widget',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https: http:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
