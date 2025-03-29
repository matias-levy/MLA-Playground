import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  /* config options here */
};

export default nextConfig;
