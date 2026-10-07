"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { stageCopy } from '@/utils/stageCopy';
import { featuredWorks } from '@/utils/featuredWorks';
import WorkCard from '@/app/components/WorkCard';

export default function DiscographyClient() {
  const { lang, t } = useLanguage();
  const copy = stageCopy[lang];
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'date' | 'name'>('date');
  const songs = featuredWorks.filter(song => `${song.songName} ${song.artist}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'name' ? a.songName.localeCompare(b.songName, lang) : new Date(b.versions[0].date).getTime() - new Date(a.versions[0].date).getTime());
  return <main className="works-page"><p className="eyebrow">MUSIC / ORIGINALS</p><h1>{copy.works}</h1><p className="works-description">{copy.worksIntro}</p><div className="works-filters"><label><Search size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={t.search_placeholder} aria-label={t.search_placeholder}/></label><select value={sort} aria-label={t.sort_name} onChange={event => setSort(event.target.value as 'date' | 'name')}><option value="date">{copy.newest}</option><option value="name">{copy.az}</option></select></div>{songs.length ? <div className="works-grid featured-grid">{songs.map(song => <WorkCard key={song.songName} song={song} original />)}</div> : <p className="empty-state">{t.no_results}</p>}<div className="archive-cta"><Link href="/songs" className="stage-button">{copy.archiveLink}<ArrowUpRight size={16}/></Link><a className="text-link" href="https://rkmusic.jp/artist/284/" target="_blank" rel="noopener noreferrer">{copy.officialProfile}<ArrowUpRight size={16}/></a></div></main>;
}
