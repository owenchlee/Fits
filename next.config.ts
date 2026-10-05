import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  env: {
    // Shown in Profile > About; keep in step with MARKETING_VERSION in the Xcode project.
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
};

export default nextConfig;
