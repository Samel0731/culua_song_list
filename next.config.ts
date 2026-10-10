import type { NextConfig } from "next";

// 引入 next-pwa
// next-pwa exposes a CommonJS factory without bundled TypeScript declarations.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Content pages must receive ISR updates; only assets are cached offline.
  cacheStartUrl: false,
  runtimeCaching: [
    { urlPattern: /\/admin(?:\/|$)|\/api\/admin(?:\/|$)|\/auth(?:\/|$)|\.supabase\.co\//i, handler: 'NetworkOnly' },
    { urlPattern: /\.(?:js|css|woff2|png|jpg|jpeg|svg|ico)$/i, handler: 'StaleWhileRevalidate', options: { cacheName: 'culua-assets-v2', expiration: { maxEntries: 120, maxAgeSeconds: 604800 } } },
  ],
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' }] },
  // 這裡不需要任何 experimental 或 turbopack 設定
};

// 使用 withPWA 包裹設定
export default withPWA(nextConfig);
