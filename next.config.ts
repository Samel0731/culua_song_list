import type { NextConfig } from "next";

// 引入 next-pwa
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // 開發環境不啟用 PWA
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // ✨ 新增這段：消除 Turbopack 與 Webpack 的衝突警告
  // 這告訴 Next.js 在開發模式下即使看到 Webpack 設定也繼續使用 Turbopack
  experimental: {
    turbopack: {
      // 這裡可以留空，只是為了標記我們已知情
    }
  }
};

// 使用 withPWA 包裹設定
export default withPWA(nextConfig);