'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { PlayerProvider, usePlayer } from '@/context/PlayerContext';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import { GroupedSong } from '@/utils/dataProcessor';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentSong, isExpanded } = usePlayer();
  const isHomePage = pathname === '/';
  
  const [showMobileHero, setShowMobileHero] = useState(false);

  // 手勢變數
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current) return;
    const distance = touchEndY.current - touchStartY.current;
    if (distance > 100) {
      setShowMobileHero(false);
    }
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  useEffect(() => {
    if (currentSong) setShowMobileHero(false);
  }, [currentSong]);

  // 右側面板樣式邏輯
  let rightPanelClass = "hidden lg:block border-l border-slate-800 bg-slate-900 transition-all duration-300";
  if (currentSong) {
    const desktopWidthClass = isExpanded ? 'lg:w-[50%] xl:w-[55%]' : 'lg:w-[450px]';
    rightPanelClass = `fixed inset-0 z-[60] lg:static ${desktopWidthClass} block bg-slate-900`;
  } else {
    if (isHomePage) rightPanelClass = "hidden lg:block flex-1 bg-slate-900";
    else rightPanelClass = "hidden lg:block w-[350px] lg:w-[450px]";
  }

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-slate-900 text-slate-100">
      <Sidebar onOpenHero={() => setShowMobileHero(true)} />

      {/* ✨ 修正重點：
          1. 移除 mt-14, mb-16 (Margin 容易導致版面溢出)
          2. 改用 pt-14 (避開上方 Header), pb-16 (避開下方 Nav)
          3. 保留 h-full 與 flex-1 確保佔滿剩餘空間
      */}
      <div className="flex flex-col flex-1 min-w-0 h-full border-r border-slate-800 pt-14 pb-16 lg:pt-0 lg:pb-0 relative">
        
        {/* 手機版 Hero 彈窗 */}
        {showMobileHero && (
          <div 
            className="lg:hidden fixed inset-0 z-[100] bg-slate-900 flex flex-col animate-in slide-in-from-bottom-5 duration-200"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex-1 overflow-hidden relative">
               <RightPanel onHeroClose={() => setShowMobileHero(false)} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </div>

      <div className={rightPanelClass}>
        <RightPanel />
      </div>
    </div>
  );
}

export default function ClientLayout({ 
  children, 
  initialSongs 
}: { 
  children: React.ReactNode; 
  initialSongs: GroupedSong[]; 
}) {
  return (
    <PlayerProvider initialSongs={initialSongs}>
      <LayoutContent>{children}</LayoutContent>
    </PlayerProvider>
  );
}