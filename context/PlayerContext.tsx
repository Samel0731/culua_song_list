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

interface PlayerProviderProps {
  children: React.ReactNode;
  initialSongs: GroupedSong[];
}

export function PlayerProvider({ children, initialSongs }: PlayerProviderProps) {
  // 1. 初始化資料
  const [allSongs, setAllSongs] = useState<GroupedSong[]>(initialSongs || []);
  const [loading, setLoading] = useState(false); // 因為是 SSR，Client 端初始 loading 為 false
  
  const [currentSong, setCurrentSong] = useState<GroupedSong | null>(null);
  const [currentVersion, setCurrentVersion] = useState<SongVersion | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('list-loop');

  const playSong = useCallback((song: GroupedSong, version?: SongVersion) => {
    // 如果沒有指定版本，預設選第一個
    const targetVersion = version || song.versions[0];
    
    // 如果點擊的是當前正在播的版本，只切換播放/暫停
    if (currentSong?.songName === song.songName && currentVersion?.streamUrl === targetVersion.streamUrl) {
      setIsPlaying(prev => !prev);
      return;
    }

    setCurrentSong(song);
    setCurrentVersion(targetVersion);
    setIsPlaying(true);
  }, [currentSong, currentVersion]);

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

  // ✨ 修改重點：增強版隨機播放
  const playRandom = useCallback(() => {
    // 1. 檢查是否有歌
    if (allSongs.length === 0) {
      console.warn("⚠️ 隨機播放失敗：資料庫 (allSongs) 為空。");
      
      // 🚨 備案：如果資料庫是空的 (例如本地開發沒連 Google Sheet)，
      // 我們手動建立一個臨時的「隨機歌單」，包含那三首 Hero Songs，確保按鈕有反應。
      const fallbackSongs: GroupedSong[] = [
        { songName: "てんぺんちー", artist: "CULUA", versions: [{
          date: "2025/12/19", streamUrl: "https://youtu.be/k8l_5e1MNqE", streamTitle: "てんぺんちー", timestampSeconds: 0,
          timestamp: '',
          songLink: ''
        }] },
        { songName: "ベビ・デビ", artist: "CULUA", versions: [{
          date: "2024/5/18", streamUrl: "https://youtu.be/Hx1KAdapT1M", streamTitle: "ベビ・デビ", timestampSeconds: 0,
          timestamp: '',
          songLink: ''
        }] },
        { songName: "スペクトロライト", artist: "CULUA", versions: [{
          date: "2025/05/03", streamUrl: "https://youtu.be/AqTecLnlcOA", streamTitle: "スペクトロライト", timestampSeconds: 0,
          timestamp: '',
          songLink: ''
        }] }
      ];

      const randomFallback = fallbackSongs[Math.floor(Math.random() * fallbackSongs.length)];
      
      alert(`資料庫目前沒有歌曲 (可能是 API 設定問題)。\n將為您播放備用歌曲：${randomFallback.songName}`);
      playSong(randomFallback);
      return;
    }

    // 2. 正常的隨機播放
    const randomSong = allSongs[Math.floor(Math.random() * allSongs.length)];
    playSong(randomSong);
  }, [allSongs, playSong]);

  const playNext = useCallback(() => {
    if (!currentSong || allSongs.length === 0) return;

    if (playMode === 'version-loop') {
      const vIndex = currentSong.versions.findIndex(v => v.streamUrl === currentVersion?.streamUrl);
      let nextVIndex = vIndex + 1;
      if (nextVIndex >= currentSong.versions.length) nextVIndex = 0;
      playSong(currentSong, currentSong.versions[nextVIndex]);
      return;
    }

    if (playMode === 'shuffle') {
      playRandom();
      return;
    }

    // list-loop
    const currentIndex = allSongs.findIndex(s => s.songName === currentSong.songName);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= allSongs.length) nextIndex = 0;
    playSong(allSongs[nextIndex]);

  }, [allSongs, currentSong, currentVersion, playMode, playSong, playRandom]);

  const playPrev = useCallback(() => {
     if (!currentSong || allSongs.length === 0) return;
     const currentIndex = allSongs.findIndex(s => s.songName === currentSong.songName);
     let prevIndex = currentIndex - 1;
     if (prevIndex < 0) prevIndex = allSongs.length - 1;
     playSong(allSongs[prevIndex]);
  }, [allSongs, currentSong, playSong]);

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