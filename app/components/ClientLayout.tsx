'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { PlayerProvider, usePlayer } from '@/context/PlayerContext';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import { GroupedSong } from '@/utils/dataProcessor';
import { Maximize2, Music2, ChevronUp } from 'lucide-react'; // ✨ 新增 Icon

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentSong, isExpanded } = usePlayer();
  const isHomePage = pathname === '/';
  const isFocusMode = pathname === '/focus';
  
  // ✨ 新增：手機版播放器是否展開 (預設不展開)
  const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState(false);
  const [showMobileHero, setShowMobileHero] = useState(false);

  // 當開始播歌時，自動展開手機播放器
  useEffect(() => {
    if (currentSong) {
      setIsMobilePlayerOpen(true);
    }
  }, [currentSong]);

  // 手機版手勢邏輯 (這裡主要是給 Hero Popup 用的，可以保留)
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

  // ✨ 關鍵修改：計算右側面板的樣式 (包含手機版縮小邏輯)
  let rightPanelClass = "hidden lg:block border-l border-slate-800 bg-slate-900 transition-all duration-300";
  
  if (currentSong) {
    const desktopWidthClass = isExpanded ? 'lg:w-[50%] xl:w-[55%]' : 'lg:w-[450px]';
    
    // 手機版邏輯：如果 isMobilePlayerOpen 為 true 才全螢幕，否則隱藏 (變成背景播放)
    // 我們使用 opacity-0 和 pointer-events-none 來「隱藏」它，但保留 DOM 以維持音樂播放
    const mobileClass = isMobilePlayerOpen 
      ? 'fixed inset-0 z-[60] block' // 展開
      : 'fixed bottom-0 right-0 w-1 h-1 opacity-0 pointer-events-none -z-50'; // 縮小 (隱形)

    // 桌面版邏輯：永遠顯示 (static)
    const desktopClass = `lg:static lg:opacity-100 lg:pointer-events-auto lg:z-auto lg:block ${desktopWidthClass}`;

    rightPanelClass = `${mobileClass} ${desktopClass} bg-slate-900`;
  } else {
    // 沒播歌時的邏輯 (Hero Section 等)
    if (isHomePage) rightPanelClass = "hidden lg:block flex-1 bg-slate-900";
    else rightPanelClass = "hidden lg:block w-[350px] lg:w-[450px]";
  }

  // 專注模式強制隱藏
  if (isFocusMode) {
    rightPanelClass = "fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none -z-50 overflow-hidden";
  }

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-slate-900 text-slate-100">
      
      {!isFocusMode && <Sidebar onOpenHero={() => setShowMobileHero(true)} />}

      <div className={`flex flex-col flex-1 min-w-0 h-full border-r border-slate-800 relative
          ${isFocusMode ? 'p-0 border-none' : 'pt-14 pb-16 lg:pt-0 lg:pb-0'} 
      `}>
        
        {/* 手機版 Hero 彈窗 */}
        {!isFocusMode && showMobileHero && !currentSong && (
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

        {/* 頁面內容 */}
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>

        {/* ✨ 新增：手機版迷你播放列 (當播放中且被縮小時顯示) */}
        {!isFocusMode && currentSong && !isMobilePlayerOpen && (
           <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[55] bg-slate-900/95 backdrop-blur border-t border-slate-800 p-2 safe-area-pb">
              <div 
                 onClick={() => setIsMobilePlayerOpen(true)}
                 className="flex items-center gap-3 bg-slate-800 rounded-xl p-2 pr-4 shadow-lg active:scale-[0.98] transition-transform cursor-pointer"
              >
                 {/* 縮圖動畫 */}
                 <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center overflow-hidden shrink-0 relative">
                    <div className="absolute inset-0 bg-blue-600/20 animate-pulse" />
                    <Music2 size={18} className="text-blue-400 relative z-10" />
                 </div>
                 
                 {/* 歌曲資訊 */}
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate leading-tight">{currentSong.songName}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{currentSong.artist}</p>
                 </div>

                 {/* 展開圖示 */}
                 <div className="text-slate-400 animate-bounce-small">
                    <ChevronUp size={20} />
                 </div>
              </div>
           </div>
        )}

      </div>

      {/* 右側面板 (主播放器) */}
      <div className={rightPanelClass}>
        {/* ✨ 關鍵修正：傳入 setIsMobilePlayerOpen(false) 讓縮小按鈕生效 */}
        <RightPanel onHeroClose={() => setIsMobilePlayerOpen(false)} />
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