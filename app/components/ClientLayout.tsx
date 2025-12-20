'use client';

import React from 'react';
import { PlayerProvider, usePlayer } from '@/context/PlayerContext';
import { usePathname } from 'next/navigation';
import RightPanel from './RightPanel';
import Sidebar from './Sidebar';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // 引入 isExpanded
  const { currentSong, isExpanded } = usePlayer();

  let rightPanelClass = "hidden lg:block border-l border-slate-800 bg-slate-900";
  
  if (currentSong) {
    // 手機: 全螢幕
    // 電腦: 根據 isExpanded 判斷
    // 若 expanded: w-1/2 (50%) 或是 min-w-[50%] flex-1
    // 若 normal: w-[450px]
    const desktopWidthClass = isExpanded ? 'lg:w-[50%] xl:w-[55%]' : 'lg:w-[450px]';
    
    rightPanelClass = `fixed inset-0 z-50 lg:static ${desktopWidthClass} lg:block bg-slate-900 transition-all duration-300 ease-in-out`;
  } else {
    // 沒播歌時 (Hero 模式)
    if (pathname === '/') {
       rightPanelClass = "hidden lg:block flex-1";
    } else {
       rightPanelClass = "hidden lg:block w-[350px] lg:w-[450px]";
    }
  }

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-slate-900 text-slate-100">
      
      <Sidebar />

      {/* 中間列表：
          當右側變大 (50%) 時，左側自然會被擠小。
          flex-1 會自動處理剩餘空間。
      */}
      <div className={`flex flex-col min-w-0 h-full border-r border-slate-800 mb-16 lg:mb-0
        ${pathname === '/' && !currentSong ? 'w-full lg:w-96' : 'flex-1'}
      `}>
        {children}
      </div>

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