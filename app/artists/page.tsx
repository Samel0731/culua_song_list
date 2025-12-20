'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchAndProcessSongs, GroupedSong, SongVersion } from '@/utils/dataProcessor';
import { Mic2, Search, ChevronRight, Play, ExternalLink, Music2, X } from 'lucide-react';
import YouTubePlayer from '@/app/components/YouTubePlayer';
import { useLanguage } from '@/context/LanguageContext';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQdBtem90otSSCpAHO7Al5fz2F0dx-ReDDpgbEfuioiOlkbT5uyfdWbDqPNZvG6YXI0PSab_ge6nE1/pub?gid=0&single=true&output=csv';

function extractYouTubeId(url: string) {
  if (!url) return '';
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/);
  return match ? match[1] : '';
}

interface ArtistGroup {
  name: string;
  songs: GroupedSong[];
}

export default function ArtistsPage() {
  const { t } = useLanguage();

  const [allSongs, setAllSongs] = useState<GroupedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedArtist, setSelectedArtist] = useState<ArtistGroup | null>(null);
  const [selectedSong, setSelectedSong] = useState<GroupedSong | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<SongVersion | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAndProcessSongs(CSV_URL);
        setAllSongs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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

  const handleArtistClick = (artist: ArtistGroup) => {
    setSelectedArtist(artist);
    setSelectedSong(null); 
  };

  const handleSongClick = (song: GroupedSong) => {
    setSelectedSong(song);
    setSelectedVersion(song.versions[0]);
  };

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
        
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
           {loading ? <div className="p-4 text-center text-slate-500">{t.loading}</div> : (
             <div className="space-y-1">
               {filteredArtists.map(group => (
                 <button
                   key={group.name}
                   onClick={() => handleArtistClick(group)}
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

          <div className="flex flex-1 overflow-hidden relative">
             <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700">
                <div className="grid grid-cols-1 gap-2">
                  {selectedArtist.songs.map(song => (
                    <div
                      key={song.songName}
                      onClick={() => handleSongClick(song)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all ${
                        selectedSong?.songName === song.songName
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
                      <ChevronRight size={16} className={`text-slate-500 ${selectedSong?.songName === song.songName ? 'text-pink-400' : ''}`} />
                    </div>
                  ))}
                </div>
             </div>

             {/* 欄位 3: 播放器 */}
             {selectedSong && selectedVersion && (
               <div className="w-[350px] border-l border-slate-800 bg-slate-950 flex flex-col shadow-2xl z-20 absolute lg:relative inset-0 lg:inset-auto">
                  
                  {/* 統一的關閉按鈕 (新增/修改) */}
                  <button 
                    onClick={() => setSelectedSong(null)} 
                    className="absolute top-2 right-2 z-50 bg-black/60 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors shadow-lg"
                    title="關閉播放器"
                  >
                    <X size={16} />
                  </button>

                  <div className="aspect-video bg-black shrink-0 relative">
                    <YouTubePlayer 
                      url={selectedVersion.streamUrl}
                      startTime={selectedVersion.timestampSeconds}
                    />
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-1">{selectedSong.songName}</h3>
                      <a 
                        href={`https://www.youtube.com/watch?v=${extractYouTubeId(selectedVersion.streamUrl)}&t=${selectedVersion.timestampSeconds}s`}
                        target="_blank" 
                        rel="noreferrer"
                        className="relative z-10 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 hover:underline transition-colors"
                      >
                        <ExternalLink size={12} />
                        {t.original_link}
                      </a>
                    </div>

                    <div className="space-y-2">
                      {selectedSong.versions.map((ver, idx) => (
                         <button
                           key={idx}
                           onClick={() => setSelectedVersion(ver)}
                           className={`w-full text-left p-3 rounded border flex items-center gap-3 ${
                             ver === selectedVersion 
                               ? 'bg-pink-600/20 border-pink-500 text-pink-200' 
                               : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                           }`}
                         >
                           <Play size={14} className={ver === selectedVersion ? "fill-current" : ""} />
                           <div>
                             <div className="text-sm font-bold">{ver.date}</div>
                             <div className="text-xs opacity-70 truncate max-w-[200px]">{ver.streamTitle}</div>
                           </div>
                         </button>
                      ))}
                    </div>
                  </div>
               </div>
             )}
          </div>
        </div>
      ) : (
        /* 未選擇歌手時的右側佔位 */
        <div className="hidden lg:flex flex-1 items-center justify-center text-slate-600 bg-slate-900">
           <div className="text-center">
             <Mic2 className="mx-auto mb-4 opacity-20 w-16 h-16" />
             <p>{t.select_song_prompt}</p>
           </div>
        </div>
      )}
    </div>
  );
}