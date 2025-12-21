'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { GroupedSong, SongVersion } from '@/utils/dataProcessor';

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
  isExpanded: boolean;
  toggleExpand: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// ✨ 修改 1: 定義 Props 介面，加入 initialSongs
interface PlayerProviderProps {
  children: React.ReactNode;
  initialSongs: GroupedSong[];
}

// ✨ 修改 2: 在參數中解構出 initialSongs
export function PlayerProvider({ children, initialSongs }: PlayerProviderProps) {
  // ✨ 修改 3: 直接使用傳入的資料初始化 state，並將 loading 設為 false
  const [allSongs, setAllSongs] = useState<GroupedSong[]>(initialSongs);
  const [loading, setLoading] = useState(false);
  
  const [currentSong, setCurrentSong] = useState<GroupedSong | null>(null);
  const [currentVersion, setCurrentVersion] = useState<SongVersion | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('list-loop');

  // ✨ 修改 4: 移除了原本的 useEffect (fetchAndProcessSongs)，因為資料已經由 Server 提供了

  const playSong = useCallback((song: GroupedSong, version?: SongVersion) => {
    setCurrentSong(song);
    const ver = version || song.versions[0];
    setCurrentVersion(ver);
    setIsPlaying(true);
  }, []);

  const closePlayer = useCallback(() => {
    setCurrentSong(null);
    setCurrentVersion(null);
    setIsPlaying(false);
    setIsExpanded(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const toggleMode = useCallback(() => {
    setPlayMode(prev => {
      if (prev === 'list-loop') return 'version-loop';
      if (prev === 'version-loop') return 'shuffle';
      return 'list-loop';
    });
  }, []);

  const playNext = useCallback(() => {
    if (!currentSong || !currentVersion || allSongs.length === 0) return;

    // 1. 版本循環
    if (playMode === 'version-loop') {
      const currentVerIndex = currentSong.versions.findIndex(v => v === currentVersion);
      if (currentVerIndex !== -1 && currentVerIndex < currentSong.versions.length - 1) {
        setCurrentVersion(currentSong.versions[currentVerIndex + 1]);
      } else {
        setCurrentVersion(currentSong.versions[0]);
      }
      return;
    }

    // 2. 隨機播放
    if (playMode === 'shuffle') {
      let nextSong;
      do {
        nextSong = allSongs[Math.floor(Math.random() * allSongs.length)];
      } while (nextSong.songName === currentSong.songName && allSongs.length > 1);
      
      playSong(nextSong);
      return;
    }

    // 3. 列表循環 (預設)
    const currentIndex = allSongs.findIndex(s => s.songName === currentSong.songName);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= allSongs.length) {
      nextIndex = 0;
    }
    playSong(allSongs[nextIndex]);

  }, [allSongs, currentSong, currentVersion, playMode, playSong]);

  const playPrev = useCallback(() => {
     if (!currentSong || allSongs.length === 0) return;
     const currentIndex = allSongs.findIndex(s => s.songName === currentSong.songName);
     let prevIndex = currentIndex - 1;
     if (prevIndex < 0) prevIndex = allSongs.length - 1;
     playSong(allSongs[prevIndex]);
  }, [allSongs, currentSong, playSong]);

  const playRandom = useCallback(() => {
    if (allSongs.length === 0) return;
    const randomSong = allSongs[Math.floor(Math.random() * allSongs.length)];
    playSong(randomSong);
  }, [allSongs, playSong]);

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