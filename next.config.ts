import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep development chunks separate from production builds. Running `npm run build`
  // while the local server is open must not invalidate the active 3000 dev server.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
