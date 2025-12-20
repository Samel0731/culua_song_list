import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 修改重點：加上大括號 { }
import { LanguageProvider } from "@/context/LanguageContext";
import ClientLayout from "@/app/components/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

// ... metadata 保持不變 ...
export const metadata: Metadata = {
  metadataBase: new URL('https://culuasonglist.netlify.app'),
  title: {
    default: "CULUA Song Database",
    template: "%s | CULUA Song Database"
  },
  description: "非官方 CULUA 粉絲歌回資料庫。收錄 CULUA 的歷年歌回、翻唱曲目、原創曲與直播紀錄。搜尋 CULUA 唱過的歌最方便的工具。Fan-made database for VSinger CULUA.",
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
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <LanguageProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </LanguageProvider>
      </body>
    </html>
  );
}