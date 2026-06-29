import type { NextConfig } from "next";
import * as nextEnv from "@next/env";

// Carrega .env manualmente (o next.config roda antes do Next ler os .env).
nextEnv.loadEnvConfig(process.cwd());

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3010";

const nextConfig: NextConfig = {
  // Proxy reverso: chamadas client-side a /api/* vão pro backend Express.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
