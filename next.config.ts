import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 性能优化
  reactStrictMode: true,

  // 压缩
  compress: true,

  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // 实验性功能
  experimental: {
    // 优化 CSS
    optimizeCss: true,
  },

  // 输出配置
  output: 'standalone',

  // 头部缓存
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
