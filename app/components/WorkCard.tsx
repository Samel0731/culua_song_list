"use client";

import { Play, ArrowUpRight } from 'lucide-react';
import { GroupedSong } from '@/utils/dataProcessor';
import { videoId } from '@/utils/featuredWorks';
import { usePlayer } from '@/context/PlayerContext';
import { useLanguage } from '@/context/LanguageContext';
import { stageCopy } from '@/utils/stageCopy';

export default function WorkCard({ song, original = false }: { song: GroupedSong; original?: boolean }) {
  const { playSong } = usePlayer();
  const { lang, t } = useLanguage();
  const copy = stageCopy[lang];
  const id = videoId(song.versions[0]?.streamUrl || '');
  return <button className="work-card" onClick={() => playSong(song)} aria-label={`${t.hero_play_now}: ${song.songName}`}>
    <div className="work-art">
      {/* YouTube thumbnails accompany links to the original videos. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {id ? <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" /> : <div className="work-placeholder">CULUA</div>}
      <span className="work-play"><Play size={24} fill="currentColor" /></span>
      <span className="work-tag">{original ? copy.originals : t.stream_archive}</span>
    </div>
    <div className="work-caption"><div><h3>{song.songName}</h3><p>{original ? 'CULUA' : `${song.artist} · ${song.versions[0]?.date || ''}`}</p></div><ArrowUpRight size={20} /></div>
  </button>;
}
