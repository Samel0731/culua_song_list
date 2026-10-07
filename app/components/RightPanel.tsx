"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Play, Pause, SkipBack, SkipForward, ChevronUp, ChevronDown, X, Repeat, Shuffle, Share2, ExternalLink } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useLanguage } from '@/context/LanguageContext';
import { stageCopy } from '@/utils/stageCopy';
import YouTubePlayer, { YouTubeInstance } from './YouTubePlayer';
import ShareModal from './ShareModal';

export default function RightPanel() {
  const { currentSong, currentVersion, isPlaying, setPlaying, playbackRequest, closePlayer, playSong, playNext, playPrev, playMode, toggleMode, togglePlay, isExpanded, toggleExpand } = usePlayer();
  const { lang, t } = useLanguage();
  const copy = stageCopy[lang];
  const [shareOpen, setShareOpen] = useState(false);
  const [statusState, setStatus] = useState<{ kind: 'ready' | 'blocked' | 'error'; request: number }>({ kind: 'ready', request: -1 });
  const status = statusState.request === playbackRequest ? statusState.kind : 'ready';
  const playerRef = useRef<YouTubeInstance | null>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const modeLabel = playMode === 'shuffle' ? t.mode_shuffle : playMode === 'version-loop' ? t.mode_version_loop : t.mode_list_loop;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!currentSong || shareOpen) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, button, a, [contenteditable=true]')) return;
      const player = playerRef.current;
      if (event.code === 'Escape' && isExpanded) { toggleExpand(); expandRef.current?.focus(); }
      if (event.code === 'Space' || event.code === 'KeyK') { event.preventDefault(); togglePlay(); }
      if (event.shiftKey && event.code === 'KeyN') playNext();
      if (event.shiftKey && event.code === 'KeyP') playPrev();
      if (event.code === 'ArrowRight' || event.code === 'KeyL') player?.seekTo(player.getCurrentTime() + 5, true);
      if (event.code === 'ArrowLeft' || event.code === 'KeyJ') player?.seekTo(Math.max(0, player.getCurrentTime() - 5), true);
      if (event.code === 'ArrowUp' && player) { event.preventDefault(); player.setVolume(Math.min(100, player.getVolume() + 10)); }
      if (event.code === 'ArrowDown' && player) { event.preventDefault(); player.setVolume(Math.max(0, player.getVolume() - 10)); }
      if (event.code === 'KeyM' && player) { if (player.isMuted()) player.unMute(); else player.mute(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentSong, shareOpen, isExpanded, toggleExpand, togglePlay, playNext, playPrev]);

  if (!currentSong || !currentVersion) return null;
  return <aside className={`stage-player ${isExpanded ? 'expanded' : ''}`} aria-label={copy.expand}>
    <div className="player-panel" id="player-panel">
      <div className="player-video"><YouTubePlayer url={currentVersion.streamUrl} startTime={currentVersion.timestampSeconds} playbackRequest={playbackRequest} isPlaying={isPlaying} onEnd={playNext} onPlayingChange={setPlaying} onStatus={kind => setStatus({ kind, request: playbackRequest })} onPlayerReady={player => { playerRef.current = player; }} /></div>
      <div className="player-details" hidden={!isExpanded}>
        <div className="player-details-title"><div><p className="eyebrow">NOW PLAYING</p><h2>{currentSong.songName}</h2><p>{currentSong.artist} · {currentVersion.date}</p></div><button className="icon-button" onClick={toggleExpand} aria-label={copy.collapse}><ChevronDown/></button></div>
        <div className="player-extra"><button onClick={() => setShareOpen(true)}><Share2 size={16}/>{t.share_btn}</button><a href={currentVersion.streamUrl} target="_blank" rel="noopener noreferrer">{t.original_link}<ExternalLink size={15}/></a><Link href="/focus" onClick={() => { if (isExpanded) toggleExpand(); }}>{t.focus_mode_btn}</Link></div>
        <h3>{t.versions} ({currentSong.versions.length})</h3><div className="version-list">{currentSong.versions.map((version, index) => {
          const active = version.streamUrl === currentVersion.streamUrl && version.timestampSeconds === currentVersion.timestampSeconds;
          return <button key={`${version.streamUrl}-${version.timestampSeconds}-${index}`} aria-pressed={active} className={active ? 'active' : ''} onClick={() => playSong(currentSong, version)}><Play size={15}/><span>{version.streamTitle}<small>{version.date} · {version.timestamp || '0:00'}</small></span></button>;
        })}</div>
      </div>
    </div>
    {status !== 'ready' && <div className="player-status" role="status">{status === 'error' ? copy.unavailable : copy.blocked}<button onClick={status === 'error' ? playNext : togglePlay}>{status === 'error' ? copy.next : copy.play}</button><a href={currentVersion.streamUrl} target="_blank" rel="noopener noreferrer">YouTube ↗</a></div>}
    <div className="player-bar">
      <div className="player-track"><span className={`playing-light ${isPlaying ? 'playing' : ''}`} /><div><strong>{currentSong.songName}</strong><small>{currentSong.artist}</small></div></div>
      <div className="transport"><button className="icon-button" onClick={playPrev} aria-label={copy.previous}><SkipBack size={19}/></button><button className="play-button" onClick={togglePlay} aria-label={isPlaying ? copy.pause : copy.play}>{isPlaying ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>}</button><button className="icon-button" onClick={playNext} aria-label={copy.next}><SkipForward size={19}/></button></div>
      <div className="player-tools"><button className="mode-button" onClick={toggleMode} aria-label={modeLabel} title={modeLabel}>{playMode === 'shuffle' ? <Shuffle size={17}/> : <Repeat size={17}/>}<span>{modeLabel}</span></button><button ref={expandRef} className="icon-button" onClick={toggleExpand} aria-controls="player-panel" aria-expanded={isExpanded} aria-label={isExpanded ? copy.collapse : copy.expand}>{isExpanded ? <ChevronDown size={21}/> : <ChevronUp size={21}/>}</button><button className="icon-button stop-button" onClick={closePlayer} aria-label={copy.stop}><X size={18}/></button></div>
    </div>
    <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} song={currentSong} version={currentVersion}/>
  </aside>;
}
