'use client';

interface LivePillProps {
  isPlaying: boolean;
}

export function LivePill({ isPlaying }: LivePillProps) {
  return (
    <div
      style={{
        background: 'rgba(255,107,43,0.12)',
        border: '1px solid rgba(255,107,43,0.40)',
        borderRadius: 9999,
        padding: '4px 14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '0.08em',
        color: '#FF6B2B',
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isPlaying ? '#FF6B2B' : '#FFAA44',
          display: 'inline-block',
          boxShadow: isPlaying ? '0 0 8px #FF6B2B' : '0 0 8px #FFAA44',
        }}
        className={isPlaying ? 'animate-pulse-dot' : ''}
      />
      {isPlaying ? '● AO VIVO' : '◌ OFF AIR'}
    </div>
  );
}
