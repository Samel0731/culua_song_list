"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { PlayerProvider, usePlayer } from '@/context/PlayerContext';
import { useLanguage } from '@/context/LanguageContext';
import { GroupedSong } from '@/utils/dataProcessor';
import { stageCopy } from '@/utils/stageCopy';
import RightPanel from './RightPanel';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentSong } = usePlayer();
  const { lang, setLang, t } = useLanguage();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === pathname;
  const focus = pathname === '/focus';
  const copy = stageCopy[lang];
  const links = [
    ['/', t.nav_home], ['/discography', copy.works], ['/songs', t.nav_songs],
    ['/artists', t.nav_artists], ['/stats', t.nav_stats], ['/about', t.about_title],
  ];
  return <div className={`site-shell ${currentSong ? 'has-player' : ''} ${focus ? 'focus-shell' : ''}`}>
    {!focus && <header className="site-header">
      <Link href="/" className="brand" aria-label="CULUA Home">CULUA<span>FAN ARCHIVE</span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">{links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}</nav>
      <div className="header-tools"><select aria-label="Language" value={lang} onChange={e => setLang(e.target.value as typeof lang)}><option value="zh">繁中</option><option value="ja">日本語</option><option value="en">EN</option></select><button className="icon-button menu-toggle" aria-label={open ? copy.closeMenu : copy.menu} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setMenuPath(open ? null : pathname)}>{open ? <X size={22}/> : <Menu size={22}/>}</button></div>
      {open && <nav id="mobile-navigation" className="mobile-nav" aria-label="Main navigation" onKeyDown={e => { if (e.key === 'Escape') setMenuPath(null); }}>{links.map(([href, label]) => <Link key={href} href={href} onClick={() => setMenuPath(null)} aria-current={pathname === href ? 'page' : undefined}>{label}<ArrowUpRight size={17}/></Link>)}</nav>}
    </header>}
    <div id="main-content" tabIndex={-1} className={`route-content ${pathname === '/' ? 'home-route' : ''}`} key={pathname}>{children}</div>
    {!focus && <footer className="site-footer"><Link href="/" className="footer-brand">CULUA<span>FAN ARCHIVE</span></Link><p>{copy.fan}<br/>© {new Date().getFullYear()} CULUA Fan Archive</p><div><Link href="/social">{t.nav_social}</Link><Link href="/about">{copy.source}</Link><a href="https://rkmusic.jp/artist/284/" target="_blank" rel="noopener noreferrer">RK Music <ArrowUpRight size={14}/></a></div></footer>}
    <RightPanel />
  </div>;
}

export default function ClientLayout({ children, initialSongs }: { children: React.ReactNode; initialSongs: GroupedSong[] }) {
  return <PlayerProvider initialSongs={Array.isArray(initialSongs) ? initialSongs : []}><LayoutContent>{children}</LayoutContent></PlayerProvider>;
}
