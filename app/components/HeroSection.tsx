'use client';

import { useMemo } from 'react';
import { Play, Sparkles } from 'lucide-react';
import { GroupedSong } from '@/utils/dataProcessor';
import { usePlayer } from '@/context/PlayerContext';

function extractYouTubeId(url: string) {
  if (!url) return '';
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/);
  return match ? match[1] : '';
}

const VideoStyleCard = ({ song, onClick, type }: { song: GroupedSong | undefined, onClick: () => void, type: string }) => {
  if (!song) return null; // 防呆機制
  
  const videoUrl = song.versions?.[0]?.streamUrl || '';
  const youtubeId = extractYouTubeId(videoUrl);

  return (
    <div 
      onClick={onClick}
      className="group relative aspect-video w-full bg-slate-800 rounded-xl overflow-hidden cursor-pointer border border-slate-700 hover:border-blue-500 transition-all shadow-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
         {youtubeId ? (
            <img 
              src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`} 
              alt={song.songName}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            />
         ) : (
            <span className="text-white/10 text-4xl font-black italic">VIDEO ARCHIVE</span>
         )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-colors" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded mb-2 inline-block">
          {type}
        </span>
        <h3 className="text-white font-bold text-sm lg:text-base line-clamp-1">{song.songName}</h3>
        <p className="text-slate-300 text-xs">{song.artist}</p>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-300">
        <div className="bg-blue-600/90 backdrop-blur-md p-4 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)]">
          <Play className="fill-white text-white" size={32} />
        </div>
      </div>
    </div>
  );
};

interface Props {
  onPlayRandom?: () => void;
  onPlaySong?: (song: GroupedSong) => void;
  onPlayRecommended?: (type: 'classic' | 'gap' | 'latest') => void;
}

export default function HeroSection({ onPlayRandom, onPlaySong, onPlayRecommended }: Props) {
  const { allSongs, playSong } = usePlayer();
  const safeSongs = Array.isArray(allSongs) ? allSongs : []; // 終極防呆

  const latestSongs = useMemo(() => {
    return [...safeSongs].sort((a,b) => new Date(b.versions?.[0]?.date || 0).getTime() - new Date(a.versions?.[0]?.date || 0).getTime()).slice(0, 3);
  }, [safeSongs]);

  const popularSongs = useMemo(() => {
    return [...safeSongs].sort((a,b) => (b.versions?.length || 0) - (a.versions?.length || 0)).slice(0, 3);
  }, [safeSongs]);

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-8 text-white flex items-center gap-2">
        <Sparkles className="text-yellow-400" /> PICK UP VIDEOS
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <VideoStyleCard song={latestSongs[0]} onClick={() => onPlayRecommended ? onPlayRecommended('latest') : playSong(latestSongs[0])} type="LATEST RELEASE" />
        <VideoStyleCard song={popularSongs[0]} onClick={() => onPlayRecommended ? onPlayRecommended('classic') : playSong(popularSongs[0])} type="MOST POPULAR" />
        <VideoStyleCard song={latestSongs[1]} onClick={() => onPlayRandom ? onPlayRandom() : playSong(latestSongs[1])} type="RECOMMENDED" />
      </div>
    </div>
  );
}