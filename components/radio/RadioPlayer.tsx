'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RADIO_CONFIG } from '@/lib/radio-config';
import { LivePill } from './LivePill';
import { Equalizer } from './Equalizer';

function VolumeIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
  ) : (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
}

export function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    audio.addEventListener('waiting', () => setLoading(true));
    audio.addEventListener('playing', () => { setLoading(false); setError(false); });
    audio.addEventListener('error', () => { setLoading(false); setError(true); setPlaying(false); });
    audio.addEventListener('stalled', () => setLoading(true));

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      audio.src = '';
      setPlaying(false);
      setLoading(false);
    } else {
      setError(false);
      setLoading(true);
      audio.src = RADIO_CONFIG.streamUrl + '?nocache=' + Date.now();
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setError(true);
        setLoading(false);
      }
    }
  }, [playing]);

  return (
    <div
      style={{
        background: '#1E2023',
        border: '1px solid rgba(255,107,43,0.20)',
        borderRadius: 20,
        padding: '28px 32px',
        boxShadow: playing ? '0 0 32px rgba(255,107,43,0.18)' : 'none',
        transition: 'box-shadow 0.4s',
        maxWidth: 500,
        width: '100%',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <LivePill isPlaying={playing} />
        <Equalizer active={playing} />
      </div>

      {/* Station name */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#F2EDE8',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          margin: 0,
        }}>
          IBOX <span style={{ color: '#FF6B2B' }}>MUSIC</span>
        </h2>
        <p style={{
          fontSize: 13,
          color: '#9A8F88',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.04em',
          marginTop: 4,
        }}>
          {RADIO_CONFIG.tagline}
        </p>
      </div>

      {/* Play button */}
      <button
        onClick={togglePlay}
        disabled={loading}
        aria-label={playing ? 'Pausar rádio' : 'Tocar rádio'}
        style={{
          width: '100%',
          padding: '16px 0',
          borderRadius: 9999,
          border: 'none',
          cursor: loading ? 'wait' : 'pointer',
          background: playing ? 'transparent' : '#FF6B2B',
          color: playing ? '#FF6B2B' : '#111214',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: '#FF6B2B',
          fontSize: 16,
          fontWeight: 700,
          fontFamily: 'Space Grotesk, sans-serif',
          letterSpacing: '0.05em',
          boxShadow: playing ? 'none' : '0 0 24px rgba(255,107,43,0.45)',
          transition: 'all 0.15s ease-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
        onMouseEnter={e => {
          if (!playing) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 36px rgba(255,107,43,0.65)';
        }}
        onMouseLeave={e => {
          if (!playing) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px rgba(255,107,43,0.45)';
        }}
      >
        {loading ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            CARREGANDO...
          </>
        ) : playing ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
            PAUSAR
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            OUVIR AO VIVO
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <p style={{
          fontSize: 12,
          color: '#ff6b6b',
          fontFamily: 'JetBrains Mono, monospace',
          textAlign: 'center',
          marginTop: 10,
          marginBottom: 0,
        }}>
          ⚠ Falha ao conectar. Verifique a URL do stream.
        </p>
      )}

      {/* Volume */}
      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => setMuted(m => !m)}
          aria-label={muted ? 'Ativar som' : 'Silenciar'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: muted ? '#5C5450' : '#9A8F88',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <VolumeIcon muted={muted} />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={e => {
            const v = parseFloat(e.target.value);
            setVolume(v);
            if (v > 0) setMuted(false);
          }}
          aria-label="Volume"
          style={{
            flex: 1,
            height: 4,
            accentColor: '#FF6B2B',
            cursor: 'pointer',
          }}
        />
        <span style={{
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
          color: '#5C5450',
          minWidth: 32,
          textAlign: 'right',
        }}>
          {muted ? 'MUDO' : `${Math.round((muted ? 0 : volume) * 100)}%`}
        </span>
      </div>
    </div>
  );
}
