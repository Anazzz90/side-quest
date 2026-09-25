import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // This project's own docs (README.md, docs/) are the source of truth;
  // don't let the framework generate/overwrite agent-instruction files.
  agentRules: false,
};

export default nextConfig;
