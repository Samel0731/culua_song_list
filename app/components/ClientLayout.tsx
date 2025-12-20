'use client';

import Link from "next/link";
import { Music, Mic2, Home, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useLanguage();
  const pathname = usePathname();

  // 判斷連結是否啟用 (用於高亮顯示)
  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      
      {/* --- 左側導覽列 --- */}
      <aside className="w-16 lg:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 z-50">
        
        {/* Logo */}
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800 bg-slate-950">
          <span className="font-bold text-xl tracking-wider hidden lg:block text-blue-400">CULUA DB</span>
          <span className="font-bold text-xl lg:hidden text-blue-400">DB</span>
        </div>

        {/* 選單連結 */}
        <nav className="flex-1 overflow-y-auto p-2 lg:p-4 space-y-2">
          
          <Link href="/" className={`flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg transition-colors group ${isActive('/') ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
            <Home size={24} className={isActive('/') ? "text-blue-400" : "group-hover:text-blue-400"} />
            <span className="hidden lg:block font-medium">{t.nav_home}</span>
          </Link>

          <Link href="/songs" className={`flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg transition-colors group ${isActive('/songs') ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
            <Music size={24} className={isActive('/songs') ? "text-purple-400" : "group-hover:text-purple-400"} />
            <span className="hidden lg:block font-medium">{t.nav_songs}</span>
          </Link>

          <Link href="/artists" className={`flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg transition-colors group ${isActive('/artists') ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
            <Mic2 size={24} className={isActive('/artists') ? "text-pink-400" : "group-hover:text-pink-400"} />
            <span className="hidden lg:block font-medium">{t.nav_artists}</span>
          </Link>
        </nav>

        {/* --- 語言切換區 --- */}
        <div className="p-2 lg:p-4 border-t border-slate-800">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-2">
            <button 
              onClick={() => setLang('ja')} 
              className={`text-xs px-2 py-1 rounded border ${lang === 'ja' ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
            >
              JP
            </button>
            <button 
              onClick={() => setLang('zh')} 
              className={`text-xs px-2 py-1 rounded border ${lang === 'zh' ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
            >
              繁
            </button>
            <button 
              onClick={() => setLang('en')} 
              className={`text-xs px-2 py-1 rounded border ${lang === 'en' ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
            >
              EN
            </button>
          </div>
          <div className="mt-2 text-[10px] text-slate-600 text-center hidden lg:block">
            {t.footer}
          </div>
        </div>
      </aside>

      {/* --- 右側主內容區 --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {children}
      </main>
      
    </div>
  );
}