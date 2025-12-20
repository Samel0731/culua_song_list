'use client';

import { useEffect, useState } from 'react';
import { fetchAndProcessSongs, GroupedSong, SongVersion } from '@/utils/dataProcessor';
import { Music2, User, Calendar, ExternalLink, RefreshCw, Play } from 'lucide-react';
import YouTubePlayer from '@/app/components/YouTubePlayer';
import { useLanguage } from '@/context/LanguageContext';

/* ========= 工具：從 URL 取 YouTube ID (支援 Shorts) ========= */
function extractYouTubeId(url: string) {
  if (!url) return '';
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/);
  return match ? match[1] : '';
}

/* ========= 主頁 ========= */
export default function SongListPage() {
  const { t } = useLanguage();

  const [songs, setSongs] = useState<GroupedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  /* ========= 點歌 ========= */
  const handleSongClick = (song: GroupedSong) => {
    setSelectedSong(song);
    setSelectedVersion(song.versions[0]);
  };

  const handleVersionClick = (ver: SongVersion) => {
    setSelectedVersion(ver);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100">
      
      {/* ===== Header ===== */}
      <header className="px-4 py-3 lg:px-6 lg:py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/95 backdrop-blur z-10">
        <h2 className="text-lg lg:text-xl font-bold flex items-center gap-2 text-white">
          <Music2 className="text-blue-400" size={24} />
          {/* 使用翻譯變數 */}
          <span className="truncate">{t.nav_home}</span>
        </h2>
        <button onClick={loadData} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
          <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
        </button>
      </header>

      {error && (
        <div className="m-4 p-4 bg-red-900/40 border border-red-500 text-red-200 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* ===== 左側歌曲列表 ===== */}
        <div className="flex-1 overflow-y-auto p-2 lg:p-4 scrollbar-thin scrollbar-thumb-slate-700 order-2 lg:order-1 min-h-0 bg-slate-900">
          {loading ? (
            <div className="text-slate-500 text-center py-10">
              {t.loading}
            </div>
          ) : (
            <div className="space-y-2">
              {songs.map((song) => (
                <div
                  key={song.songName}
                  onClick={() => handleSongClick(song)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200
                    ${selectedSong?.songName === song.songName
                        ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-750 hover:border-slate-600'
                    }`}
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className={`font-bold text-base lg:text-lg truncate ${selectedSong?.songName === song.songName ? 'text-blue-300' : 'text-slate-200'}`}>
                      {song.songName}
                    </div>
                    <div className="text-xs lg:text-sm text-slate-400 flex items-center gap-1 truncate">
                      <User size={12} /> {song.artist}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] lg:text-xs text-slate-500 mb-1">{song.versions[0].date}</div>
                    {song.versions.length > 1 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300">
                          +{song.versions.length - 1}
                        </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== 右側播放器 ===== */}
        <div className={`
            bg-slate-900 border-b lg:border-b-0 lg:border-l border-slate-800 flex flex-col shrink-0 shadow-2xl z-20 
            w-full lg:w-[480px] 
            order-1 lg:order-2
            ${selectedSong ? 'h-[45vh] lg:h-full' : 'hidden lg:flex'} 
            transition-all duration-300
        `}>
          {selectedSong && selectedVersion ? (
            <>
              <div className="aspect-video bg-black shrink-0 w-full">
                <YouTubePlayer
                  url={selectedVersion.streamUrl}
                  startTime={selectedVersion.timestampSeconds}
                />
              </div>

              <div className="p-4 lg:p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
                <h3 className="text-xl lg:text-2xl font-bold mb-1 text-white break-words">
                  {selectedSong.songName}
                </h3>
                <p className="text-slate-400 mb-4 flex items-center gap-2 text-sm">
                  <User size={16}/> {selectedSong.artist}
                </p>

                <div className="bg-slate-800/50 p-3 lg:p-4 rounded-lg border border-slate-700 mb-4 backdrop-blur-sm">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-blue-400 uppercase tracking-wider">{t.now_playing}</span>
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Calendar size={10} />
                      {selectedVersion.date}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300 line-clamp-2 mb-2">
                    {selectedVersion.streamTitle}
                  </div>

                  <a
                    href={`https://www.youtube.com/watch?v=${extractYouTubeId(selectedVersion.streamUrl)}&t=${selectedVersion.timestampSeconds}s`}
                    target="_blank"
                    rel="noreferrer"
                    className="relative z-10 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-white hover:underline transition-colors mt-1"
                  >
                    <ExternalLink size={12} />
                    {t.original_link}
                  </a>
                </div>

                {selectedSong.versions.length > 1 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                        <Music2 size={14}/> 
                        {t.versions} ({selectedSong.versions.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedSong.versions.map((ver, idx) => {
                        const isSelected = ver === selectedVersion;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleVersionClick(ver)}
                            className={`w-full p-2 lg:p-3 rounded-lg flex items-center gap-3 text-left border transition-all
                              ${isSelected
                                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-200'
                                  : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                              }`}
                          >
                            <div className={`p-2 rounded-full shrink-0 ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                <Play size={12} className={isSelected ? "fill-current" : ""} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold flex items-center gap-2">
                                {ver.date}
                                {idx === 0 && <span className="text-[10px] bg-teal-500/80 text-white px-1.5 rounded-sm shrink-0">{t.new_tag}</span>}
                              </div>
                              <div className="text-xs text-slate-400 truncate">
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
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
              <Music2 className="mb-4 opacity-20 w-12 h-12 lg:w-16 lg:h-16" />
              <p className="text-base lg:text-lg font-medium mb-2">{t.select_song_prompt}</p>
              <p className="text-xs lg:text-sm">{t.auto_play_hint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}