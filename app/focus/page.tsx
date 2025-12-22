'use client';

// ✨ 修正：加入 useRef
import { useState, useEffect, useCallback, useRef } from 'react'; 
import { useLanguage } from '@/context/LanguageContext';
import { usePlayer } from '@/context/PlayerContext';
import { SkipForward, LogOut, Music2 } from 'lucide-react'; 
import Link from 'next/link';

export default function FocusPage() {
  const { t } = useLanguage();
  const { allSongs, currentSong, playSong } = usePlayer();
  const [time, setTime] = useState<Date | null>(null);
  
  // UI 顯示狀態 (預設顯示)
  const [showUI, setShowUI] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 螢幕恆亮 (Screen Wake Lock)
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake Lock not supported or rejected', err);
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  // 自動隱藏 UI 邏輯
  const resetInteraction = useCallback(() => {
    setShowUI(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    // 3秒無動作自動隱藏
    hideTimerRef.current = setTimeout(() => setShowUI(false), 3000);
  }, []);

  useEffect(() => {
    // 監聽滑鼠移動、點擊、觸控
    window.addEventListener('mousemove', resetInteraction);
    window.addEventListener('click', resetInteraction);
    window.addEventListener('touchstart', resetInteraction);
    
    // 初始啟動計時器
    resetInteraction();

    return () => {
      window.removeEventListener('mousemove', resetInteraction);
      window.removeEventListener('click', resetInteraction);
      window.removeEventListener('touchstart', resetInteraction);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetInteraction]);


  // 時間更新 (每秒)
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 隨機播放邏輯
  const playRandomSong = () => {
    if (allSongs.length === 0) return;
    const songs = allSongs; 
    if (songs.length === 0) return;
    const random = songs[Math.floor(Math.random() * songs.length)];
    playSong(random);
  };

  useEffect(() => {
    if (allSongs.length > 0 && !currentSong) {
      playRandomSong();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSongs.length]);

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-slate-950 transition-all duration-500 ${!showUI ? 'cursor-none' : ''}`}>
      
      {/* 背景光暈 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
         <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* 歌曲背景圖 */}
      {currentSong && (
        <div className="absolute inset-0 z-0 opacity-20 scale-110 transition-all duration-1000 ease-in-out pointer-events-none">
           <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-slate-900 to-black" />
        </div>
      )}

      {/* 核心內容 */}
      <div className="relative z-10 text-center space-y-8 px-4 w-full max-w-4xl">
        
        {/* 時間顯示 (UI 隱藏時變暗並放大) */}
        <div className={`h-24 md:h-40 flex items-center justify-center transition-all duration-1000 ${showUI ? 'opacity-100' : 'opacity-60 scale-110'}`}>
          {time ? (
            <div className="text-[5rem] md:text-[8rem] font-thin tracking-wider text-slate-100/90 font-mono tabular-nums leading-none">
              {time.toLocaleTimeString(t.focus_time_format === 'en-US' ? 'en-US' : [], { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          ) : (
            <div className="text-[5rem] md:text-[8rem] font-thin text-slate-800 animate-pulse">--:--</div>
          )}
        </div>

        {/* 歌曲資訊 (UI 隱藏時變暗) */}
        <div className={`space-y-4 min-h-[120px] transition-opacity duration-700 ${showUI ? 'opacity-100' : 'opacity-40'}`}>
          {currentSong ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg leading-tight px-4 line-clamp-2">
                {currentSong.songName}
              </h1>
              <p className="text-lg md:text-xl text-blue-300 mt-3 flex items-center justify-center gap-2">
                <Music2 size={20} /> {currentSong.artist}
              </p>
            </div>
          ) : (
            <p className="text-slate-500 text-xl animate-pulse">{t.loading}</p>
          )}
        </div>

        {/* 控制按鈕區：根據 showUI 狀態顯示/隱藏 */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-6 pt-12 transition-all duration-500 ${showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
          <Link 
            href="/" 
            className="group flex items-center gap-3 px-8 py-3 rounded-full bg-slate-800/40 hover:bg-slate-700/60 backdrop-blur-md text-slate-300 transition-all border border-slate-700/50 hover:border-slate-500 hover:text-white"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-lg">{t.focus_exit}</span>
          </Link>

          <button 
            onClick={playRandomSong}
            className="group flex items-center gap-3 px-10 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 transition-all hover:scale-105 active:scale-95"
          >
            <SkipForward size={24} className="fill-current group-hover:translate-x-1 transition-transform" />
            <span className="text-lg font-bold tracking-wide">{t.focus_next}</span>
          </button>
        </div>
      </div>

      {/* 底部小提示 */}
      <div className={`absolute bottom-8 text-slate-500 text-[10px] md:text-xs tracking-[0.2em] uppercase transition-opacity duration-500 ${showUI ? 'opacity-50' : 'opacity-0'}`}>
        {t.focus_hint_ui}
      </div>
    </div>
  );
}