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
    default: "CULUA Song Database",
    template: "%s | CULUA Song Database"
  },
  description: "非官方 CULUA 粉絲歌回資料庫。收錄 CULUA 的歷年歌回、翻唱曲目、原創曲與直播紀錄。搜尋 CULUA 唱過的歌最方便的工具。Fan-made database for VSinger CULUA.",
  manifest: "/manifest.json",
  keywords: [
    "CULUA", "クルア", "くるあ", "VSinger", "Vtuber", 
    "歌回", "歌枠", "歌ってみた", "Song List", "Setlist", 
    "Cover", "原創曲", "Original Song"
  ],
  authors: [{ name: "Samel" }],
  openGraph: {
    title: "CULUA Song Database | 歌枠データベース",
    description: "搜尋 CULUA 唱過的每一首歌。非官方粉絲維護資料庫。",
    url: 'https://culuasonglist.netlify.app',
    siteName: 'CULUA Song Database',
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "CULUA Song Database",
    description: "非官方 CULUA 歌回資料庫",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'axWifotevlNtJhso8FBSxrdqWEPxn_FUve9-5slsGMM',
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