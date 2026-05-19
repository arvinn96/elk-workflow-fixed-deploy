// Reload trigger: 2026-04-10T09:16:30 (Force Edge Manifest Refresh)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake these heavy packages at the import level — smaller JS chunks
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },
  compiler: {
    // Strip console.* calls from production builds
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
