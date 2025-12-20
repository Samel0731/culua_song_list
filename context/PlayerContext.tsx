'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchAndProcessSongs, GroupedSong, SongVersion } from '@/utils/dataProcessor';

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
  playPrev: () => void; // 新增上一首功能
  closePlayer: () => void;
  togglePlay: () => void;
  isExpanded: boolean;
  toggleExpand: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [allSongs, setAllSongs] = useState<GroupedSong[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentSong, setCurrentSong] = useState<GroupedSong | null>(null);
  const [currentVersion, setCurrentVersion] = useState<SongVersion | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('list-loop');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAndProcessSongs(
          'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQdBtem90otSSCpAHO7Al5fz2F0dx-ReDDpgbEfuioiOlkbT5uyfdWbDqPNZvG6YXI0PSab_ge6nE1/pub?gid=0&single=true&output=csv'
        );
        setAllSongs(data);
      } catch (err) {
        console.error("Failed to load songs", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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

    // 1. 版本循環 (同首歌，換下一個 Live)
    if (playMode === 'version-loop') {
      const currentVerIndex = currentSong.versions.findIndex(v => v === currentVersion);
      if (currentVerIndex !== -1 && currentVerIndex < currentSong.versions.length - 1) {
        setCurrentVersion(currentSong.versions[currentVerIndex + 1]);
      } else {
        // 到底了，回到第一個版本
        setCurrentVersion(currentSong.versions[0]);
      }
      return;
    }

    // 2. 隨機播放
    if (playMode === 'shuffle') {
      let nextSong;
      // 簡單防呆：確保隨機到的不是目前這首 (除非只有一首)
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

  // 上一首
  const playPrev = useCallback(() => {
     if (!currentSong || allSongs.length === 0) return;
     // 隨機模式的上一首通常比較複雜，這裡簡單處理：直接回列表上一首
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
      playPrev, // 記得匯出
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