import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import ClientLayout from "@/app/components/ClientLayout";
import { fetchSongsServer } from "@/utils/fetchSongsServer";
import { fetchHubContent } from '@/utils/fetchHubContent';

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0c0a11",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://culuasonglist.netlify.app'),
  title: {
    default: "CULUA Fan Archive | 非官方音樂站",
    template: "%s | CULUA Fan Archive"
  },
  description: "CULUA（カルア）非官方粉絲站。搜尋歌回與翻唱紀錄、播放官方 MV，追蹤 CULUA、NEUN、MEDA 演唱會及音樂發行。",
  applicationName: 'CULUA Fan Archive', // PWA 應用程式名稱
  manifest: "/manifest.json",
  keywords: [
    "CULUA", "カルア", "NEUN", "ノイン", "MEDA", "メダ", "VSinger", "Vtuber",
    "歌回", "歌枠", "歌ってみた", "Song List", "Setlist",
    "Cover", "原創曲", "Original Song", "翻唱", "Fan Database",
    "非官方", "粉絲維護", "YouTube", "音樂資料庫", "Music Database",
    "Culua Song Database", "CULUA Song Archive", "Wiki",
    "CULUA 歌曲列表", "CULUA 歌曲資料庫",
    "CULUA 歌單搜尋", "CULUA 直播存檔", "CULUA 翻唱列表", "CULUA 原創曲",
    "CULUA 歌回紀錄", "非官方 CULUA 資料庫", "Vtuber 歌枠查詢",
    "CULUA 歌枠 セトリ", "CULUA 歌ってみた", "CULUA 非公式 Wiki",
    "CULUA データベース", "CULUA アーカイブ", "Vsinger CULUA おすすめ",
    "Song List", "Setlist", "Karaoke Stream", "Music Database"
  ],
  authors: [{ name: "Samel", url: "https://culuasonglist.netlify.app" }],

  alternates: {
    canonical: '/',
  },

  openGraph: {
    title: "CULUA Fan Archive | 非官方音樂站",
    description: "搜尋 CULUA 唱過的每一首歌。非官方粉絲維護資料庫。",
    url: 'https://culuasonglist.netlify.app',
    siteName: 'CULUA Fan Archive',
    locale: 'zh_TW',
    type: 'website',
    images: [
      {
        url: '/opengraph-image', // 確保 public 資料夾有這張圖
        width: 1200,
        height: 630,
        alt: 'CULUA Unofficial Fan Archive',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image', // 這是大圖卡片模式，非常重要！
    title: "CULUA Fan Archive | Unofficial",
    description: "搜尋 CULUA 唱過的每一首歌。非官方粉絲維護資料庫。",
    images: ['/opengraph-image'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  category: 'music',

  verification: {
    google: 'axWifotevlNtJhso8FBSxrdqWEPxn_FUve9-5slsGMM',
    // 如果有其他搜尋引擎驗證也可以加在這裡
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 透過 ISR 機制，這份資料會被快取，不需要每次請求都去 Google Sheet 抓
  const [songs, content] = await Promise.all([fetchSongsServer(), fetchHubContent()]);
  const originals = content.works.flatMap(w => w.videos.map(v => ({ songName: v.title, artist: w.artists.join(' / '), versions: [{ date: w.releaseDate || '', streamUrl: v.url, streamTitle: v.title, timestamp: '0:00', timestampSeconds: 0, songLink: w.sourceUrl }] })));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CULUA Unofficial Fan Archive",
    "url": "https://culuasonglist.netlify.app",
    "description": "Vsinger CULUA 非官方歌回資料庫",
    "inLanguage": ["zh-Hant", "ja", "en"]
  };

  return (
    <html lang="zh-Hant" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <a href="#main-content" className="skip-link">Skip to content</a>
          <ClientLayout initialSongs={songs} initialOriginals={originals}>
            {children}
          </ClientLayout>
        </LanguageProvider>
      </body>
    </html>
  );
}
