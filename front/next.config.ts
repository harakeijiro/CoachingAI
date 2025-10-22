import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ['@supabase/ssr'],
  },
  images: {
    domains: ['localhost'],
  },
};
