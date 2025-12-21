'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Music2, User, ChevronRight, Play, Star, Clock, Sparkles, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayer } from '@/context/PlayerContext';
import Link from 'next/link';
import { GroupedSong } from '@/utils/dataProcessor';

// ✨ UI 元件：歌曲卡片
// 修改重點：在內部使用 useLanguage() 來翻譯 "versions"
const SongCard = ({ song, onClick, label, labelColor }: { song: GroupedSong, onClick: () => void, label?: string, labelColor?: string }) => {
  const { t } = useLanguage(); // ✨ 取得翻譯 hook

  return (
    <button 
      onClick={onClick}
      className="flex-shrink-0 w-[160px] lg:w-[200px] min-h-[140px] p-4 rounded-2xl bg-slate-800 border border-slate-700/50 hover:bg-slate-750 hover:border-slate-500 transition-all group/card text-left flex flex-col justify-between relative overflow-hidden snap-start shadow-sm hover:shadow-md hover:-translate-y-1"
    >
      <Music2 className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24 group-hover/card:scale-110 group-hover/card:rotate-12 transition-transform duration-500 pointer-events-none" />

      <div className="relative z-10 w-full">
        {label && (
          <div className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mb-2 ${labelColor || 'bg-blue-500/20 text-blue-300'}`}>
            {label}
          </div>
        )}
        
        <h3 className="font-bold text-slate-100 text-sm lg:text-base line-clamp-2 leading-tight mb-1 group-hover/card:text-blue-300 transition-colors">
          {song.songName}
        </h3>
        <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
          <User size={12} /> {song.artist}
        </p>
      </div>

      <div className="relative z-10 pt-3 mt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] lg:text-xs text-slate-500 font-medium">
        {/* ✨ 修改：使用翻譯變數 card_versions */}
        <span>{song.versions.length} {t.card_versions}</span>
        
        <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center group-hover/card:bg-blue-500 group-hover/card:text-white transition-colors">
          <Play size={10} className="fill-current ml-0.5" />
        </div>
      </div>
    </button>
  );
};

// 可捲動的區塊容器 (邏輯保持不變)
const ScrollableSection = ({ title, icon, href, children }: { title: string, icon: React.ReactNode, href?: string, children: React.ReactNode }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="group/section relative mb-2"> 
      <div className="flex items-center justify-between px-4 lg:px-8 mb-3 mt-8 first:mt-4">
        <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2">
          {icon} {title}
        </h2>
        {href && (
          <Link href={href} className="text-xs lg:text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-full hover:bg-slate-800">
            View All <ChevronRight size={14} />
          </Link>
        )}
      </div>

      <div className="relative">
        <button 
          onClick={() => scroll('left')}
          className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm border border-white/10 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 hover:bg-blue-600 hover:scale-110 disabled:opacity-0"
        >
          <ChevronLeft size={24} />
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto px-4 lg:px-8 pb-6 gap-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        >
          {children}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm border border-white/10 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 hover:bg-blue-600 hover:scale-110"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default function HomePage() {
  const { t } = useLanguage();
  const { allSongs, loading, playSong } = usePlayer();
  
  const latestSongs = useMemo(() => {
    return [...allSongs]
      .sort((a, b) => new Date(b.versions[0].date).getTime() - new Date(a.versions[0].date).getTime())
      .slice(0, 10);
  }, [allSongs]);

  const popularSongs = useMemo(() => {
    return [...allSongs].sort((a, b) => b.versions.length - a.versions.length).slice(0, 10);
  }, [allSongs]);

  const [randomPicks, setRandomPicks] = useState<GroupedSong[]>([]);

  useEffect(() => {
    if (allSongs.length > 0) {
      const shuffled = [...allSongs].sort(() => 0.5 - Math.random()).slice(0, 10);
      setRandomPicks(shuffled);
    }
  }, [allSongs]);

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full bg-slate-900 items-center justify-center text-slate-500 gap-2">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100 overflow-y-auto pb-32">
      
      {/* 權威描述 */}
      <div className="px-6 lg:px-8 pt-6 pb-2">
        <p className="text-xs text-slate-500 leading-relaxed border-l-2 border-blue-500 pl-3" dangerouslySetInnerHTML={{ __html: t.home_authority_desc }} />
      </div>

      {/* 1. 最新收錄 */}
      {/* ✨ 修改：使用 t.new_tag */}
      <ScrollableSection title={t.new_tag} icon={<Clock className="text-emerald-400" />} href="/songs">
        {latestSongs.map(song => (
          <SongCard key={song.songName} song={song} onClick={() => playSong(song)} label="NEW" labelColor="bg-emerald-500/20 text-emerald-300" />
        ))}
      </ScrollableSection>

      {/* 2. 熱門金曲 */}
      {/* ✨ 修改：使用 t.section_most_performed */}
      <ScrollableSection title={t.section_most_performed} icon={<Star className="text-yellow-400" />} href="/songs">
        {popularSongs.map(song => (
          <SongCard key={song.songName} song={song} onClick={() => playSong(song)} label={`TOP ${song.versions.length}`} labelColor="bg-yellow-500/20 text-yellow-300" />
        ))}
      </ScrollableSection>

      {/* 3. 隨機探索 */}
      {randomPicks.length > 0 && (
        // ✨ 修改：使用 t.section_discover
        <ScrollableSection title={t.section_discover} icon={<Sparkles className="text-purple-400" />}>
          {randomPicks.map(song => (
            <SongCard key={song.songName} song={song} onClick={() => playSong(song)} />
          ))}
        </ScrollableSection>
      )}

      {/* 底部行動呼籲 (CTA) */}
      <div className="mx-4 lg:mx-8 mt-6 mb-8 p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-blue-900/30 to-slate-800/50 border border-slate-700/50 text-center shadow-lg">
        {/* ✨ 修改：使用一系列 cta 翻譯變數 */}
        <h3 className="text-lg lg:text-xl font-bold text-white mb-2">{t.cta_title}</h3>
        <p className="text-slate-400 text-sm mb-6">
          {t.cta_desc_prefix} <span className="text-blue-300 font-bold">{allSongs.length}</span> {t.cta_desc_suffix}
        </p>
        <Link 
          href="/songs" 
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 shadow-md active:scale-95"
        >
          <Music2 size={18} /> {t.cta_btn}
        </Link>
      </div>

    </div>
  );
}