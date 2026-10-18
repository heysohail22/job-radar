import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  transpilePackages: ["@job-radar/contracts"],
  // Use Next's supported compiler API integration with TypeScript 5.9.
  experimental: { useTypeScriptCli: false },
};
export default config;
