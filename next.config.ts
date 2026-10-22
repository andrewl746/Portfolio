import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 90 for project screenshots, where 75 softens small UI text.
    qualities: [75, 90],
  },
};

export default nextConfig;
