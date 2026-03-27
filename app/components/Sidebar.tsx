'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// ✨ 加入 BarChart2
import { Music2, Mic2, ListMusic, Globe, Instagram, Youtube, Sparkles, Info, BarChart2, Share2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/utils/translations';
import { useState, useEffect } from 'react';

// 自定義圖示
const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
);
const XIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
);

interface SidebarProps {
  onOpenHero?: () => void;
}

export default function Sidebar({ onOpenHero }: SidebarProps) {
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        const channelUrl = 'https://www.youtube.com/@CULUAvsinger/live';
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(channelUrl);
        const response = await fetch(proxyUrl, { cache: 'no-store' });
        const text = await response.text();
        
        if (text.includes('"isLive":true') || text.includes('hqdefault_live.jpg')) {
            setIsLive(true);
        } else {
            setIsLive(false);
        }
      } catch (error) {
        console.error('Live status check failed:', error);
      }
    };
    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: t.nav_home, path: '/', icon: <Music2 size={24} /> },
    { label: t.nav_songs, path: '/songs', icon: <ListMusic size={24} /> },
    { label: t.nav_artists, path: '/artists', icon: <Mic2 size={24} /> },
    { label: t.nav_stats, path: '/stats', icon: <BarChart2 size={24} /> },
    { label: t.nav_social, path: '/social', icon: <Share2 size={20} /> },
    { label: t.about_title, path: '/about', icon: <Info size={24} /> }
  ];

  const socialLinks = [
    { icon: <Youtube size={20} />, href: 'https://www.youtube.com/@CULUAvsinger', label: 'YouTube' },
    { icon: <XIcon size={18} />, href: 'https://x.com/culua0211', label: 'X' },
    { icon: <TikTokIcon size={18} />, href: 'https://www.tiktok.com/@culuavsinger?lang=ja-JP', label: 'TikTok' },
    { icon: <Instagram size={18} />, href: 'https://www.instagram.com/culua0211', label: 'Instagram' },
  ];

  const handleLangClick = () => {
    setLang(lang === 'zh' ? 'ja' : lang === 'ja' ? 'en' : 'zh');
  };

  return (
    <>
      {/* === 手機版 Header === */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-slate-950/95 backdrop-blur border-b border-slate-800 z-50 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-md shrink-0" />
           <span className="font-bold text-lg text-blue-400">DB</span>
        </div>
        
        <div className="flex items-center gap-3">
           {/* 手機版正在直播時：顯示 LIVE 標籤 */}
           {isLive ? (
              <a href="https://www.youtube.com/@CULUAvsinger/live" target="_blank" className="flex items-center gap-1 bg-red-900/30 px-3 py-1 rounded-full border border-red-800 mr-1">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[10px] font-bold text-red-500 ml-1">{t.on_air}</span>
              </a>
           ) : (
             <div className="flex items-center gap-3 pr-2 border-r border-slate-700">
               {socialLinks.map((s) => (
                 <a key={s.label} href={s.href} target="_blank" className="text-slate-400 hover:text-white shrink-0">{s.icon}</a>
               ))}
             </div>
           )}

           <button onClick={handleLangClick} className="flex items-center gap-1 text-slate-300 shrink-0">
             <Globe size={18} />
             <span className="text-[10px] font-bold uppercase">{lang === 'zh' ? '繁' : lang === 'ja' ? 'JP' : 'EN'}</span>
           </button>
        </div>
      </header>

      {/* === 電腦版 Sidebar === */}
      <aside className="hidden lg:flex flex-col w-20 xl:w-64 border-r border-slate-800 bg-slate-950/50 shrink-0 z-30">
        <div className="p-4 flex flex-col items-center xl:items-start justify-center border-b border-slate-800 h-[80px] relative">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg shrink-0" />
            <span className="font-bold text-xl tracking-tight hidden xl:block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">CULUA DB</span>
          </div>
          {isLive && (
            <a href="https://www.youtube.com/@CULUAvsinger/live" target="_blank" className="mt-1 xl:ml-11 flex items-center gap-2 group cursor-pointer">
              <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span>
              <span className="hidden xl:block text-[10px] font-bold text-red-500 tracking-wider">{t.on_air}</span>
            </a>
          )}
        </div>

        <nav className="flex-1 flex flex-col p-2 gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative ${isActive ? 'bg-blue-600/10 text-blue-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <span className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}>{item.icon}</span>
                <span className="hidden xl:block">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 hidden xl:block shadow-[0_0_8px_rgba(96,165,250,0.8)]" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
            <div className="flex flex-col xl:flex-row gap-4 items-center justify-center">
               {socialLinks.map((s) => (
                 <a key={s.label} href={s.href} target="_blank" className="text-slate-500 hover:text-white hover:scale-110">{s.icon}</a>
               ))}
            </div>
            {/* ✨ 修改 3: 語言切換區塊強制置中 (移除 xl:justify-start，改用 justify-center) */}
            <div className="flex gap-1 bg-slate-900 p-1 rounded-lg justify-center">
                {(['zh', 'ja', 'en'] as Language[]).map((l) => (
                    <button key={l} onClick={() => setLang(l)} className={`px-2 py-1 text-xs rounded-md ${lang === l ? 'bg-slate-700 text-white font-bold' : 'text-slate-500'}`}>
                        {l === 'zh' ? '繁' : l === 'ja' ? 'JP' : 'EN'}
                    </button>
                ))}
            </div>
            <div className="text-[10px] text-slate-600 text-center hidden xl:block">{t.footer}</div>
        </div>
      </aside>

      {/* === 手機版 Bottom Nav === */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-50 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive ? 'text-blue-400' : 'text-slate-500'} relative`}>
                <div className={isActive ? 'scale-110' : ''}>{item.icon}</div>
                <span className="text-[10px] font-medium">{item.label}</span>
                
                {/* 底部導航的直播小紅點 (僅首頁顯示) */}
                {isLive && item.path === '/' && (
                    <span className="absolute top-2 right-4 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-slate-900"></span>
                    </span>
                )}
              </Link>
            );
          })}
          
          {/* 推薦按鈕 (僅首頁顯示) */}
          {pathname === '/' && (
            <button onClick={onOpenHero} className="flex flex-col items-center justify-center w-full h-full gap-1 text-yellow-400 hover:text-yellow-200">
              <Sparkles size={24} className="fill-current" />
              <span className="text-[10px] font-medium">推薦</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}