import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Music, Mic2, Home } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CULUA SONG LIST",
  description: "CULUA 歌った曲リスト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        {/* 全局容器：設定高度為視窗高度，背景深色 */}
        <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
          
          {/* --- 左側導覽列 (Sidebar) --- */}
          <aside className="w-16 lg:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 z-50">
            
            {/* Logo */}
            <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800 bg-slate-950">
              <span className="font-bold text-xl tracking-wider hidden lg:block text-blue-400">CULUA SONG LIST</span>
              <span className="font-bold text-xl lg:hidden text-blue-400">DB</span>
            </div>

            {/* 選單連結 */}
            <nav className="flex-1 py-4 space-y-2 px-2 overflow-y-auto">
              {/* 首頁 (歌った曲一覧) */}
              <Link href="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors group">
                <Home size={24} className="group-hover:text-blue-400" />
                <span className="hidden lg:block font-medium">歌った曲一覧</span>
              </Link>

              {/* 曲名一覧 */}
              <Link href="/songs" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors group">
                <Music size={24} className="group-hover:text-purple-400" />
                <span className="hidden lg:block font-medium">曲名一覧</span>
              </Link>

              {/* アーティスト一覧 */}
              <Link href="/artists" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors group">
                <Mic2 size={24} className="group-hover:text-pink-400" />
                <span className="hidden lg:block font-medium">アーティスト一覧</span>
              </Link>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center lg:text-left">
              <span className="hidden lg:inline">Fan Made Web</span>
            </div>
          </aside>

          {/* --- 右側主內容區 (頁面內容會顯示在這裡) --- */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}