'use client';

import { useMemo, useState } from 'react';
import { GroupedSong } from '@/utils/dataProcessor';
import { Music2, User, RefreshCw, Search } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayer } from '@/context/PlayerContext';

export default function SongListPage() {
  const { t } = useLanguage();
  // 直接從 Context 拿資料和播放方法
  const { allSongs, loading, playSong, currentSong } = usePlayer();
  
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSongs = useMemo(() => {
    return allSongs.filter(song => {
      const matchesSearch = song.songName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            song.artist.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [allSongs, searchTerm]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/95 backdrop-blur z-10">
        <h2 className="text-lg lg:text-xl font-bold flex items-center gap-2 text-white">
          <Music2 className="text-blue-400" size={24} />
          <span className="truncate">{t.nav_home}</span>
        </h2>
        <div className="flex items-center gap-2">
            <button onClick={() => window.location.reload()} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
              <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
            </button>
        </div>
      </header>

      {/* Search */}
      <div className="p-3 border-b border-slate-800 space-y-3">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                  type="text" 
                  placeholder={t.search_placeholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 pl-9 pr-4 py-2 rounded-lg text-sm border border-slate-700 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
              />
          </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
          {loading ? (
              <div className="text-slate-500 text-center py-10 text-sm animate-pulse">
              {t.loading}
              </div>
          ) : (
              <div className="space-y-2">
              {filteredSongs.map((song) => (
                  <div
                  key={song.songName}
                  onClick={() => playSong(song)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 group
                      ${currentSong?.songName === song.songName
                          ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                          : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-750 hover:border-slate-600'
                      }`}
                  >
                  <div className="min-w-0 flex-1 mr-2">
                      <div className={`font-bold text-sm lg:text-base truncate transition-colors ${currentSong?.songName === song.songName ? 'text-blue-300' : 'text-slate-200 group-hover:text-white'}`}>
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
  );
}