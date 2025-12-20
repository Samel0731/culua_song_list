'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PlayerProvider, usePlayer } from '@/context/PlayerContext';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import { X } from 'lucide-react';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentSong, isExpanded } = usePlayer();
  const isHomePage = pathname === '/';
  
  // 手機版 Hero 彈窗狀態
  const [showMobileHero, setShowMobileHero] = useState(false);

  // 播放歌曲後自動關閉彈窗
  useEffect(() => {
    if (currentSong) setShowMobileHero(false);
  }, [currentSong]);

  // 電腦版右側面板邏輯
  let rightPanelClass = "hidden lg:block border-l border-slate-800 bg-slate-900 transition-all duration-300";
  if (currentSong) {
    const desktopWidthClass = isExpanded ? 'lg:w-[50%] xl:w-[55%]' : 'lg:w-[450px]';
    rightPanelClass = `fixed inset-0 z-[60] lg:static ${desktopWidthClass} block bg-slate-900`;
  } else {
    // 沒播歌且在首頁：電腦版顯示 Hero，手機版不顯示(改用彈窗)
    if (isHomePage) rightPanelClass = "hidden lg:block flex-1 bg-slate-900";
    else rightPanelClass = "hidden lg:block w-[350px] lg:w-[450px]";
  }

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-slate-900 text-slate-100">
      <Sidebar onOpenHero={() => setShowMobileHero(true)} />

      {/* 主內容區：mt-14 避開 Header, mb-16 避開 Nav */}
      <div className="flex flex-col flex-1 min-w-0 h-full border-r border-slate-800 mb-16 lg:mb-0 mt-14 lg:mt-0 relative">
        
        {/* ✨ 手機版 Hero 彈窗 (Full Screen Modal) */}
        {showMobileHero && (
          <div className="lg:hidden fixed inset-0 z-[100] bg-slate-900 flex flex-col animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950">
              <span className="font-bold text-lg text-yellow-400">推薦內容</span>
              <button onClick={() => setShowMobileHero(false)} className="p-2 bg-slate-800 rounded-full text-slate-300">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden relative">
               {/* 傳入 onHeroClose 確保 HeroSection 內部也能關閉 */}
               <RightPanel onHeroClose={() => setShowMobileHero(false)} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          {children}
        </div>
      </div>

      {/* 電腦版右側面板 */}
      <div className={rightPanelClass}>
        <RightPanel />
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <LayoutContent>{children}</LayoutContent>
    </PlayerProvider>
  );
}