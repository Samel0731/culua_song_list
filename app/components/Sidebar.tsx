'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music2, Mic2, ListMusic, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/utils/translations';

export default function Sidebar() {
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();

  const navItems = [
    { 
      label: t.nav_home, 
      path: '/', 
      icon: <Music2 size={24} /> 
    },
    { 
      label: t.nav_songs, 
      path: '/songs', 
      icon: <ListMusic size={24} /> 
    },
    { 
      label: t.nav_artists, 
      path: '/artists', 
      icon: <Mic2 size={24} /> 
    }
  ];

  // 手機版：循環切換語言
  const handleMobileLangClick = () => {
    if (lang === 'zh') setLang('ja');
    else if (lang === 'ja') setLang('en');
    else setLang('zh');
  };

  return (
    <>
      {/* === 電腦版側邊欄 (Desktop Sidebar) === */}
      <aside className="hidden lg:flex flex-col w-20 xl:w-64 border-r border-slate-800 bg-slate-950/50 shrink-0 z-30">
        <div className="p-4 flex items-center justify-center xl:justify-start gap-3 border-b border-slate-800 h-[60px]">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg shrink-0" />
          <span className="font-bold text-xl tracking-tight hidden xl:block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            CULUA DB
          </span>
        </div>

        <nav className="flex-1 flex flex-col p-2 gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-600/10 text-blue-400 font-bold' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
              >
                <span className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}>
                  {item.icon}
                </span>
                <span className="hidden xl:block">{item.label}</span>
                {isActive && (
                   <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 hidden xl:block shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* 語言切換區 (Desktop Only) */}
        <div className="p-4 border-t border-slate-800">
            <div className="flex flex-col xl:flex-row gap-2 justify-center xl:justify-between items-center">
                <div className="flex gap-1 bg-slate-900 p-1 rounded-lg">
                    {(['zh', 'ja', 'en'] as Language[]).map((l) => (
                        <button
                            key={l}
                            onClick={() => setLang(l)}
                            className={`px-2 py-1 text-xs rounded-md transition-all ${
                                lang === l 
                                ? 'bg-slate-700 text-white font-bold shadow' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {l === 'zh' ? '繁' : l === 'ja' ? 'JP' : 'EN'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="mt-3 text-[10px] text-slate-600 text-center hidden xl:block">
                {t.footer}
            </div>
        </div>
      </aside>

      {/* === 手機版底部導覽 (Mobile Bottom Nav) === */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-50 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {/* 一般導覽按鈕 */}
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors
                  ${isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}
                `}
              >
                <div className={isActive ? 'scale-110 transition-transform' : ''}>
                    {item.icon}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* 手機版語言切換按鈕 (第4個按鈕) */}
          <button
            onClick={handleMobileLangClick}
            className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <div className="relative">
                <Globe size={24} />
                <span className="absolute -top-1 -right-2 text-[9px] bg-slate-700 text-slate-200 px-1 rounded-full border border-slate-600">
                    {lang === 'zh' ? '繁' : lang === 'ja' ? 'JP' : 'EN'}
                </span>
            </div>
            <span className="text-[10px] font-medium">Language</span>
          </button>
        </div>
      </nav>
    </>
  );
}