'use client';

import { usePathname } from 'next/navigation';
import React, { useRef, useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useLanguage } from '@/context/LanguageContext';
import HeroSection from './HeroSection';
import YouTubePlayer from './YouTubePlayer';
import { 
  User, ExternalLink, X, Music2, Maximize2, Minimize2, 
  Repeat, Repeat1, Shuffle, Play, Calendar, Share2
} from 'lucide-react';
import ShareModal from './ShareModal';

function extractYouTubeId(url: string) {
  if (!url) return '';
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/);
  return match ? match[1] : '';
}

export default function RightPanel({ onHeroClose }: { onHeroClose?: () => void }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { 
    currentSong, currentVersion, isPlaying,
    closePlayer, playSong, playRandom, playNext,
    isExpanded, toggleExpand, 
    playMode, toggleMode,
    togglePlay, playPrev 
  } = usePlayer();

  const playerRef = useRef<any>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // 全域鍵盤快捷鍵監聽
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      const player = playerRef.current;

      switch (e.code) {
        case 'Space': 
        case 'KeyK': 
          e.preventDefault(); 
          togglePlay(); 
          break;
        case 'KeyN': 
          if (e.shiftKey) playNext();
          break;
        case 'KeyP': 
          if (e.shiftKey) playPrev();
          break;
        case 'ArrowRight':
        case 'KeyL': 
          if (player && typeof player.getCurrentTime === 'function') {
            player.seekTo(player.getCurrentTime() + 5, true);
          }
          break;
        case 'ArrowLeft':
        case 'KeyJ': 
          if (player && typeof player.getCurrentTime === 'function') {
            player.seekTo(player.getCurrentTime() - 5, true);
          }
          break;
        case 'ArrowUp': 
          e.preventDefault();
          if (player && typeof player.getVolume === 'function') {
            player.setVolume(Math.min(player.getVolume() + 10, 100));
          }
          break;
        case 'ArrowDown': 
          e.preventDefault();
          if (player && typeof player.getVolume === 'function') {
            player.setVolume(Math.max(player.getVolume() - 10, 0));
          }
          break;
        case 'KeyM': 
          if (player && typeof player.isMuted === 'function') {
            if (player.isMuted()) player.unMute();
            else player.mute();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, playNext, playPrev]);

  const getModeDisplay = () => {
    switch (playMode) {
      case 'version-loop': 
        return { icon: <Repeat1 size={14} className="text-blue-400" />, text: t.mode_version_loop, color: 'text-blue-400' };
      case 'shuffle': 
        return { icon: <Shuffle size={14} className="text-purple-400" />, text: t.mode_shuffle, color: 'text-purple-400' };
      default: 
        return { icon: <Repeat size={14} className="text-emerald-400" />, text: t.mode_list_loop, color: 'text-emerald-400' };
    }
  };

  const modeDisplay = getModeDisplay();
  const [heroConfig, setHeroConfig] = useState<any>(null);

    useEffect(() => {
      fetch('/api/social-config')
        .then(res => res.json())
        .then(data => setHeroConfig(data))
        .catch(err => console.error("Hero Config Error:", err));
    }, []);
  // ✨ 1. 定義 Hero Section 的推薦歌曲資料與播放邏輯
  // 這段邏輯原本在 if 判斷式裡面，但因為要傳給 HeroSection，必須移到這裡
  const HERO_SONGS = {
    latest: { songName: "てんぺんちー", artist: "CULUA", date: "2025/12/19", url: "https://youtu.be/k8l_5e1MNqE?si=0MyfpZzsvEhqjQop", timestamp: 0 },
    classic: { songName: "ベビ・デビ", artist: "CULUA", date: "2024/5/18", url: "https://youtu.be/Hx1KAdapT1M?si=bhOJJGF40hQSil_U", timestamp: 0 },
    gap: { songName: "スペクトロライト", artist: "CULUA", date: "2025/05/03", url: "https://youtu.be/AqTecLnlcOA?si=siiHrTX9F1b2MykT", timestamp: 0 }
  };

  const handleHeroPlay = (type: 'classic' | 'gap' | 'latest') => {
// 優先從 heroConfig 讀取，若無則使用原本的 HERO_SONGS 預設值
    const videoId = heroConfig?.[`hero_${type}_id`] || (type === 'latest' ? 'k8l_5e1MNqE' : type === 'classic' ? 'Hx1KAdapT1M' : 'AqTecLnlcOA');
    const songName = heroConfig?.[`hero_${type}_title`] || (type === 'latest' ? "てんぺんちー" : type === 'classic' ? "ベビ・デビ" : "スペクトロライト");
    const date = heroConfig?.[`hero_${type}_date`] || (type === 'latest' ? "2025/12/19" : type === 'classic' ? "2024/5/18" : "2025/05/03");
    
    // 手動建構一個符合 GroupedSong 格式的物件
    const manualSong: any = {
      songName,
      artist: "CULUA",
      versions: [{ 
        date, 
        streamUrl: `https://youtu.be/${videoId}`, 
        streamTitle: songName, 
        timestampSeconds: 0 
      }]
    };
    // 播放這首歌的第一個版本
    playSong(manualSong, manualSong.versions[0]);
  };

  // 如果沒有正在播放的歌
  if (!currentSong) {
    if (pathname === '/') {
      return (
        <div className="h-full w-full overflow-hidden bg-slate-900 border-l border-slate-800">
           <HeroSection 
             onPlayRandom={playRandom} 
             onPlaySong={(song) => playSong(song)}
             // ✨ 2. 關鍵修正：將定義好的 handleHeroPlay 傳入
             onPlayRecommended={handleHeroPlay}
           />
        </div>
      );
    }
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-full text-slate-500 space-y-4 bg-slate-900 border-l border-slate-800 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
           <Music2 size={32} className="opacity-50" />
        </div>
        <div>
          <p className="text-lg font-medium text-slate-400">{t.select_song_prompt}</p>
          <p className="text-sm mt-2 opacity-60">
             {t.nav_songs} • {t.nav_recommend} • {t.section_discover}
          </p>
        </div>
      </div>
    );
  }

  // 正在播放時的介面
  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden relative border-l border-slate-800 shadow-2xl lg:shadow-none">
      
      {/* 頂部控制列 */}
      <div className="hidden lg:flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur z-20">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
           <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Now Playing</span>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={toggleExpand} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
             {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
           </button>
           <button onClick={closePlayer} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors text-slate-400">
             <X size={16} />
           </button>
        </div>
      </div>

      {/* 手機版浮動控制區：新增「完全關閉」按鈕 */}
      <div className="lg:hidden absolute top-4 right-4 z-50 flex items-center gap-3">
         {/* 1. 完全停止播放 (Close) */}
         <button 
           onClick={() => {
             closePlayer(); // 停止音樂
             if (onHeroClose) onHeroClose(); // 關閉手機版彈窗
           }} 
           className="p-2 bg-red-500/80 backdrop-blur-md rounded-full text-white shadow-lg shadow-red-900/20 active:scale-90 transition-all"
         >
            <X size={20} />
         </button>

         {/* 2. 僅縮小視窗 (Minimize / Keep Playing) */}
         <button 
           onClick={onHeroClose} 
           className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:bg-black/60 active:scale-90 transition-all"
         >
            <Minimize2 size={20} />
         </button>
      </div>

      {/* 影片區域 */}
      <div className={`relative w-full shrink-0 transition-all duration-300 bg-black aspect-video 
         ${isExpanded ? 'lg:h-[60vh] lg:aspect-auto' : ''}
      `}>
        {currentVersion ? (
           <YouTubePlayer 
             url={currentVersion.streamUrl} 
             startTime={currentVersion.timestampSeconds}
             onEnd={playNext}
             isPlaying={isPlaying}
             onPlayerReady={(player) => {
               playerRef.current = player;
             }}
           />
        ) : (
           <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-950">
             <div className="animate-pulse">Loading Video...</div>
           </div>
        )}
      </div>

      {/* 歌曲資訊與列表 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-slate-900 to-slate-950">
         <div className="p-5 space-y-6">
            <div>
               <h2 className="text-xl lg:text-2xl font-bold leading-tight text-white mb-2 drop-shadow-md">
                 {currentSong.songName}
               </h2>
               <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
                    <User size={14} className="text-blue-400" /> 
                    {currentSong.artist}
                  </span>
                  {currentVersion?.date && (
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
                      <Calendar size={14} className="text-emerald-400" />
                      {currentVersion.date}
                    </span>
                  )}
               </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
               <div className="flex items-center gap-2">
                 <button 
                   onClick={toggleMode}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-slate-700/50 ${modeDisplay.color}`}
                 >
                   {modeDisplay.icon}
                   <span>{modeDisplay.text}</span>
                 </button>
                 
                 {/* ✨ 新增：分享按鈕 */}
                 <button 
                    onClick={() => setIsShareOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-300 hover:bg-blue-500/10 hover:text-blue-200 transition-all"
                    title={t.share_btn}
                 >
                    <Share2 size={14} />
                    <span>{t.share_btn}</span>
                 </button>
               </div>

               {currentVersion && (
                 <a 
                   href={currentVersion.streamUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors group"
                 >
                   <span>{t.original_link}</span>
                   <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                 </a>
               )}
            </div>

            <div>
               <div className="flex items-center justify-between mb-3 px-1">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                   <Repeat size={12} /> {t.versions} ({currentSong.versions.length})
                 </h3>
               </div>
               
               <div className="space-y-2">
                 {currentSong.versions.map((version, idx) => {
                    const isCurrent = currentVersion?.streamUrl === version.streamUrl;
                    const youtubeId = extractYouTubeId(version.streamUrl);
                    
                    return (
                      <button
                        key={`${version.date}-${idx}`}
                        onClick={() => playSong(currentSong, version)}
                        className={`w-full group flex items-center gap-3 p-2 rounded-lg transition-all border text-left
                          ${isCurrent 
                            ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.1)]' 
                            : 'bg-slate-800/30 border-transparent hover:bg-slate-800 hover:border-slate-700'
                          }
                        `}
                      >
                         <div className="relative w-16 aspect-video rounded-md overflow-hidden bg-slate-900 shrink-0 shadow-sm group-hover:shadow-md transition-all">
                            {youtubeId && (
                               <img 
                                 src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`} 
                                 alt=""
                                 className={`w-full h-full object-cover transition-opacity duration-300 ${isCurrent ? 'opacity-80' : 'opacity-60 group-hover:opacity-100'}`}
                               />
                            )}
                            {isCurrent && (
                               <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <div className="w-2 h-3 bg-white mx-0.5 animate-bounce [animation-delay:-0.15s]" />
                                  <div className="w-2 h-4 bg-white mx-0.5 animate-bounce" />
                                  <div className="w-2 h-2 bg-white mx-0.5 animate-bounce [animation-delay:-0.3s]" />
                               </div>
                            )}
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium truncate mb-0.5 ${isCurrent ? 'text-blue-300' : 'text-slate-300 group-hover:text-white'}`}>
                               {version.streamTitle}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-400">
                               <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">{version.date}</span>
                            </div>
                         </div>
                      </button>
                    );
                 })}
               </div>
            </div>

            {/* ✨ 渲染 ShareModal */}
            {currentSong && currentVersion && (
              <ShareModal 
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                song={currentSong}
                version={currentVersion}
              />
            )}
         </div>
      </div>
    </div>
  );
}