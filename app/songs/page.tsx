'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchAndProcessSongs, GroupedSong, SongVersion } from '@/utils/dataProcessor';
import { Music, Search, SortAsc, SortDesc, User, Play, Calendar, ExternalLink } from 'lucide-react';
import YouTubePlayer from '@/app/components/YouTubePlayer';

// 你的 CSV 連結
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQdBtem90otSSCpAHO7Al5fz2F0dx-ReDDpgbEfuioiOlkbT5uyfdWbDqPNZvG6YXI0PSab_ge6nE1/pub?gid=0&single=true&output=csv';

// 輔助工具：用於產生原始連結 (支援 Shorts)
function extractYouTubeId(url: string) {
  if (!url) return '';
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/);
  return match ? match[1] : '';
}

export default function SongsPage() {
  const [songs, setSongs] = useState<GroupedSong[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 搜尋與排序狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'count'>('name');
  
  // 播放器狀態
  const [selectedSong, setSelectedSong] = useState<GroupedSong | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<SongVersion | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAndProcessSongs(CSV_URL);
        setSongs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 核心邏輯：過濾與排序
  const filteredSongs = useMemo(() => {
    let result = songs;

    // 1. 搜尋 (支援曲名或歌手)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.songName.toLowerCase().includes(lowerTerm) || 
        s.artist.toLowerCase().includes(lowerTerm)
      );
    }

    // 2. 排序
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') {
        return a.songName.localeCompare(b.songName, 'ja');
      } else {
        return b.versions.length - a.versions.length;
      }
    });

    return result;
  }, [songs, searchTerm, sortBy]);

  const handleSongClick = (song: GroupedSong) => {
    setSelectedSong(song);
    setSelectedVersion(song.versions[0]);
  };

  return (
    // RWD: 手機上下排 (col)，電腦左右排 (row)
    <div className="flex flex-col lg:flex-row h-full w-full bg-slate-900 text-slate-100 overflow-hidden">
      
      {/* 左側區塊 (搜尋 + 列表) */}
      {/* RWD: order-2 (手機排下面) */}
      {/* overflow-hidden 是修復捲動問題的關鍵 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:border-r border-slate-800 order-2 lg:order-1">
        
        {/* 頂部搜尋列 */}
        <div className="p-3 lg:p-4 border-b border-slate-800 bg-slate-950/50 backdrop-blur space-y-3 shrink-0">
          <div className="flex items-center gap-2 text-lg lg:text-xl font-bold text-purple-400">
            {/* 使用 Class 控制大小 */}
            <Music className="w-6 h-6" /> 曲名一覧
          </div>
          
          <div className="flex gap-2">
            {/* 搜尋框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="搜尋曲名或歌手..." 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* 排序按鈕 */}
            <button 
              onClick={() => setSortBy(prev => prev === 'name' ? 'count' : 'name')}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm hover:bg-slate-700 transition-colors shrink-0"
              title={sortBy === 'name' ? "目前：按名稱排序" : "目前：按次數排序"}
            >
              {sortBy === 'name' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              <span className="hidden sm:inline">{sortBy === 'name' ? '名稱' : '次數'}</span>
            </button>
          </div>
        </div>

        {/* 歌曲列表 */}
        <div className="flex-1 overflow-y-auto p-2 lg:p-4 scrollbar-thin scrollbar-thumb-slate-700">
          {loading ? (
             <div className="text-center p-10 text-slate-500">載入中...</div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredSongs.map((song) => (
                <div 
                  key={song.songName}
                  onClick={() => handleSongClick(song)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                    selectedSong?.songName === song.songName 
                      ? 'bg-purple-600/20 border-purple-500/50' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="font-bold text-slate-200 truncate">{song.songName}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <User size={10} /> {song.artist}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs bg-slate-900 text-slate-400 px-2 py-1 rounded-full border border-slate-700">
                      {song.versions.length} 回
                    </span>
                  </div>
                </div>
              ))}
              {filteredSongs.length === 0 && (
                <div className="text-center text-slate-500 py-10">找不到符合的歌曲</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 右側區塊 (播放器) */}
      {/* RWD: 
          - order-1 (手機排上面)
          - h-[45vh] (手機高度佔比)
          - hidden (手機未選歌時隱藏)
      */}
      <div className={`
        bg-slate-900 border-b lg:border-b-0 lg:border-l border-slate-800 flex flex-col shrink-0 shadow-2xl z-20
        w-full lg:w-[480px]
        order-1 lg:order-2
        ${selectedSong ? 'h-[45vh] lg:h-full' : 'hidden lg:flex'}
        transition-all duration-300
      `}>
        {selectedSong && selectedVersion ? (
          <>
            <div className="aspect-video bg-black w-full shrink-0">
              <YouTubePlayer 
                url={selectedVersion.streamUrl}
                startTime={selectedVersion.timestampSeconds}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin scrollbar-thumb-slate-700">
              <h2 className="text-xl lg:text-2xl font-bold mb-1 text-white">{selectedSong.songName}</h2>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="text-purple-400 text-sm font-medium">{selectedSong.artist}</div>
                {/* 原始連結按鈕 */}
                <a 
                    href={`https://www.youtube.com/watch?v=${extractYouTubeId(selectedVersion.streamUrl)}&t=${selectedVersion.timestampSeconds}s`}
                    target="_blank" 
                    rel="noreferrer"
                    className="relative z-10 flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 hover:underline transition-colors"
                >
                    <ExternalLink size={12} />
                    原始連結
                </a>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase">版本列表</h3>
                {selectedSong.versions.map((ver, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVersion(ver)}
                    className={`w-full p-3 rounded flex items-center gap-3 text-left border transition-all ${
                      ver === selectedVersion ? 'bg-purple-600/20 border-purple-500 text-purple-200' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Play size={14} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold flex items-center gap-2">
                        <Calendar size={10} /> {ver.date}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{ver.streamTitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
            {/* Icon 大小修正，避免 Build Error */}
            <Music className="mb-4 opacity-20 w-12 h-12 lg:w-16 lg:h-16" />
            <p>請選擇歌曲以播放</p>
          </div>
        )}
      </div>
    </div>
  );
}