'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { GroupedSong, SongVersion } from '@/utils/dataProcessor';
import { checkLive, trackSong, type LiveHouseProject, type LiveSession, type LiveCheck } from '@/utils/liveHouse/model';

export type PlayMode = 'list-loop' | 'version-loop' | 'shuffle';

interface PlayerContextType {
  liveSession: LiveSession | null;
  startLive: (project: LiveHouseProject) => LiveCheck;
  isBuffering: boolean;
  setBuffering: (buffering: boolean) => void;
  allSongs: GroupedSong[];
  refreshSongs: (songs: GroupedSong[]) => void;
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
  initialOriginals?: GroupedSong[];
}

export function PlayerProvider({ children, initialSongs, initialOriginals = [] }: PlayerProviderProps) {

  // ✨ 終極防線：強制檢查 initialSongs 是否為真正的陣列
  const safeInitialSongs = Array.isArray(initialSongs) ? initialSongs : [];

  // 1. 初始化資料 (使用安全檢查後的變數)
  const [allSongs, setAllSongs] = useState<GroupedSong[]>(safeInitialSongs);
  const refreshSongs = useCallback((songs: GroupedSong[]) => { setAllSongs(songs); }, []);
  const [loading] = useState(false); // 因為是 SSR，Client 端初始 loading 為 false

  const [currentSong, setCurrentSong] = useState<GroupedSong | null>(null);
  const [currentVersion, setCurrentVersion] = useState<SongVersion | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRequest, setPlaybackRequest] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('list-loop');
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [isBuffering, setBuffering] = useState(false);

  const loadLiveTrack = useCallback((session: LiveSession) => {
    const song = trackSong(session.project.tracks[session.index]);
    setLiveSession(session);
    setCurrentSong(song);
    setCurrentVersion(song.versions[0]);
    setPlaybackRequest(request => request + 1);
    setBuffering(true);
    setIsPlaying(true);
  }, []);
  const startLive = useCallback((project: LiveHouseProject) => {
    const result = checkLive(project);
    if (result.ok) loadLiveTrack({ project: structuredClone(result.project), index: 0, finished: false });
    return result;
  }, [loadLiveTrack]);

  const playSong = useCallback((song: GroupedSong, version?: SongVersion) => {
    const targetVersion = version || song.versions[0];
    if (!targetVersion?.streamUrl) return;
    setLiveSession(null);
    setBuffering(true);
    setCurrentSong(song);
    setCurrentVersion(targetVersion);
    setPlaybackRequest(request => request + 1);
    setIsPlaying(true);
  }, []);

  const closePlayer = useCallback(() => {
    setLiveSession(null);
    setBuffering(false);
    setCurrentSong(null);
    setCurrentVersion(null);
    setIsPlaying(false);
    setIsExpanded(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (liveSession?.finished) { loadLiveTrack({ ...liveSession, finished: false }); return; }
    if (currentSong) {
      setIsPlaying(prev => !prev);
    }
  }, [currentSong, liveSession, loadLiveTrack]);

  const toggleMode = useCallback(() => {
    setPlayMode(prev => {
      if (prev === 'list-loop') return 'version-loop';
      if (prev === 'version-loop') return 'shuffle';
      return 'list-loop';
    });
  }, []);

  const originalActive = (currentSong !== null && initialOriginals.includes(currentSong)) || initialOriginals.some(s => s.versions.some(v => v.songLink && v.songLink === currentVersion?.songLink && v.streamUrl === currentVersion?.streamUrl));
  const queue = originalActive ? initialOriginals : allSongs.length ? allSongs : initialOriginals;
  const playRandom = useCallback(() => {
    const choices = queue.filter(song => song !== currentSong);
    const pool = choices.length ? choices : queue;
    if (pool.length) playSong(pool[Math.floor(Math.random() * pool.length)]);
  }, [queue, currentSong, playSong]);

  const playNext = useCallback(() => {
    if (liveSession) {
      if (liveSession.index + 1 < liveSession.project.tracks.length) loadLiveTrack({ ...liveSession, index: liveSession.index + 1, finished: false });
      else { setIsPlaying(false); setLiveSession({ ...liveSession, finished: true }); }
      return;
    }
    if (!currentSong) return;
    if (playMode === 'version-loop') {
      const index = currentSong.versions.findIndex(version => version.streamUrl === currentVersion?.streamUrl && version.timestampSeconds === currentVersion?.timestampSeconds);
      playSong(currentSong, currentSong.versions[(index + 1) % currentSong.versions.length]);
    } else if (playMode === 'shuffle') {
      playRandom();
    } else {
      // Featured originals retain their own sequence even when absent from the archive.
      const list = queue;
      const index = list.findIndex(song => song.songName === currentSong.songName || (originalActive && song.versions.some(v => v.streamUrl === currentVersion?.streamUrl)));
      if (list.length) playSong(list[(index + 1) % list.length]);
    }
  }, [queue, currentSong, currentVersion, playMode, playSong, playRandom, originalActive, liveSession, loadLiveTrack]);

  const playPrev = useCallback(() => {
    if (liveSession) {
      loadLiveTrack({ ...liveSession, index: Math.max(0, liveSession.index - 1), finished: false });
      return;
    }
    if (!currentSong) return;
    if (playMode === 'version-loop') {
      const index = currentSong.versions.findIndex(version => version.streamUrl === currentVersion?.streamUrl && version.timestampSeconds === currentVersion?.timestampSeconds);
      playSong(currentSong, currentSong.versions[(index - 1 + currentSong.versions.length) % currentSong.versions.length]);
    } else {
      const list = queue;
      const index = list.findIndex(song => song.songName === currentSong.songName || (originalActive && song.versions.some(v => v.streamUrl === currentVersion?.streamUrl)));
      if (list.length) playSong(list[(index - 1 + list.length) % list.length]);
    }
  }, [queue, currentSong, currentVersion, playMode, playSong, originalActive, liveSession, loadLiveTrack]);

  const toggleExpand = useCallback(() => setIsExpanded(prev => !prev), []);

  return (
    <PlayerContext.Provider value={{ liveSession, startLive, isBuffering, setBuffering,
      allSongs,
      refreshSongs,
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
