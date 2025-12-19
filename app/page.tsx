'use client';

import { useEffect, useState } from 'react';
import { fetchAndProcessSongs, GroupedSong, SongVersion } from '@/utils/dataProcessor';
import { Music2, User, Calendar, ExternalLink, RefreshCw, Play } from 'lucide-react';
import YouTubePlayer from '@/app/components/YouTubePlayer';

/* ========= 工具：從 URL 取 YouTube ID (支援 Shorts) ========= */
function extractYouTubeId(url: string) {
  if (!url) return '';
  // 增加對 shorts/ 的支援
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/);
  return match ? match[1] : '';
}

/* ========= 主頁 ========= */
export default function SongListPage() {
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
      setError('讀取歌曲資料失敗');
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
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/95 backdrop-blur z-10">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <Music2 className="text-blue-400" />
          歌った曲一覧
        </h2>
        <button
          onClick={loadData}
          className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors"
          title="重新整理"
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
        </button>
      </header>

      {error && (
        <div className="m-4 p-4 bg-red-900/40 border border-red-500 text-red-200 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ===== 左側歌曲列表 ===== */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700">
          {loading ? (
            <div className="text-slate-500 text-center py-10">
              載入中...
            </div>
          ) : (
            <div className="space-y-2">
              {songs.map((song) => (
                <div
                  key={song.songName}
                  onClick={() => handleSongClick(song)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200
                    ${
                      selectedSong?.songName === song.songName
                        ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-750 hover:border-slate-600'
                    }`}
                >
                  <div className="min-w-0">
                    <div className={`font-bold text-lg truncate ${selectedSong?.songName === song.songName ? 'text-blue-300' : 'text-slate-200'}`}>
                      {song.songName}
                    </div>
                    <div className="text-sm text-slate-400 flex items-center gap-1">
                      <User size={12} /> {song.artist}
                    </div>
                  </div>
                  <div className="text-right pl-4 shrink-0">
                    <div className="text-xs text-slate-500 mb-1">{song.versions[0].date}</div>
                    {song.versions.length > 1 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
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
        <div className="w-[350px] lg:w-[480px] bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 shadow-2xl z-20">
          {selectedSong && selectedVersion ? (
            <>
              {/* ==== YouTube Player ==== */}
              <div className="aspect-video bg-black shrink-0">
                <YouTubePlayer
                  url={selectedVersion.streamUrl}
                  startTime={selectedVersion.timestampSeconds}
                  playing={true} // 預設為播放意圖，但實際由 YouTubePlayer 的按鈕控制
                  setIsPlaying={() => {}} // 首頁簡易版可以不用處理反向狀態
                />
              </div>

              {/* ==== 資訊區 ==== */}
              <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
                <h3 className="text-2xl font-bold mb-1 text-white break-words">
                  {selectedSong.songName}
                </h3>
                <p className="text-slate-400 mb-6 flex items-center gap-2">
                  <User size={16}/> {selectedSong.artist}
                </p>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-6 backdrop-blur-sm">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-blue-400 uppercase tracking-wider">NOW PLAYING</span>
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Calendar size={10} />
                      {selectedVersion.date}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300 line-clamp-2 mb-2">
                    {selectedVersion.streamTitle}
                  </div>

                  {/* 修正後的原始連結按鈕 */}
                  <a
                    href={`https://www.youtube.com/watch?v=${extractYouTubeId(selectedVersion.streamUrl)}&t=${selectedVersion.timestampSeconds}s`}
                    target="_blank"
                    rel="noreferrer"
                    className="relative z-10 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-white hover:underline transition-colors mt-1"
                  >
                    <ExternalLink size={12} />
                    原始連結
                  </a>
                </div>

                {/* ==== 其他版本 ==== */}
                {selectedSong.versions.length > 1 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                        <Music2 size={14}/> 
                        其他配信 ({selectedSong.versions.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedSong.versions.map((ver, idx) => {
                        const isSelected = ver === selectedVersion;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleVersionClick(ver)}
                            className={`w-full p-3 rounded-lg flex items-center gap-3 text-left border transition-all
                              ${
                                isSelected
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
                                {idx === 0 && <span className="text-[10px] bg-teal-500/80 text-white px-1.5 rounded-sm shrink-0">NEW</span>}
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
              <Music2 size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium mb-2">請從左側選擇一首歌曲</p>
              <p className="text-sm">將會自動播放最新的歌回紀錄</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}