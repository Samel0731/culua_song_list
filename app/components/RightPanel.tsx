'use client';

import { usePathname } from 'next/navigation';
import { usePlayer, PlayMode } from '@/context/PlayerContext';
import { useLanguage } from '@/context/LanguageContext';
import HeroSection from './HeroSection';
import YouTubePlayer from './YouTubePlayer';
import { 
  User, ExternalLink, X, Music2, Maximize2, Minimize2, 
  Repeat, Repeat1, Shuffle, Play, Calendar
} from 'lucide-react';

function extractYouTubeId(url: string) {
  if (!url) return '';
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/);
  return match ? match[1] : '';
}

export default function RightPanel() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { 
    currentSong, currentVersion, isPlaying,
    closePlayer, playSong, playRandom, playNext,
    isExpanded, toggleExpand, 
    playMode, toggleMode
  } = usePlayer();

  // 取得模式對應的 Icon 與文字
  const getModeDisplay = () => {
    switch (playMode) {
      case 'version-loop': 
        return { icon: <Repeat1 size={14} />, text: '換直播 (循環版本)', color: 'text-blue-400' };
      case 'shuffle': 
        return { icon: <Shuffle size={14} />, text: '隨機播放', color: 'text-green-400' };
      default: 
        return { icon: <Repeat size={14} />, text: '換歌 (循環列表)', color: 'text-slate-400' };
    }
  };
  
  const modeInfo = getModeDisplay();

  // 假設結束時間 (若資料庫有更新可從這裡取得)
  const endTime = undefined; 

  if (currentSong && currentVersion) {
    return (
      <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 relative shadow-2xl z-20">
         
         {/* 右上角功能按鈕 */}
         <div className="absolute top-2 right-2 z-50 flex gap-2">
            <button onClick={toggleExpand} className="hidden lg:flex items-center justify-center bg-black/60 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors shadow-lg">
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={closePlayer} className="bg-black/60 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors shadow-lg">
              <X size={16} />
            </button>
         </div>

        {/* 播放器區域 */}
        <div className="aspect-video bg-black shrink-0 w-full relative">
          <YouTubePlayer
            url={currentVersion.streamUrl}
            startTime={currentVersion.timestampSeconds}
            endTime={endTime}
            onEnd={playNext}  // 自動根據模式播放下一首
            isPlaying={isPlaying}
          />
        </div>

        {/* 資訊與列表區域 */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin scrollbar-thumb-slate-700">
            
            {/* 1. 簡潔的歌名與歌手顯示 (回歸原始設計) */}
            <div className="mb-4">
                <h3 className="text-xl lg:text-2xl font-bold text-white break-words leading-tight">
                  {currentSong.songName}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-blue-400 flex items-center gap-2 text-sm font-medium">
                    <User size={16}/> {currentSong.artist}
                  </p>
                  
                  {/* 原始連結按鈕 */}
                  <a
                    href={`https://www.youtube.com/watch?v=${extractYouTubeId(currentVersion.streamUrl)}&t=${currentVersion.timestampSeconds}s`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors"
                  >
                    <ExternalLink size={12} /> {t.original_link}
                  </a>
                </div>
            </div>

            {/* 2. 播放模式切換 (取代巨大的控制列) */}
            <div className="flex items-center gap-2 mb-6">
                <button 
                  onClick={toggleMode}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/50 hover:bg-slate-700 transition-colors text-xs font-medium ${modeInfo.color}`}
                >
                    {modeInfo.icon}
                    <span>{modeInfo.text}</span>
                </button>
            </div>

            {/* 3. 直播版本清單 (Versions List) - 恢復顯示！ */}
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Music2 size={12}/> 
                    {t.versions} ({currentSong.versions.length})
                </h3>
                <div className="grid gap-2">
                    {currentSong.versions.map((ver, idx) => {
                    const isSelected = ver === currentVersion;
                    return (
                        <button
                        key={idx}
                        onClick={() => playSong(currentSong, ver)}
                        className={`w-full p-3 rounded-lg flex items-center gap-3 text-left border transition-all duration-200
                            ${isSelected
                                ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-inner' // 使用紫色系凸顯
                                : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                            }`}
                        >
                        <div className={`p-1.5 rounded-full shrink-0 ${isSelected ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                            <Play size={10} className={isSelected ? "fill-current" : ""} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                    {ver.date}
                                </span>
                                {idx === 0 && (
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                    LATEST
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                                <Calendar size={10} />
                                {ver.streamTitle || 'Stream Archive'}
                            </div>
                        </div>
                        </button>
                    );
                    })}
                </div>
            </div>

        </div>
      </div>
    );
  }

  // Hero Section 邏輯 (保持不變)
  if (pathname === '/') {
    const HERO_SONGS = {
        latest: {
            songName: "てんぺんちー", artist: "CULUA", date: "2025/12/19",
            url: "https://youtu.be/k8l_5e1MNqE?si=0MyfpZzsvEhqjQop", timestamp: 0
        },
        classic: {
            songName: "ベビ・デビ", artist: "CULUA", date: "2024/5/18",
            url: "https://youtu.be/Hx1KAdapT1M?si=bhOJJGF40hQSil_U", timestamp: 0 
        },
        gap: {
            songName: "スペクトロライト", artist: "CULUA", date: "2025/05/03",
            url: "https://youtu.be/AqTecLnlcOA?si=siiHrTX9F1b2MykT", timestamp: 0
        }
    };

    const handleHeroPlay = (type: 'classic' | 'gap' | 'latest') => {
        const target = HERO_SONGS[type];
        const manualSong: any = {
            songName: target.songName,
            artist: target.artist,
            versions: [{
                date: target.date,
                streamUrl: target.url,
                streamTitle: target.songName,
                timestampSeconds: target.timestamp,
            }]
        };
        playSong(manualSong);
    };

    return <HeroSection onPlayRecommended={handleHeroPlay} onSurprise={playRandom} />;
  }

  return (
    <div className="hidden lg:flex flex-1 items-center justify-center text-slate-600 bg-slate-900 border-l border-slate-800 h-full">
        <div className="text-center">
            <Music2 className="mx-auto mb-4 opacity-20 w-16 h-16" />
            <p>{t.select_song_prompt}</p>
        </div>
    </div>
  );
}