import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Allow local network IP for dev server testing
  allowedDevOrigins: ['192.168.137.1'],
};

export default nextConfig;
