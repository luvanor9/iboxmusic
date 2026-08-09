'use client';

interface EqualizerProps {
  active: boolean;
  size?: 'sm' | 'md';
}

export function Equalizer({ active, size = 'md' }: EqualizerProps) {
  const height = size === 'sm' ? 16 : 24;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 2,
        height,
      }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={active ? 'eq-bar' : ''}
          style={{
            width: size === 'sm' ? 2 : 3,
            height: active ? undefined : (size === 'sm' ? 4 : 6),
            background: '#FF6B2B',
            borderRadius: 2,
            animationDelay: `${(i - 1) * 0.15}s`,
            transition: 'height 0.3s',
          }}
        />
      ))}
    </div>
  );
}
