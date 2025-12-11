import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build a self-contained server bundle for Docker deployment
  output: "standalone",
};

export default nextConfig;
