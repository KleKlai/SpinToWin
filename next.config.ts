import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // 1. Fix the CORS error for your JS widget file
        source: "/spin-wheel-widget.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      {
        // 2. Your existing Embed route logic
        source: '/embed',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https: http:;" },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // Added CORS here too
        ],
      },
      {
        // 3. Your existing Widget route logic
        source: '/widget',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https: http:;" },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // Added CORS here too
        ],
      },
    ];
  },
};

export default nextConfig;