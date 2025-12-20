'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchAndProcessSongs, GroupedSong, SongVersion } from '@/utils/dataProcessor';
import { Music2, User, ExternalLink, RefreshCw, Play, Search, X } from 'lucide-react';
import YouTubePlayer from '@/app/components/YouTubePlayer';
import HeroSection from '@/app/components/HeroSection';
import { useLanguage } from '@/context/LanguageContext';

/* ========= 設定：首頁 Hero 手動推薦歌曲 ========= */
const HERO_SONGS = {
  latest: {
    songName: "てんぺんちー",
    artist: "CULUA",
    date: "2025/12/19",
    url: "https://youtu.be/k8l_5e1MNqE?si=doOmsKxLjeTPiKUQ",
    timestamp: 0
  },
  classic: {
    songName: "ベビ・デビ",
    artist: "CULUA",
    date: "2024/5/18",
    url: "https://youtu.be/Hx1KAdapT1M?si=bhOJJGF40hQSil_U",
    timestamp: 0 
  },
  gap: {
    songName: "スペクトロライト", 
    artist: "CULUA",
    date: "2025/05/03",
    url: "https://youtu.be/AqTecLnlcOA?si=siiHrTX9F1b2MykT",
    timestamp: 0
  }
};

function extractYouTubeId(url: string) {
  if (!url) return '';
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/);
  return match ? match[1] : '';
}

