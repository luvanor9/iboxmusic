'use client';

const TICKER_ITEMS = [
  '🎵 IBOX MUSIC — Sua rádio ao vivo',
  '🔥 Acesse pelo celular e instale nosso app',
  '📲 Disponível para Android e iPhone',
  '🎤 Pedidos de música pelo chat',
  '🌍 Transmitindo ao vivo para o mundo inteiro',
  '⚡ Qualidade de som HD — sem interrupções',
  '🎶 Siga nas redes sociais: @iboxmusic',
  '📻 24h no ar — todos os dias',
];

export function Ticker() {
  const text = [...TICKER_ITEMS, ...TICKER_ITEMS].join('   ·   ');

  return (
    <div
      className="ticker-wrap"
      style={{
        background: 'rgba(255,107,43,0.06)',
        borderTop: '1px solid rgba(255,107,43,0.15)',
        borderBottom: '1px solid rgba(255,107,43,0.15)',
        overflow: 'hidden',
        padding: '10px 0',
        position: 'relative',
      }}
    >
      <div
        className="animate-ticker"
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
          color: '#9A8F88',
          letterSpacing: '0.04em',
        }}
      >
        <span style={{ marginRight: 80 }}>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}
