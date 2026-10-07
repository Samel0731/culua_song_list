'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight, Music2, CalendarDays, Search, Play, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayer } from '@/context/PlayerContext';
import { hubCopy } from '@/utils/hubCopy';
import type { HubContent as Content, NewsItem, OfficialWork, TimelineItem, SourceState } from '@/utils/contentTypes';
import { selectWorks } from '@/utils/contentSelectors';
import { videoId } from '@/utils/featuredWorks';
import FanPostEmbed from './FanPostEmbed';
import Image from 'next/image';

type View = 'home' | 'news' | 'works' | 'timeline' | 'fanart';
export default function HubContent({ data, view, today }: { data: Content; view: View; today: string }) {
  const { lang } = useLanguage(); const c = hubCopy[lang];
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<'upcoming' | 'history'>(() => data.timeline.some(e => e.date >= today) ? 'upcoming' : 'history');
  const [kind, setKind] = useState<'all' | 'event' | 'release'>('all');
  const [sort, setSort] = useState<'date' | 'name'>('date');
  const [artist, setArtist] = useState('all');
  const upcoming = data.timeline.filter(e => e.kind === 'event' && e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const culuaWorks = data.works.filter(w => w.artists.includes('CULUA'));
  const works = [...culuaWorks].filter(w => w.title.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'name' ? a.title.localeCompare(b.title, lang) : (b.releaseDate || '').localeCompare(a.releaseDate || ''));
  const timeline = data.timeline.filter(e => (period === 'upcoming' ? e.date >= today : e.date < today) && (kind === 'all' || e.kind === kind) && (artist === 'all' || e.artists.some(a => a === artist))).sort((a, b) => period === 'upcoming' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  if (view === 'home') return <main className="hub-page">
    <section className="hub-hero">
      <div><p className="eyebrow">CULUA / FAN ARCHIVE</p><h1>{c.tagline}</h1><p>{c.intro}</p><span className="unofficial-label">{c.unofficial}</span></div>
      <div className="hub-search-box"><Music2 size={28}/><h2>{c.archive}</h2><form action="/songs" onSubmit={event => { event.preventDefault(); const q = String(new FormData(event.currentTarget).get('q') || ''); router.push(`/songs?q=${encodeURIComponent(q)}`); }}><label className="sr-only" htmlFor="home-search">{c.search}</label><div className="hub-search"><input id="home-search" name="q" placeholder={c.search}/><button aria-label={c.search}><Search size={20}/></button></div></form><Link href="/songs">{c.songs}<ArrowUpRight size={16}/></Link></div>
    </section>
    <div className="hub-overview">
      <section className="hub-section"><Heading title={c.news} label="01 / NEWS" href="/news"/><NewsList items={data.news.slice(0, 3)}/></section>
      <section className="hub-section coming-up"><Heading title={c.upcomingTitle} label="02 / EVENTS" href="/timeline"/><EventList items={upcoming.slice(0, 3)} empty={c.noUpcoming}/><p className="subtle">{c.zone}</p></section>
    </div>
    <section className="hub-section"><Heading title={c.curated} label="03 / ORIGINAL MUSIC" href="/discography"/><div className="hub-work-grid">{selectWorks(culuaWorks, data.selections).slice(0, 4).map(w => <ReleaseCard key={w.id} work={w}/>)}</div>{!culuaWorks.length && <Empty/>}</section>
    <section className="hub-section"><Heading title={c.fanart} label="04 / COMMUNITY" href="/fanart"/><FanList data={data} limit={3}/></section>
    <Sources sources={data.sources}/>
  </main>;
  const title = view === 'news' ? c.news : view === 'works' ? c.works : view === 'timeline' ? c.events : c.fanart;
  const intro = view === 'news' ? c.newsIntro : view === 'works' ? c.worksIntro : view === 'timeline' ? c.eventIntro : c.fanIntro;
  return <main className="hub-page hub-detail"><header className="hub-page-heading"><p className="eyebrow">CULUA / {view.toUpperCase()}</p><h1>{title}</h1><p>{intro}</p></header>
    {view === 'news' && <><ArtistFilter value={artist} onChange={setArtist}/><NewsList items={data.news.filter(n => artist === 'all' || n.artists.some(a => a === artist))}/></>}
    {view === 'works' && <><div className="hub-filters"><label className="hub-search"><Search size={18}/><input aria-label={c.search} placeholder={c.search} value={query} onChange={e => setQuery(e.target.value)}/></label><select aria-label={c.works} value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option value="date">{c.latest}</option><option value="name">A–Z</option></select></div><div className="hub-work-grid">{works.map(w => <ReleaseCard key={w.id} work={w}/>)}</div>{!works.length && <Empty/>}</>}
    {view === 'timeline' && <><div className="hub-filters"><div className="hub-tabs">{(['upcoming', 'history'] as const).map(p => <button key={p} aria-pressed={period === p} onClick={() => setPeriod(p)}>{c[p]}</button>)}</div><ArtistFilter value={artist} onChange={setArtist}/><select aria-label={c.events} value={kind} onChange={e => setKind(e.target.value as typeof kind)}><option value="all">{c.every}</option><option value="event">{c.event}</option><option value="release">{c.release}</option></select></div><p className="subtle">{c.zone}</p><EventList items={timeline} empty={period === 'upcoming' ? c.noUpcoming : c.empty}/></>}
    {view === 'fanart' && <><ArtistFilter value={artist} onChange={setArtist}/><FanList data={{ ...data, fanPosts: data.fanPosts.filter(p => artist === 'all' || p.artists.some(a => a === artist)) }}/></>}
    <Sources sources={data.sources.filter(s => view === 'news' ? s.name.includes('News') : view === 'works' ? !s.name.includes('News') && !s.name.startsWith('X') : view === 'fanart' ? s.name.startsWith('X') : !s.name.includes('Selection'))}/>
  </main>;
}
function ArtistFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { lang } = useLanguage(); const c = hubCopy[lang];
  return <select className="artist-filter" aria-label={c.artists} value={value} onChange={e => onChange(e.target.value)}><option value="all">{c.every}</option><option value="CULUA">CULUA（カルア）</option><option value="NEUN">NEUN（ノイン）</option><option value="MEDA">MEDA（メダ）</option></select>;
}
function Heading({ title, label, href }: { title: string; label: string; href: string }) {
  const { lang } = useLanguage();
  return <div className="hub-heading"><div><p className="eyebrow">{label}</p><h2>{title}</h2></div><Link href={href}>{hubCopy[lang].all}<ArrowUpRight size={16}/></Link></div>;
}
function Empty() { const { lang } = useLanguage(); return <p className="hub-empty">{hubCopy[lang].empty}</p>; }
function NewsList({ items }: { items: NewsItem[] }) {
  const { lang } = useLanguage(); const c = hubCopy[lang];
  return items.length ? <div className="news-list">{items.map(n => <a key={n.id} className="news-card" href={n.sourceUrl} target="_blank" rel="noopener noreferrer"><div className="card-meta"><time dateTime={n.publishedDate}>{n.publishedDate}</time><span>{n.category} · {n.artists.join(' / ')}</span></div><h3>{n.title}</h3><p>RK Music <ArrowUpRight size={14}/></p></a>)}</div> : <div><Empty/><a className="text-link" href="https://rkmusic.jp/info/" target="_blank" rel="noopener noreferrer">{c.source} ↗</a></div>;
}
function EventList({ items, empty }: { items: TimelineItem[]; empty: string }) {
  const { lang } = useLanguage(); const c = hubCopy[lang];
  return items.length ? <div className="event-list">{items.map(e => <article key={e.id} className="event-card"><div className="event-date"><CalendarDays size={18}/><time dateTime={e.date}>{e.date}</time></div><div><span className="event-kind">{e.kind === 'event' ? c.event : c.release} · {e.artists.join(' / ')}</span><h3><a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">{e.title}<ArrowUpRight size={14}/></a></h3>{e.detail && <p>{e.detail}</p>}</div></article>)}</div> : <p className="hub-empty">{empty}</p>;
}
function ReleaseCard({ work }: { work: OfficialWork }) {
  const { lang } = useLanguage(); const c = hubCopy[lang]; const { playSong } = usePlayer();
  const mv = work.videos[0]; const id = mv ? videoId(mv.url) : '';
  const play = (video: { title: string; url: string }) => playSong({ songName: video.title.replace(/^CULUA\s*/, '').replace(/Official Music Video/gi, '').replace(/[「」]/g, '').trim() || work.title, artist: 'CULUA', versions: [{ date: work.releaseDate || '', streamUrl: video.url, streamTitle: video.title, timestamp: '0:00', timestampSeconds: 0, songLink: work.sourceUrl }] });
  const art = <div className="release-art">{id ? <Image src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" width={480} height={300} sizes="(max-width: 700px) 45vw, 25vw"/> : <div className="release-type-art"><Music2 size={30}/><span>{work.title}</span><small>CULUA / ORIGINAL MUSIC</small></div>}{mv && <span className="release-play"><Play size={22} fill="currentColor"/></span>}</div>;
  return <article className="release-card">{mv ? <button className="release-cover" onClick={() => play(mv)} aria-label={`${c.play}: ${mv.title}`}>{art}</button> : <a className="release-cover" href={work.streamingUrl || work.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`${c.streaming}: ${work.title}`}>{art}</a>}<div className="release-body"><time dateTime={work.releaseDate || undefined}>{work.releaseDate || c.undated}</time><h3>{work.title}</h3><div className="release-links"><a href={work.sourceUrl} target="_blank" rel="noopener noreferrer">{c.source} ↗</a>{work.streamingUrl && <a href={work.streamingUrl} target="_blank" rel="noopener noreferrer">{c.streaming} ↗</a>}</div>{work.videos.length > 1 && <details><summary>{c.play} ({work.videos.length})</summary>{work.videos.map(v => <button key={v.url} onClick={() => play(v)}>{v.title}<Play size={12}/></button>)}</details>}</div></article>;
}
function FanList({ data, limit }: { data: Content; limit?: number }) {
  const { lang } = useLanguage(); const c = hubCopy[lang];
  return data.fanPosts.length ? <div className="fan-grid">{data.fanPosts.slice(0, limit).map(post => <FanPostEmbed key={post.id} post={post}/>)}</div> : <div className="fan-empty"><Sparkles size={28}/><h3>{c.fanEmpty}</h3><p>{c.fanIntro}</p><a href="https://x.com/culua0211" target="_blank" rel="noopener noreferrer">CULUA / X ↗</a></div>;
}
function Sources({ sources }: { sources: SourceState[] }) {
  const { lang } = useLanguage(); const c = hubCopy[lang];
  return <details className="hub-sources"><summary>{c.status} · {c.originalLanguage}</summary><ul>{sources.map(s => <li key={s.name}><span>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.name} ↗</a> : s.name}</span><span className={`source-${s.status}`}>{c[s.status]}</span>{s.updatedAt && <small>{c.updated}: {new Intl.DateTimeFormat(lang === 'zh' ? 'zh-TW' : lang, { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Taipei' }).format(new Date(s.updatedAt))} (UTC+8)</small>}</li>)}</ul></details>;
}
