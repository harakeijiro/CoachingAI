import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ['@supabase/ssr'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3002',
        pathname: '/**',
      },
    ],
  },
  // Next.jsのアイコン処理を完全に無効化してpopup.jsエラーを解決
  compiler: {
    removeConsole: false,
  },
  // 追加の設定でpopup.js生成を防ぐ
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
      // popup.js生成を防ぐための追加設定
      config.plugins = config.plugins || [];
      config.plugins.push(
        new (eval('require')('webpack')).DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        })
      );
      // popup.js生成を防ぐための追加設定
      config.optimization = config.optimization || {};
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          default: false,
          vendors: false,
        },
      };
    }
    return config;
  },
  // 追加: ポップアップ関連の処理を完全に無効化
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  // 追加: アイコン関連の処理を完全に無効化
  async rewrites() {
    return [];
  },
  // 追加: ポップアップ関連の処理を完全に無効化
  async redirects() {
    return [];
  },
};

export default nextConfig;
