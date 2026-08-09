'use client';

import { usePlayer } from './PlayerContext';
import { usePathname } from 'next/navigation';

function fmt(s: number) {
  if (!isFinite(s) || s === 0) return '0:00';
  const m = Math.floor(s / 60), sc = Math.floor(s % 60);
  return `${m}:${sc.toString().padStart(2, '0')}`;
}

export function FloatingPlayer() {
  const player = usePlayer();
  const pathname = usePathname();

  // Only show when there are tracks loaded
  if (player.playlist.length === 0) return null;

  const currentTrack = player.nowIdx !== null ? player.playlist[player.nowIdx] : null;
  const pct = player.duration ? (player.progress / player.duration) * 100 : 0;
  const onStudio = pathname === '/studio';

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(24,25,28,0.97)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(255,107,43,0.25)',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
    }}>
      {/* Progress bar — full width at top */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'rgba(255,107,43,0.12)', cursor: 'pointer',
        }}
        onClick={e => {
          const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          player.seek((e.clientX - r.left) / r.width);
        }}
      >
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #FF6B2B, #FFAA44)',
          width: `${pct}%`,
          transition: 'width 0.5s',
        }} />
      </div>

      {/* Play / Pause */}
      <button
        onClick={player.togglePlay}
        disabled={player.nowIdx === null}
        style={{
          width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0,
          background: player.nowIdx !== null ? '#FF6B2B' : '#252729',
          color: player.nowIdx !== null ? '#111214' : '#5C5450',
          cursor: player.nowIdx !== null ? 'pointer' : 'default',
          fontSize: 16,
          boxShadow: player.nowIdx !== null ? '0 0 12px rgba(255,107,43,0.50)' : 'none',
        }}
        aria-label={player.playing ? 'Pausar' : 'Tocar'}
      >
        {player.playing ? '⏸' : '▶'}
      </button>

      {/* Prev / Next */}
      <button onClick={player.prevTrack} disabled={player.nowIdx === null || player.nowIdx === 0}
        style={{ background: 'none', border: 'none', color: (player.nowIdx ?? 0) > 0 ? '#9A8F88' : '#3A3330', cursor: 'pointer', fontSize: 16, padding: 0, flexShrink: 0 }}>
        ⏮
      </button>
      <button onClick={player.nextTrack} disabled={player.nowIdx === null || player.nowIdx >= player.playlist.length - 1}
        style={{ background: 'none', border: 'none', color: (player.nowIdx ?? 0) < player.playlist.length - 1 ? '#9A8F88' : '#3A3330', cursor: 'pointer', fontSize: 16, padding: 0, flexShrink: 0 }}>
        ⏭
      </button>

      {/* Track info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          {player.playing && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
              background: 'rgba(255,107,43,0.15)', border: '1px solid rgba(255,107,43,0.40)',
              color: '#FF6B2B', borderRadius: 4, padding: '1px 6px',
              fontWeight: 700, letterSpacing: '0.08em', flexShrink: 0,
            }}>
              ▶ AO VIVO
            </span>
          )}
          {player.jinglePlaying && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
              background: 'rgba(255,170,68,0.15)', border: '1px solid rgba(255,170,68,0.40)',
              color: '#FFAA44', borderRadius: 4, padding: '1px 6px',
              fontWeight: 700, letterSpacing: '0.08em', flexShrink: 0,
            }}>
              🎬 VINHETA
            </span>
          )}
          <p style={{
            fontSize: 13, fontWeight: 600, color: currentTrack ? '#F2EDE8' : '#5C5450',
            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {currentTrack ? currentTrack.name : 'Nenhuma música selecionada'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#5C5450' }}>{fmt(player.progress)}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#3A3330' }}>/</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#5C5450' }}>{fmt(player.duration)}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#3A3330', marginLeft: 4 }}>
            {player.nowIdx !== null ? `#${player.nowIdx + 1}` : ''}{player.playlist.length > 0 ? ` / ${player.playlist.length}` : ''}
          </span>
        </div>
      </div>

      {/* Link to studio if not already there */}
      {!onStudio && (
        <a href="/studio" style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: '#FF6B2B', textDecoration: 'none', flexShrink: 0,
          border: '1px solid rgba(255,107,43,0.30)', borderRadius: 9999,
          padding: '5px 12px', letterSpacing: '0.06em', fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          🎙 Estúdio
        </a>
      )}

      {/* Volume */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 14 }}>🔊</span>
        <input
          type="range" min={0} max={1} step={0.01}
          value={player.volume}
          onChange={e => player.setVolume(parseFloat(e.target.value))}
          style={{ width: 70, accentColor: '#FF6B2B', cursor: 'pointer' }}
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
