import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude pg from bundle - native module, loaded at runtime
  serverExternalPackages: ["pg"],
};

export default nextConfig;
