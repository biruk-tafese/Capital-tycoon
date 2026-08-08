import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow ngrok domain for development static chunks and Hot Module Replacement
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "b967-196-189-150-186.ngrok-free.app",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "ngrok-skip-browser-warning",
            value: "true",
          },
        ],
      },
    ];
  },
};

export default nextConfig;