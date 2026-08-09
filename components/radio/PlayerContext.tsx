'use client';

import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

export interface Track { name: string; url: string; }

interface PlayerState {
  playlist: Track[];
  nowIdx: number | null;
  playing: boolean;
  progress: number;
  duration: number;
  volume: number;
  jingles: Track[];
  jingleIdx: number | null;
  jinglePlaying: boolean;
  jingleProgress: number;
  jingleDuration: number;
}

interface PlayerActions {
  addTracks: (files: FileList, type: 'music' | 'jingle') => void;
  playTrack: (idx: number) => void;
  removeTrack: (idx: number, type: 'music' | 'jingle') => void;
  togglePlay: () => void;
  seek: (pct: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  fireJingle: (idx: number) => void;
  stopJingle: () => void;
  setVolume: (v: number) => void;
}

const PlayerContext = createContext<(PlayerState & PlayerActions) | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [nowIdx, setNowIdx]     = useState<number | null>(null);
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);

  const [jingles, setJingles]           = useState<Track[]>([]);
  const [jingleIdx, setJingleIdx]       = useState<number | null>(null);
  const [jinglePlaying, setJinglePlaying] = useState(false);
  const [jingleProgress, setJingleProgress] = useState(0);
  const [jingleDuration, setJingleDuration] = useState(0);

  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const jingleRef  = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef(playlist);
  const nowIdxRef   = useRef(nowIdx);

  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { nowIdxRef.current = nowIdx; }, [nowIdx]);

  /* ── Init audio elements once ── */
  useEffect(() => {
    const music = new Audio();
    audioRef.current = music;
    music.addEventListener('timeupdate', () => setProgress(music.currentTime));
    music.addEventListener('loadedmetadata', () => setDuration(music.duration));
    music.addEventListener('ended', () => {
      const next = (nowIdxRef.current ?? -1) + 1;
      setNowIdx(next < playlistRef.current.length ? next : null);
    });

    const jingle = new Audio();
    jingleRef.current = jingle;
    jingle.addEventListener('timeupdate', () => setJingleProgress(jingle.currentTime));
    jingle.addEventListener('loadedmetadata', () => setJingleDuration(jingle.duration));
    jingle.addEventListener('ended', () => {
      if (audioRef.current) audioRef.current.volume = 1;
      setVolumeState(1);
      setJinglePlaying(false);
      setJingleProgress(0);
      setJingleIdx(null);
    });

    return () => {
      music.pause(); music.src = '';
      jingle.pause(); jingle.src = '';
    };
  }, []);

  /* ── React to nowIdx change ── */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (nowIdx === null) { el.pause(); setPlaying(false); return; }
    const track = playlistRef.current[nowIdx];
    if (!track) return;
    el.src = track.url;
    el.volume = volume;
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowIdx]);

  /* ── Actions ── */
  const addTracks = useCallback((files: FileList, type: 'music' | 'jingle') => {
    const tracks: Track[] = Array.from(files)
      .filter(f => f.type.startsWith('audio/'))
      .map(f => ({ name: f.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(f) }));
    if (type === 'music') setPlaylist(prev => [...prev, ...tracks]);
    else setJingles(prev => [...prev, ...tracks]);
  }, []);

  const playTrack = useCallback((idx: number) => {
    if (nowIdx === idx) {
      const el = audioRef.current!;
      if (playing) { el.pause(); setPlaying(false); }
      else { el.play().then(() => setPlaying(true)); }
    } else {
      setNowIdx(idx);
    }
  }, [nowIdx, playing]);

  const togglePlay = useCallback(() => {
    if (nowIdx === null) return;
    playTrack(nowIdx);
  }, [nowIdx, playTrack]);

  const seek = useCallback((pct: number) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    el.currentTime = pct * duration;
  }, [duration]);

  const nextTrack = useCallback(() => {
    setNowIdx(p => (p !== null && p < playlistRef.current.length - 1) ? p + 1 : p);
  }, []);

  const prevTrack = useCallback(() => {
    setNowIdx(p => (p !== null && p > 0) ? p - 1 : p);
  }, []);

  const removeTrack = useCallback((idx: number, type: 'music' | 'jingle') => {
    if (type === 'music') {
      URL.revokeObjectURL(playlistRef.current[idx]?.url ?? '');
      setPlaylist(prev => prev.filter((_, i) => i !== idx));
      setNowIdx(p => {
        if (p === null) return null;
        if (p === idx) { audioRef.current?.pause(); setPlaying(false); return null; }
        return p > idx ? p - 1 : p;
      });
    } else {
      setJingles(prev => {
        URL.revokeObjectURL(prev[idx]?.url ?? '');
        return prev.filter((_, i) => i !== idx);
      });
      if (jingleIdx === idx) {
        jingleRef.current?.pause();
        if (audioRef.current) audioRef.current.volume = 1;
        setVolumeState(1);
        setJinglePlaying(false);
        setJingleIdx(null);
      }
    }
  }, [jingleIdx]);

  const fireJingle = useCallback((idx: number) => {
    const jingle = jingles[idx];
    if (!jingle) return;
    if (audioRef.current) audioRef.current.volume = 0.25;
    setVolumeState(0.25);
    const el = jingleRef.current!;
    el.src = jingle.url;
    el.volume = 1;
    el.play().then(() => { setJinglePlaying(true); setJingleIdx(idx); }).catch(() => {});
  }, [jingles]);

  const stopJingle = useCallback(() => {
    jingleRef.current?.pause();
    if (audioRef.current) audioRef.current.volume = 1;
    setVolumeState(1);
    setJinglePlaying(false);
    setJingleProgress(0);
    setJingleIdx(null);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  return (
    <PlayerContext.Provider value={{
      playlist, nowIdx, playing, progress, duration, volume,
      jingles, jingleIdx, jinglePlaying, jingleProgress, jingleDuration,
      addTracks, playTrack, removeTrack, togglePlay, seek,
      nextTrack, prevTrack, fireJingle, stopJingle, setVolume,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}
