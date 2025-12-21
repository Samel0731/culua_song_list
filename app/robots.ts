import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 禁止爬蟲抓取 API 路由或私有頁面，節省爬取額度
      disallow: ['/api/', '/admin/'],
    },
    // 告訴爬蟲您的地圖在哪裡
    sitemap: 'https://culuasonglist.netlify.app/sitemap.xml',
  };
}