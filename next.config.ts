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
  // 這裡不需要任何 experimental 或 turbopack 設定
};

// 使用 withPWA 包裹設定
export default withPWA(nextConfig);