'use client';

import { useMemo, useState } from 'react';
import { Music, Search, SortAsc, SortDesc, User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayer } from '@/context/PlayerContext';

export default function SongsPage() {
  const { t } = useLanguage();
  // 1. 改用全域 Context 獲取資料與播放控制，移除本地 fetch 邏輯
  const { allSongs, loading, playSong, currentSong } = usePlayer();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'count'>('name');

  const filteredSongs = useMemo(() => {
    let result = allSongs;
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.songName.toLowerCase().includes(lowerTerm) || 
        s.artist.toLowerCase().includes(lowerTerm)
      );
    }
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') {
        return a.songName.localeCompare(b.songName, 'ja');
      } else {
        return b.versions.length - a.versions.length;
      }
    });
    return result;
  }, [allSongs, searchTerm, sortBy]);

  return (
    // 2. 移除 flex-row 與右側區塊，只保留單欄式佈局 (因為 Layout 已經處理了右側播放器)
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100 overflow-hidden">
      
      {/* 頂部搜尋列 */}
      <div className="p-3 lg:p-4 border-b border-slate-800 bg-slate-950/50 backdrop-blur space-y-3 shrink-0">
        <div className="flex items-center gap-2 text-lg lg:text-xl font-bold text-purple-400">
          <Music className="w-6 h-6" /> {t.nav_songs}
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder={t.search_placeholder}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setSortBy(prev => prev === 'name' ? 'count' : 'name')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm hover:bg-slate-700 transition-colors shrink-0"
            title={sortBy === 'name' ? t.sort_name : t.sort_count}
          >
            {sortBy === 'name' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            <span className="hidden sm:inline">{sortBy === 'name' ? t.sort_name : t.sort_count}</span>
          </button>
        </div>
      </div>

      {/* 列表內容 */}
      <div className="flex-1 overflow-y-auto p-2 lg:p-4 scrollbar-thin scrollbar-thumb-slate-700">
        {loading ? (
           <div className="text-center p-10 text-slate-500">{t.loading}</div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredSongs.map((song) => (
              <div 
                key={song.songName}
                // 3. 點擊直接呼叫 Context 的 playSong
                onClick={() => playSong(song)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                  currentSong?.songName === song.songName 
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
                    {song.versions.length}
                  </span>
                </div>
              </div>
            ))}
            {filteredSongs.length === 0 && (
              <div className="text-center text-slate-500 py-10">{t.no_results}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}