'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { GroupedSong, SongVersion } from '@/utils/dataProcessor';
import { featuredWorks } from '@/utils/featuredWorks';

export type PlayMode = 'list-loop' | 'version-loop' | 'shuffle';

interface PlayerContextType {
  allSongs: GroupedSong[];
  loading: boolean;
  currentSong: GroupedSong | null;
  currentVersion: SongVersion | null;
  isPlaying: boolean;
  playMode: PlayMode;
  toggleMode: () => void;
  playSong: (song: GroupedSong, version?: SongVersion) => void;
  playRandom: () => void;
  playNext: () => void;
  playPrev: () => void;
  closePlayer: () => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  playbackRequest: number;
  isExpanded: boolean;
  toggleExpand: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

interface PlayerProviderProps {
  children: React.ReactNode;
  initialSongs: GroupedSong[];
}

export function PlayerProvider({ children, initialSongs }: PlayerProviderProps) {

  // ✨ 終極防線：強制檢查 initialSongs 是否為真正的陣列
  const safeInitialSongs = Array.isArray(initialSongs) ? initialSongs : [];

  // 1. 初始化資料 (使用安全檢查後的變數)
  const [allSongs] = useState<GroupedSong[]>(safeInitialSongs);
  const [loading] = useState(false); // 因為是 SSR，Client 端初始 loading 為 false

  const [currentSong, setCurrentSong] = useState<GroupedSong | null>(null);
  const [currentVersion, setCurrentVersion] = useState<SongVersion | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRequest, setPlaybackRequest] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('list-loop');

  const playSong = useCallback((song: GroupedSong, version?: SongVersion) => {
    const targetVersion = version || song.versions[0];
    if (!targetVersion?.streamUrl) return;
    setCurrentSong(song);
    setCurrentVersion(targetVersion);
    setPlaybackRequest(request => request + 1);
    setIsPlaying(true);
  }, []);

  const closePlayer = useCallback(() => {
    setCurrentSong(null);
    setCurrentVersion(null);
    setIsPlaying(false);
    setIsExpanded(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (currentSong) {
      setIsPlaying(prev => !prev);
    }
  }, [currentSong]);

  const toggleMode = useCallback(() => {
    setPlayMode(prev => {
      if (prev === 'list-loop') return 'version-loop';
      if (prev === 'version-loop') return 'shuffle';
      return 'list-loop';
    });
  }, []);

  const queue = allSongs.length ? allSongs : featuredWorks;
  const playRandom = useCallback(() => {
    const choices = queue.filter(song => song !== currentSong);
    const pool = choices.length ? choices : queue;
    if (pool.length) playSong(pool[Math.floor(Math.random() * pool.length)]);
  }, [queue, currentSong, playSong]);

  const playNext = useCallback(() => {
    if (!currentSong) return;
    if (playMode === 'version-loop') {
      const index = currentSong.versions.findIndex(version => version.streamUrl === currentVersion?.streamUrl && version.timestampSeconds === currentVersion?.timestampSeconds);
      playSong(currentSong, currentSong.versions[(index + 1) % currentSong.versions.length]);
    } else if (playMode === 'shuffle') {
      playRandom();
    } else {
      // Featured originals retain their own sequence even when absent from the archive.
      const list = featuredWorks.includes(currentSong) ? featuredWorks : queue;
      const index = list.findIndex(song => song.songName === currentSong.songName);
      if (list.length) playSong(list[(index + 1) % list.length]);
    }
  }, [queue, currentSong, currentVersion, playMode, playSong, playRandom]);

  const playPrev = useCallback(() => {
    if (!currentSong) return;
    if (playMode === 'version-loop') {
      const index = currentSong.versions.findIndex(version => version.streamUrl === currentVersion?.streamUrl && version.timestampSeconds === currentVersion?.timestampSeconds);
      playSong(currentSong, currentSong.versions[(index - 1 + currentSong.versions.length) % currentSong.versions.length]);
    } else {
      const list = featuredWorks.includes(currentSong) ? featuredWorks : queue;
      const index = list.findIndex(song => song.songName === currentSong.songName);
      if (list.length) playSong(list[(index - 1 + list.length) % list.length]);
    }
  }, [queue, currentSong, currentVersion, playMode, playSong]);

  const toggleExpand = useCallback(() => setIsExpanded(prev => !prev), []);

  return (
    <PlayerContext.Provider value={{
      allSongs,
      loading,
      currentSong,
      currentVersion,
      isPlaying,
      playMode,
      toggleMode,
      playSong,
      playRandom,
      playNext,
      playPrev,
      closePlayer,
      togglePlay,
      setPlaying: setIsPlaying,
      playbackRequest,
      isExpanded,
      toggleExpand
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}