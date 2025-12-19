'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchAndProcessSongs, GroupedSong, SongVersion } from '@/utils/dataProcessor';
import { Mic2, Search, ChevronRight, Music2, Calendar, Play, ExternalLink } from 'lucide-react';
import YouTubePlayer from '@/app/components/YouTubePlayer';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQdBtem90otSSCpAHO7Al5fz2F0dx-ReDDpgbEfuioiOlkbT5uyfdWbDqPNZvG6YXI0PSab_ge6nE1/pub?gid=0&single=true&output=csv';

// 輔助工具：用於產生原始連結
function extractYouTubeId(url: string) {
  if (!url) return '';
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/);
  return match ? match[1] : '';
}

// 定義歌手資料結構
interface ArtistGroup {
  name: string;
  songs: GroupedSong[];
}

export default function ArtistsPage() {
  const [allSongs, setAllSongs] = useState<GroupedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 選中的狀態
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

  // 將歌曲按歌手分組
  const artistGroups = useMemo(() => {
    const groups: Record<string, GroupedSong[]> = {};
    
    allSongs.forEach(song => {
      const artistName = song.artist || 'Unknown'; // 防止空值
      if (!groups[artistName]) {
        groups[artistName] = [];
      }
      groups[artistName].push(song);
    });

    // 轉成陣列並排序 (依歌曲數量多寡)
    return Object.entries(groups)
      .map(([name, songs]) => ({ name, songs }))
      .sort((a, b) => b.songs.length - a.songs.length);
  }, [allSongs]);

  // 過濾歌手
  const filteredArtists = useMemo(() => {
    if (!searchTerm) return artistGroups;
    return artistGroups.filter(g => 
      g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [artistGroups, searchTerm]);

  // 處理點擊
  const handleArtistClick = (artist: ArtistGroup) => {
    setSelectedArtist(artist);
    // 重置選中的歌，讓使用者重新選
    setSelectedSong(null); 
  };

  const handleSongClick = (song: GroupedSong) => {
    setSelectedSong(song);
    setSelectedVersion(song.versions[0]);
  };

  return (
    <div className="flex h-full w-full bg-slate-900 text-slate-100 overflow-hidden">
      
      {/* 欄位 1: 歌手列表 (最左側) */}
      <div className={`${selectedArtist ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 flex-col border-r border-slate-800 bg-slate-950/30 shrink-0`}>
        <div className="p-4 border-b border-slate-800 space-y-3 shrink-0">
           <div className="flex items-center gap-2 text-xl font-bold text-pink-400">
             <Mic2 /> 歌手一覧
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="text" 
                placeholder="搜尋歌手..." 
                className="w-full bg-slate-800 border border-slate-700 rounded pl-9 pr-3 py-1.5 text-sm focus:border-pink-500 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
           {loading ? <div className="p-4 text-center text-slate-500">Loading...</div> : (
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

      {/* 欄位 2: 該歌手的歌曲列表 (中間) */}
      {selectedArtist ? (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
          {/* 歌手標題列 */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/95 backdrop-blur z-10 shrink-0">
             <button 
               onClick={() => setSelectedArtist(null)} 
               className="lg:hidden p-2 hover:bg-slate-800 rounded-full"
             >
               ←
             </button>
             <div>
               <h2 className="text-2xl font-bold text-white">{selectedArtist.name}</h2>
               <p className="text-sm text-slate-400">共 {selectedArtist.songs.length} 首歌曲</p>
             </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
             {/* 歌曲清單 */}
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
                          最新: {song.versions[0].date}
                        </div>
                      </div>
                      <ChevronRight size={16} className={`text-slate-500 ${selectedSong?.songName === song.songName ? 'text-pink-400' : ''}`} />
                    </div>
                  ))}
                </div>
             </div>

             {/* 欄位 3: 播放器 (最右側，有選歌才出現) */}
             {selectedSong && selectedVersion && (
               <div className="w-[350px] border-l border-slate-800 bg-slate-950 flex flex-col shadow-2xl z-20 absolute lg:static inset-0 lg:inset-auto">
                  {/* 手機版關閉按鈕 */}
                  <div className="lg:hidden p-2 absolute top-2 left-2 z-50">
                    <button onClick={() => setSelectedSong(null)} className="bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur">
                      ✕ 關閉播放器
                    </button>
                  </div>

                  <div className="aspect-video bg-black shrink-0">
                    {/* === 修正處：改用 url 屬性 === */}
                    <YouTubePlayer 
                      url={selectedVersion.streamUrl}
                      startTime={selectedVersion.timestampSeconds}
                    />
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-1">{selectedSong.songName}</h3>
                      {/* 原始連結按鈕 */}
                      <a 
                        href={`https://www.youtube.com/watch?v=${extractYouTubeId(selectedVersion.streamUrl)}&t=${selectedVersion.timestampSeconds}s`}
                        target="_blank" 
                        rel="noreferrer"
                        className="relative z-10 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-400 hover:underline transition-colors"
                      >
                        <ExternalLink size={12} />
                        原始連結 (YouTube)
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
             <Mic2 size={64} className="mx-auto mb-4 opacity-20" />
             <p>請從左側選擇一位歌手</p>
           </div>
        </div>
      )}
    </div>
  );
}