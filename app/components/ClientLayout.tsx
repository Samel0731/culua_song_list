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
  
  // ✨ 新增：判斷是否為專注模式
  const isFocusMode = pathname === '/focus';
  
  const [showMobileHero, setShowMobileHero] = useState(false);

  // 手機版手勢邏輯 (向下滑動關閉播放器)
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

  // 計算右側面板的樣式
  let rightPanelClass = "hidden lg:block border-l border-slate-800 bg-slate-900 transition-all duration-300";
  
  if (currentSong) {
    const desktopWidthClass = isExpanded ? 'lg:w-[50%] xl:w-[55%]' : 'lg:w-[450px]';
    rightPanelClass = `fixed inset-0 z-[60] lg:static ${desktopWidthClass} block bg-slate-900`;
  } else {
    if (isHomePage) rightPanelClass = "hidden lg:block flex-1 bg-slate-900";
    else rightPanelClass = "hidden lg:block w-[350px] lg:w-[450px]";
  }

  // ✨ 重點修改：如果是專注模式，強制隱藏 RightPanel
  // 使用 fixed -z-50 opacity-0 把它藏到畫面背後，但保留在 DOM 中以維持音樂播放
  if (isFocusMode) {
    rightPanelClass = "fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none -z-50 overflow-hidden";
  }

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-slate-900 text-slate-100">
      
      {/* ✨ 專注模式下不顯示 Sidebar */}
      {!isFocusMode && <Sidebar onOpenHero={() => setShowMobileHero(true)} />}

      <div className={`flex flex-col flex-1 min-w-0 h-full border-r border-slate-800 relative
          ${isFocusMode ? 'p-0 border-none' : 'pt-14 pb-16 lg:pt-0 lg:pb-0'} 
      `}>
        
        {/* 手機版 Hero 彈窗 (專注模式不顯示) */}
        {!isFocusMode && showMobileHero && (
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

      {/* 右側面板 (專注模式下會變透明並隱藏到背後) */}
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