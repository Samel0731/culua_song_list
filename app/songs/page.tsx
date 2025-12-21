'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Music, Search, SortAsc, SortDesc, User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayer } from '@/context/PlayerContext';
import Fuse from 'fuse.js';

// 骨架屏組件
const SongSkeleton = () => (
  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700/50 bg-slate-800/30 mb-2">
    <div className="flex-1 mr-2 space-y-2">
      <div className="h-4 bg-slate-700 rounded w-1/3 animate-pulse"></div>
      <div className="h-3 bg-slate-700/50 rounded w-1/4 animate-pulse"></div>
    </div>
    <div className="shrink-0">
      <div className="h-5 w-8 bg-slate-700 rounded-full animate-pulse"></div>
    </div>
  </div>
);

// 音頻跳動條組件
const AudioEqualizer = () => (
  <div className="flex gap-0.5 items-end h-4 w-4 justify-center pb-1">
    <div className="equalizer-bar"></div>
    <div className="equalizer-bar"></div>
    <div className="equalizer-bar"></div>
  </div>
);

export default function SongsPage() {
  const { t } = useLanguage();
  const { allSongs, loading, playSong, currentSong } = usePlayer();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'count'>('name');
  const [visibleCount, setVisibleCount] = useState(20);
  const loaderRef = useRef<HTMLDivElement>(null);

  const filteredSongs = useMemo(() => {
    let result = allSongs;

    if (searchTerm) {
      const fuse = new Fuse(result, {
        keys: ['songName', 'artist'],
        threshold: 0.4,
        distance: 100,
      });
      result = fuse.search(searchTerm).map(r => r.item);
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

  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm, sortBy]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + 20, filteredSongs.length));
      }
    }, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [filteredSongs.length]);

  const displayedSongs = filteredSongs.slice(0, visibleCount);

  // Schema.org JSON-LD 資料
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Culua YouTube 演唱歌曲完整列表",
    "description": "Culua 歷年於 YouTube 直播與發布的所有歌曲清單，包含翻唱與原創曲。",
    "numberOfItems": allSongs.length,
    "itemListElement": allSongs.slice(0, 100).map((song, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "MusicRecording",
        "name": song.songName,
        "byArtist": {
          "@type": "MusicGroup",
          "name": song.artist
        }
      }
    }))
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100 overflow-hidden">
      
      {/* 注入 JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="p-3 lg:p-4 border-b border-slate-800 bg-slate-950/50 backdrop-blur space-y-3 shrink-0 z-10">
        <div className="flex items-center gap-2 text-lg lg:text-xl font-bold text-purple-400">
          <Music className="w-6 h-6" /> {t.nav_songs}
        </div>
        
        {/* ✨ 修改：將寫死的中文替換為翻譯變數 */}
        <p className="text-xs text-slate-400 leading-relaxed">
           {t.songs_authority_desc_prefix} <span className="text-slate-200 font-bold">{allSongs.length}</span> {t.songs_authority_desc_suffix}
        </p>

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
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm hover:bg-slate-700 transition-colors shrink-0 active:scale-95"
            title={sortBy === 'name' ? t.sort_name : t.sort_count}
          >
            {sortBy === 'name' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            <span className="hidden sm:inline">{sortBy === 'name' ? t.sort_name : t.sort_count}</span>
          </button>
        </div>
      </div>

      {/* 列表內容區 */}
      <div className="flex-1 w-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 p-2 lg:p-4"> 
        {loading ? (
           <div className="grid grid-cols-1 gap-2">
             {[...Array(10)].map((_, i) => <SongSkeleton key={i} />)}
           </div>
        ) : displayedSongs.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {displayedSongs.map((song) => {
              const isPlaying = currentSong?.songName === song.songName;
              return (
                <div 
                  key={song.songName}
                  onClick={() => playSong(song)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all active:scale-95 border ${
                    isPlaying
                      ? 'bg-purple-600/20 border-purple-500/50' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className={`font-bold truncate ${isPlaying ? 'text-purple-300' : 'text-slate-200'}`}>
                      {song.songName}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <User size={10} /> {song.artist}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {isPlaying ? (
                      <AudioEqualizer />
                    ) : (
                      <span className="text-xs bg-slate-900 text-slate-400 px-2 py-1 rounded-full border border-slate-700">
                        {song.versions.length}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {visibleCount < filteredSongs.length && (
               <div ref={loaderRef} className="py-4 flex justify-center w-full">
                 <div className="w-6 h-6 border-2 border-slate-600 border-t-purple-500 rounded-full animate-spin" />
               </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-10">{t.no_results}</div>
        )}
      </div>
    </div>
  );
}