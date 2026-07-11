import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output so the Docker image can run `node server.js` without
  // node_modules — see Dockerfile and docs/deploy.md.
  output: "standalone",
};

export default nextConfig;
