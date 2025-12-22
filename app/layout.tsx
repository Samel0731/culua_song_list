import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import ClientLayout from "@/app/components/ClientLayout";
// ✨ 修改 1: 引入 Server 端抓取函式
import { fetchSongsServer } from "@/utils/fetchSongsServer";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://culuasonglist.netlify.app'),
  title: {
    default: "CULUA Song Database | 歌枠データベース",
    template: "%s | CULUA Song Database"
  },
  description: "非官方 CULUA 粉絲歌回資料庫。收錄 CULUA 的歷年歌回、翻唱曲目、原創曲與直播紀錄。搜尋 CULUA 唱過的歌最方便的工具。Fan-made database for VSinger CULUA.",
  applicationName: 'CULUA DB', // PWA 應用程式名稱
  manifest: "/manifest.json",
  keywords: [
    "CULUA", "クルア", "くるあ", "VSinger", "Vtuber", 
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
  
  // ✨ 新增：標準網址 (告訴 Google 這是正版頁面)
  alternates: {
    canonical: '/',
  },

  openGraph: {
    title: "CULUA Song Database | 歌枠データベース",
    description: "搜尋 CULUA 唱過的每一首歌。非官方粉絲維護資料庫。",
    url: 'https://culuasonglist.netlify.app',
    siteName: 'CULUA Song Database',
    locale: 'zh_TW',
    type: 'website',
    // ✨ 新增：社群預覽圖片 (目前先用 Icon，建議之後換成 1200x630 的專屬橫幅)
    images: [
      {
        url: '/icon-512x512.png', // 確保 public 資料夾有這張圖
        width: 512,
        height: 512,
        alt: 'CULUA Song Database Logo',
      },
    ],
  },
  
  twitter: {
    card: 'summary_large_image', // 這是大圖卡片模式，非常重要！
    title: "CULUA Song Database",
    description: "搜尋 CULUA 唱過的每一首歌。非官方粉絲維護資料庫。",
    // ✨ 新增：Twitter 專用圖片
    images: ['/icon-512x512.png'], 
    creator: '@CULUA_official', // 這裡可以填 CULUA 的官方帳號或您的帳號
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

// ✨ 修改 2: 加上 async 關鍵字，使其成為 Async Server Component
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ✨ 修改 3: 在 Server 端直接抓取資料 (這行會在伺服器執行)
  // 透過 ISR 機制，這份資料會被快取，不需要每次請求都去 Google Sheet 抓
  const songs = await fetchSongsServer();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "name": "CULUA",
    "url": "https://culuasonglist.netlify.app",
    "description": "Vsinger CULUA 非官方歌回資料庫",
    "sameAs": [
      "https://www.youtube.com/@CULUA",
      "https://twitter.com/CULUA_official"
    ]
  };

  return (
    <html lang="zh-Hant">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          {/* ✨ 修改 4: 把抓到的 songs 傳給 ClientLayout */}
          <ClientLayout initialSongs={songs}>
            {children}
          </ClientLayout>
        </LanguageProvider>
      </body>
    </html>
  );
}