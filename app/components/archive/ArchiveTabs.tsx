'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/context/LanguageContext';
import { hubCopy } from '@/utils/hubCopy';
import SongsContent from './SongsContent';
const ArtistsContent = dynamic(() => import('./ArtistsContent'));
const StatsContent = dynamic(() => import('./StatsContent'));
export default function ArchiveTabs({ tab, query }: { tab: string; query: string }) {
  const { lang } = useLanguage(); const c = hubCopy[lang];
  return <main className="archive-hub"><nav className="hub-tabs archive-tabs" aria-label={c.archive}>{(['songs', 'artists', 'stats'] as const).map(t => <Link key={t} href={t === 'songs' ? '/songs' : `/songs?tab=${t}`} aria-current={tab === t ? 'page' : undefined}>{c[t]}</Link>)}</nav>{tab === 'artists' ? <ArtistsContent/> : tab === 'stats' ? <StatsContent/> : <SongsContent key={query} initialQuery={query}/>}</main>;
}
