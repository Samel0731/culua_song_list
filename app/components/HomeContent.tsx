"use client";

import Link from 'next/link';
import { ArrowUpRight, ArrowDown, Play, Shuffle, Youtube, Instagram } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useLanguage } from '@/context/LanguageContext';
import { stageCopy } from '@/utils/stageCopy';
import { featuredWorks } from '@/utils/featuredWorks';
import WorkCard from './WorkCard';

export default function HomeContent() {
  const { allSongs, playRandom } = usePlayer();
  const { lang, t } = useLanguage();
  const copy = stageCopy[lang];
  const latest = [...allSongs].sort((a, b) => new Date(b.versions[0]?.date || 0).getTime() - new Date(a.versions[0]?.date || 0).getTime()).slice(0, 3);
  const most = [...allSongs].sort((a, b) => b.versions.length - a.versions.length).slice(0, 5);
  return <main className="home-stage">
    <section className="stage-hero">
      <div className="hero-orbit" aria-hidden="true"><span /><span /></div>
      <div className="hero-topline"><span>VOICE / MUSIC / MEMORIES</span><span>カルア</span></div>
      <div className="hero-content"><p className="eyebrow">{copy.fan}</p><h1>CULUA<span className="hero-dot">.</span></h1><h2>{copy.tagline}</h2><p className="hero-description">{copy.intro}</p>
        <div className="hero-actions"><Link href="/songs" className="stage-button primary"><Play size={16} fill="currentColor" />{copy.explore}</Link><button onClick={playRandom} className="stage-button"><Shuffle size={17} />{t.hero_surprise_btn}</button></div>
      </div>
      <div className="hero-bottomline"><span>UNOFFICIAL FAN ARCHIVE</span><a href="#music" aria-label={copy.featured}>SCROLL TO MUSIC <ArrowDown size={16} /></a></div>
    </section>
    <section id="music" className="stage-section"><div className="section-heading"><div><p className="eyebrow">01 / MUSIC</p><h2>{copy.featured}</h2></div><Link href="/discography">{copy.works}<ArrowUpRight size={18}/></Link></div><div className="works-grid featured-grid">{featuredWorks.slice(0, 2).map(song => <WorkCard key={song.songName} song={song} original />)}</div></section>
    <section className="stage-section archive-section"><div className="section-heading"><div><p className="eyebrow">02 / ARCHIVE</p><h2>{copy.latest}</h2></div><Link href="/songs">{t.nav_songs}<ArrowUpRight size={18}/></Link></div>
      {latest.length ? <div className="works-grid">{latest.map(song => <WorkCard key={song.songName} song={song} />)}</div> : <p className="empty-state">{copy.empty}</p>}
      {most.length > 0 && <div className="most-list"><h3>{t.section_most_performed}</h3>{most.map((song, i) => <PerformanceRow key={song.songName} song={song} index={i} />)}</div>}
      <div className="archive-cta"><h3>{copy.archive}</h3><div><Link href="/songs" className="stage-button">{copy.archiveLink}<ArrowUpRight size={16}/></Link><Link href="/focus" className="text-link">{t.focus_mode_btn}</Link></div></div>
    </section>
    <section className="stage-section profile-section"><div><p className="eyebrow">03 / PROFILE</p><h2>{copy.profile}</h2><p className="profile-name">CULUA <span>カルア</span></p></div><div><p className="profile-text">{copy.profileText}</p><a href="https://rkmusic.jp/artist/284/" target="_blank" rel="noopener noreferrer" className="text-link">{copy.officialProfile}<ArrowUpRight size={16}/></a></div></section>
    <section className="stage-section connect-section"><p className="eyebrow">04 / CONNECT</p><h2>{copy.officialLinks}</h2><div className="social-links"><a href="https://www.youtube.com/@CULUAvsinger" target="_blank" rel="noopener noreferrer"><Youtube />YouTube<ArrowUpRight size={16}/></a><a href="https://x.com/culua0211" target="_blank" rel="noopener noreferrer">X<ArrowUpRight size={16}/></a><a href="https://www.instagram.com/culua0211" target="_blank" rel="noopener noreferrer"><Instagram />Instagram<ArrowUpRight size={16}/></a><a href="https://www.tiktok.com/@culuavsinger" target="_blank" rel="noopener noreferrer">TikTok<ArrowUpRight size={16}/></a></div><a className="text-link" href="https://rkmusic.jp/info/" target="_blank" rel="noopener noreferrer">{copy.officialNews}<ArrowUpRight size={16}/></a></section>
  </main>;
}

function PerformanceRow({ song, index }: { song: import('@/utils/dataProcessor').GroupedSong; index: number }) {
  const { playSong } = usePlayer();
  const { t } = useLanguage();
  return <button className="performance-row" onClick={() => playSong(song)}><span className="performance-index">0{index + 1}</span><span className="performance-title">{song.songName}<small>{song.artist}</small></span><span>{song.versions.length} {t.card_versions}</span><Play size={16}/></button>;
}
