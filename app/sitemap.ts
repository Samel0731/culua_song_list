import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://culuasonglist.netlify.app';
  const currentDate = new Date();

  return [
    // 1. 首頁 (入口)
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1,
    },
    // 2. 歌曲列表 (核心內容，變動頻繁)
    {
      url: `${baseUrl}/songs`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // 3. 歌手列表 (核心分類)
    {
      url: `${baseUrl}/artists`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // 4. 專注模式 (功能頁面)
    {
      url: `${baseUrl}/focus`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // 5. 關於頁面 (靜態資訊，信任感來源)
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}