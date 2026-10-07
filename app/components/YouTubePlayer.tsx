"use client";

import { useCallback, useEffect, useRef } from 'react';
import { videoId } from '@/utils/featuredWorks';

export interface YouTubeInstance {
  loadVideoById: (options: { videoId: string; startSeconds: number }) => void;
  cueVideoById: (options: { videoId: string; startSeconds: number }) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getVolume: () => number;
  setVolume: (volume: number) => void;
  isMuted: () => boolean;
  mute: () => void;
  unMute: () => void;
}
interface YouTubeAPI {
  Player: new (element: HTMLElement, options: {
    width: string; height: string; videoId: string;
    playerVars: Record<string, number | string>;
    events: {
      onReady: (event: { target: YouTubeInstance }) => void;
      onStateChange: (event: { data: number }) => void;
      onError: () => void;
      onAutoplayBlocked: () => void;
    };
  }) => YouTubeInstance;
}
declare global { interface Window { YT?: YouTubeAPI; } }
interface Props {
  url: string; startTime?: number; playbackRequest: number; isPlaying: boolean;
  onEnd: () => void; onPlayingChange: (playing: boolean) => void;
  onStatus: (status: 'ready' | 'blocked' | 'error') => void;
  onPlayerReady?: (player: YouTubeInstance) => void;
}

// One iframe for the whole session; route and panel changes never recreate it.
export default function YouTubePlayer(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubeInstance | null>(null);
  const latest = useRef(props);
  useEffect(() => { latest.current = props; });
  const loaded = useRef('');
  const requested = useRef(-1);

  const ready = useRef(false);
  const syncVideo = useCallback(() => {
      if (!ready.current || !player.current) return;
      const current = latest.current;
      const id = videoId(current.url);
      if (!id) { current.onStatus('error'); return; }
      const key = `${id}:${current.startTime || 0}`;
      if (loaded.current !== key || requested.current !== current.playbackRequest) {
        loaded.current = key;
        requested.current = current.playbackRequest;
        current.onStatus('ready');
        const options = { videoId: id, startSeconds: current.startTime || 0 };
        if (current.isPlaying) player.current.loadVideoById(options);
        else player.current.cueVideoById(options);
      }
  }, []);

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const init = () => {
      if (disposed || !host.current || !window.YT?.Player) return;
      if (timer) clearInterval(timer);
      const mount = document.createElement('div');
      host.current.replaceChildren(mount);
      player.current = new window.YT.Player(mount, {
        width: '100%', height: '100%', videoId: videoId(latest.current.url),
        playerVars: { controls: 1, playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: event => {
            if (disposed) return;
            player.current = event.target;
            ready.current = true;
            latest.current.onPlayerReady?.(event.target);
            syncVideo();
          },
          onStateChange: event => {
            if (disposed) return;
            if (event.data === 1) { latest.current.onStatus('ready'); latest.current.onPlayingChange(true); }
            if (event.data === 2) latest.current.onPlayingChange(false);
            if (event.data === 0) latest.current.onEnd();
          },
          onError: () => { if (disposed) return; latest.current.onPlayingChange(false); latest.current.onStatus('error'); },
          onAutoplayBlocked: () => { if (disposed) return; latest.current.onPlayingChange(false); latest.current.onStatus('blocked'); },
        },
      });
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]') && !window.YT?.Player) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => latest.current.onStatus('error');
      document.head.appendChild(script);
    }
    if (window.YT?.Player) init();
    else timer = setInterval(() => { if (window.YT?.Player) init(); }, 100);
    const timeout = setTimeout(() => { if (!ready.current) latest.current.onStatus('error'); }, 15000);
    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
      clearTimeout(timeout);
      player.current?.destroy();
      player.current = null;
      ready.current = false;
      loaded.current = '';
      requested.current = -1;
    };
  }, [syncVideo]);

  useEffect(() => { syncVideo(); }, [props.url, props.startTime, props.playbackRequest, syncVideo]);

  useEffect(() => {
    if (!ready.current || !player.current) return;
    if (props.isPlaying) player.current.playVideo();
    else player.current?.pauseVideo();
  }, [props.isPlaying]);

  return <div ref={host} className="youtube-host" />;
}
