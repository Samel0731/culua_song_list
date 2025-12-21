import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://culuasonglist.netlify.app';
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/songs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9, // 提升一點權重，因為這是核心內容
    },
    {
      url: `${baseUrl}/artists`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // 🔥 新增 About 頁面
    // 這頁對建立 E-E-A-T (信任度) 很重要
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly', // 這頁不會常改，設 monthly 即可
      priority: 0.7,
    },
  ];
}