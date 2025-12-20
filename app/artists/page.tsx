'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { GroupedSong } from '@/utils/dataProcessor';
import { Mic2, Search, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayer } from '@/context/PlayerContext';

interface ArtistGroup {
  name: string;
  songs: GroupedSong[];
}

export default function ArtistsPage() {
  const { t } = useLanguage();
  const { allSongs, loading, playSong, currentSong } = usePlayer();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<ArtistGroup | null>(null);

  const [visibleArtistCount, setVisibleArtistCount] = useState(30);
  const artistLoaderRef = useRef<HTMLDivElement>(null);

  const [visibleSongCount, setVisibleSongCount] = useState(20);
  const songLoaderRef = useRef<HTMLDivElement>(null);

  const artistGroups = useMemo(() => {
    const groups: Record<string, GroupedSong[]> = {};
    allSongs.forEach(song => {
      const artistName = song.artist || 'Unknown';
      if (!groups[artistName]) {
        groups[artistName] = [];
      }
      groups[artistName].push(song);
    });
    return Object.entries(groups)
      .map(([name, songs]) => ({ name, songs }))
      .sort((a, b) => b.songs.length - a.songs.length);
  }, [allSongs]);

  const filteredArtists = useMemo(() => {
    if (!searchTerm) return artistGroups;
    return artistGroups.filter(g => 
      g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [artistGroups, searchTerm]);

  useEffect(() => {
    setVisibleArtistCount(30);
  }, [searchTerm, allSongs]);

  useEffect(() => {
    setVisibleSongCount(20);
  }, [selectedArtist]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleArtistCount((prev) => Math.min(prev + 30, filteredArtists.length));
      }
    }, { root: null, rootMargin: '100px', threshold: 0 }); // ✨ 修正：threshold 0

    if (artistLoaderRef.current) observer.observe(artistLoaderRef.current);
    return () => { if (artistLoaderRef.current) observer.unobserve(artistLoaderRef.current); };
  }, [filteredArtists.length]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && selectedArtist) {
        setVisibleSongCount((prev) => Math.min(prev + 20, selectedArtist.songs.length));
      }
    }, { root: null, rootMargin: '100px', threshold: 0 }); // ✨ 修正：threshold 0

    if (songLoaderRef.current) observer.observe(songLoaderRef.current);
    return () => { if (songLoaderRef.current) observer.unobserve(songLoaderRef.current); };
  }, [selectedArtist]);

  const displayedArtists = filteredArtists.slice(0, visibleArtistCount);
  const displayedSongs = selectedArtist ? selectedArtist.songs.slice(0, visibleSongCount) : [];

  return (
    <div className="flex h-full w-full bg-slate-900 text-slate-100 overflow-hidden">
      
      {/* 欄位 1: 歌手列表 */}
      <div className={`${selectedArtist ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 flex-col border-r border-slate-800 bg-slate-950/30 shrink-0`}>
        <div className="p-4 border-b border-slate-800 space-y-3 shrink-0">
           <div className="flex items-center gap-2 text-xl font-bold text-pink-400">
             <Mic2 /> {t.nav_artists}
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="text" 
                placeholder={t.search_placeholder}
                className="w-full bg-slate-800 border border-slate-700 rounded pl-9 pr-3 py-1.5 text-sm focus:border-pink-500 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        
        {/* ✨ 修正：pb-24 */}
        <div className="flex-1 overflow-y-auto p-2 pb-24 scrollbar-thin scrollbar-thumb-slate-700">
           {loading ? <div className="p-4 text-center text-slate-500">{t.loading}</div> : (
             <div className="space-y-1">
               {displayedArtists.map(group => (
                 <button
                   key={group.name}
                   onClick={() => setSelectedArtist(group)}
                   className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                     selectedArtist?.name === group.name 
                       ? 'bg-pink-600/20 text-pink-200 border border-pink-500/30' 
                       : 'hover:bg-slate-800 text-slate-300'
                   }`}
                 >
                   <span className="font-medium truncate">{group.name}</span>
                   <span className="text-xs bg-slate-900 px-2 py-0.5 rounded-full text-slate-500">
                     {group.songs.length}
                   </span>
                 </button>
               ))}
               
               {visibleArtistCount < filteredArtists.length && (
                  <div ref={artistLoaderRef} className="py-6 flex justify-center">
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-pink-500 rounded-full animate-spin" />
                  </div>
               )}
             </div>
           )}
        </div>
      </div>

      {/* 欄位 2: 該歌手的歌曲列表 */}
      {selectedArtist ? (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
          <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/95 backdrop-blur z-10 shrink-0">
             <button 
               onClick={() => setSelectedArtist(null)} 
               className="lg:hidden p-2 hover:bg-slate-800 rounded-full"
             >
               ←
             </button>
             <div>
               <h2 className="text-2xl font-bold text-white">{selectedArtist.name}</h2>
               <p className="text-sm text-slate-400">{t.total_songs.replace('{count}', String(selectedArtist.songs.length))}</p>
             </div>
          </div>

          {/* ✨ 修正：pb-24 */}
          <div className="flex-1 overflow-y-auto p-4 pb-24 scrollbar-thin scrollbar-thumb-slate-700">
            <div className="grid grid-cols-1 gap-2">
                {displayedSongs.map(song => (
                <div
                    key={song.songName}
                    onClick={() => playSong(song)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all ${
                    currentSong?.songName === song.songName
                        ? 'bg-pink-600/10 border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.1)]'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                    }`}
                >
                    <div>
                    <div className="font-bold text-slate-200">{song.songName}</div>
                    <div className="text-xs text-slate-500 mt-1">
                        {t.new_tag}: {song.versions[0].date}
                    </div>
                    </div>
                    <ChevronRight size={16} className={`text-slate-500 ${currentSong?.songName === song.songName ? 'text-pink-400' : ''}`} />
                </div>
                ))}

                {visibleSongCount < selectedArtist.songs.length && (
                   <div ref={songLoaderRef} className="py-6 flex justify-center">
                     <div className="w-5 h-5 border-2 border-slate-600 border-t-pink-500 rounded-full animate-spin" />
                   </div>
                )}
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center text-slate-600 bg-slate-900">
           <div className="text-center">
             <Mic2 className="mx-auto mb-4 opacity-20 w-16 h-16" />
             <p>{t.select_artist_prompt}</p>
           </div>
        </div>
      )}
    </div>
  );
}