export default function SongListPage() {
  const { t } = useLanguage();

  const [songs, setSongs] = useState<GroupedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedSong, setSelectedSong] = useState<GroupedSong | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<SongVersion | null>(null);

  /* ========= 讀資料 ========= */
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAndProcessSongs(
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQdBtem90otSSCpAHO7Al5fz2F0dx-ReDDpgbEfuioiOlkbT5uyfdWbDqPNZvG6YXI0PSab_ge6nE1/pub?gid=0&single=true&output=csv'
      );
      setSongs(data);
    } catch (e) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ========= 邏輯：篩選歌曲 ========= */
  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
      const matchesSearch = song.songName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            song.artist.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [songs, searchTerm]);

  /* ========= 動作：點歌 ========= */
  const handleSongClick = (song: GroupedSong) => {
    setSelectedSong(song);
    setSelectedVersion(song.versions[0]);
  };

  const handleVersionClick = (ver: SongVersion) => {
    setSelectedVersion(ver);
  };

  /* ========= 動作：隨機播放 (Surprise Me) ========= */
  const handleSurpriseMe = () => {
    if (songs.length === 0) return;
    const randomSong = songs[Math.floor(Math.random() * songs.length)];
    handleSongClick(randomSong);
  };

  /* ========= 動作：Hero 手動推薦播放 ========= */
  const handleHeroPlay = (type: 'classic' | 'gap' | 'latest') => {
    const target = HERO_SONGS[type];
    
    const manualSong: GroupedSong = {
      songName: target.songName,
      artist: target.artist,
      versions: [
        {
          date: target.date,
          streamUrl: target.url,
          streamTitle: target.songName,
          timestamp: "0:00",
          timestampSeconds: target.timestamp,
          songLink: ""
        }
      ]
    };

    handleSongClick(manualSong);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100">
      
      {/* ===== Header ===== */}
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/95 backdrop-blur z-10">
        <h2 className="text-lg lg:text-xl font-bold flex items-center gap-2 text-white cursor-pointer" onClick={() => setSelectedSong(null)}>
          <Music2 className="text-blue-400" size={24} />
          <span className="truncate">{t.nav_home}</span>
        </h2>
        <div className="flex items-center gap-2">
            <button onClick={loadData} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
            <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
            </button>
        </div>
      </header>

      {error && (
        <div className="m-4 p-4 bg-red-900/40 border border-red-500 text-red-200 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* ===== 左側：導覽與列表 ===== */}
        <div className="w-full lg:w-96 flex flex-col border-r border-slate-800 bg-slate-900 order-2 lg:order-1 h-full">
            
            {/* 搜尋區 */}
            <div className="p-3 border-b border-slate-800 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="搜尋歌名或歌手..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800 text-slate-200 pl-9 pr-4 py-2 rounded-lg text-sm border border-slate-700 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                    />
                </div>
            </div>

            {/* 歌曲列表 */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
                {loading ? (
                    <div className="text-slate-500 text-center py-10 text-sm animate-pulse">
                    載入歌曲中...
                    </div>
                ) : (
                    <div className="space-y-2">
                    {filteredSongs.map((song) => (
                        <div
                        key={song.songName}
                        onClick={() => handleSongClick(song)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 group
                            ${selectedSong?.songName === song.songName
                                ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-750 hover:border-slate-600'
                            }`}
                        >
                        <div className="min-w-0 flex-1 mr-2">
                            <div className={`font-bold text-sm lg:text-base truncate transition-colors ${selectedSong?.songName === song.songName ? 'text-blue-300' : 'text-slate-200 group-hover:text-white'}`}>
                            {song.songName}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 truncate group-hover:text-slate-400">
                            <User size={10} /> {song.artist}
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            {song.versions.length > 1 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300">
                                +{song.versions.length - 1}
                                </span>
                            )}
                        </div>
                        </div>
                    ))}
                    </div>
                )}
            </div>
        </div>

        {/* ===== 右側：播放器 OR Hero Section ===== */}
        <div className={`
            flex-1 flex flex-col bg-slate-900 relative order-1 lg:order-2 
            border-b lg:border-b-0 border-slate-800
            ${selectedSong ? 'h-[40vh] lg:h-auto' : 'h-full'} 
            transition-all duration-300
        `}>
          {selectedSong && selectedVersion ? (
            // === 播放器模式 ===
            <div className="flex flex-col h-full animate-in fade-in duration-300 relative group/player">
              
              {/* 關閉按鈕 (手機/電腦皆顯示) */}
              <button 
                onClick={() => setSelectedSong(null)}
                className="absolute top-2 right-2 z-50 bg-black/60 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors shadow-lg"
                title="關閉播放器"
              >
                <X size={16} />
              </button>

              <div className="aspect-video bg-black shrink-0 w-full shadow-2xl relative">
                <YouTubePlayer
                  url={selectedVersion.streamUrl}
                  startTime={selectedVersion.timestampSeconds}
                />
              </div>

              <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
                <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                        <h3 className="text-2xl font-bold text-white break-words leading-tight">
                        {selectedSong.songName}
                        </h3>
                        <p className="text-blue-400 flex items-center gap-2 text-sm mt-1 font-medium">
                        <User size={16}/> {selectedSong.artist}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 mb-6 backdrop-blur-sm">
                  <div className="flex justify-between items-center text-xs mb-3">
                    <span className="font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                        <Play size={10} className="fill-current"/> Now Playing
                    </span>
                    <span className="bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">
                      {selectedVersion.date}
                    </span>
                  </div>
                  <div className="text-sm text-slate-200 line-clamp-2 mb-3 leading-relaxed">
                    {selectedVersion.streamTitle}
                  </div>

                  <a
                    href={`https://www.youtube.com/watch?v=${extractYouTubeId(selectedVersion.streamUrl)}&t=${selectedVersion.timestampSeconds}s`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-300 transition-colors border border-slate-600 hover:border-blue-400 rounded-full px-3 py-1.5"
                  >
                    <ExternalLink size={12} />
                    {t.original_link}
                  </a>
                </div>

                {selectedSong.versions.length > 1 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Music2 size={12}/> 
                        {t.versions}
                    </h3>
                    <div className="grid gap-2">
                      {selectedSong.versions.map((ver, idx) => {
                        const isSelected = ver === selectedVersion;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleVersionClick(ver)}
                            className={`w-full p-3 rounded-xl flex items-center gap-3 text-left border transition-all duration-200
                              ${isSelected
                                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-200 shadow-inner'
                                  : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                              }`}
                          >
                            <div className={`p-1.5 rounded-full shrink-0 ${isSelected ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-slate-700 text-slate-400'}`}>
                                <Play size={10} className={isSelected ? "fill-current" : ""} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-300 mb-0.5">
                                {ver.date}
                                {idx === 0 && <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">LATEST</span>}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {ver.streamTitle}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // === 首頁 Hero 模式 (未點歌時顯示) ===
            <HeroSection 
                onPlayRecommended={handleHeroPlay} 
                onSurprise={handleSurpriseMe} 
            />
          )}
        </div>
      </div>
    </div>
  );
}