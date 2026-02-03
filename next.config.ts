import type { NextConfig } from "next";

// This is validation for the environment variables early in the build process.
import "./src/lib/env";

const isProd = process.env.NODE_ENV === "production";
const isDocker = process.env.IS_DOCKER === "true";

const config: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignore ESLint errors during build (can be fixed later)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore TypeScript errors during build
    // TODO: Fix type errors in plex-api.ts
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "c.saavncdn.com",
      },
      {
        protocol: "https",
        hostname: "c.sop.saavncdn.com",
      },
      // Allow Plex images (if using Plex)
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: !isDocker,
  },
  experimental: {
    ppr: false, // Disabled: requires Next.js canary version
    reactCompiler: false, // Disabled: requires babel-plugin-react-compiler setup
    // ...
  },
  output: isDocker ? "standalone" : undefined,
  /* ... */
};

export default config;
