import type { Metadata, Viewport } from "next"; // 1. 新增 Viewport 型別
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import ClientLayout from "@/app/components/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

// 2. 新增 Viewport 設定 (PWA 必備)
// 這些設定讓網站在手機上看起來更像原生 App (禁止縮放、設定狀態列顏色)
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
  // 3. 連結 manifest.json (PWA 身分證)
  manifest: "/manifest.json",
  keywords: [
    "CULUA", "クルア", "くるあ", "VSinger", "Vtuber", 
    "歌回", "歌枠", "歌ってみた", "Song List", "Setlist", 
    "資料庫", "Database", "非官方", "Fan made", "歌詞",
    "RK Music", "翻唱", "Cover", "原創曲", "Original Song"
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 4. 定義 JSON-LD 結構化資料 (SEO 關鍵)
  // 這會告訴搜尋引擎：這是一個關於 CULUA 的音樂相關網站
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "name": "CULUA",
    "url": "https://culuasonglist.netlify.app",
    "description": "Vsinger CULUA 非官方歌回資料庫",
    "sameAs": [
      "https://www.youtube.com/@CULUAvsinger",
      "https://x.com/culua0211",
      "https://www.tiktok.com/@culuavsinger"
    ]
  };

  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        {/* 5. 注入 JSON-LD 腳本 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        <LanguageProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </LanguageProvider>
      </body>
    </html>
  );
}