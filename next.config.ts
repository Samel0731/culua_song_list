import type { NextConfig } from "next";

// 引入 next-pwa
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  // 注意：這裡不需要再加 turbopack 的設定，因為我們已經在 package.json 強制使用 webpack 了
};

// 使用 withPWA 包裹設定
export default withPWA(nextConfig);