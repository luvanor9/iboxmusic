'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ChatMessage } from '@/app/api/chat/route';

const POLL_INTERVAL = 8000;

export function ChatSection() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [song, setSong] = useState('');
  const [type, setType] = useState<'chat' | 'request'>('chat');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        setMessages(data);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !msg.trim()) {
      setError('Preencha seu nome e mensagem.');
      return;
    }
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message: msg, type, song }),
      });
      if (res.ok) {
        setMsg('');
        setSong('');
        await fetchMessages();
      } else {
        const d = await res.json();
        setError(d.error || 'Erro ao enviar.');
      }
    } catch {
      setError('Erro de conexão.');
    }
    setSending(false);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <p style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.12em',
          color: '#FF6B2B',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>Interaja</p>
        <h2 style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#F2EDE8',
          letterSpacing: '-0.02em',
          margin: 0,
        }}>Chat & Pedidos</h2>
      </div>

      <div style={{
        background: '#1E2023',
        border: '1px solid rgba(255,107,43,0.15)',
        borderRadius: 20,
        overflow: 'hidden',
      }}>
        {/* Messages list */}
        <div
          ref={listRef}
          style={{
            height: 320,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {messages.length === 0 && (
            <p style={{
              color: '#5C5450',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              textAlign: 'center',
              marginTop: 'auto',
              marginBottom: 'auto',
            }}>
              Seja o primeiro a mandar uma mensagem! 🎶
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: m.type === 'request' ? '#FFAA44' : '#FF6B2B',
                }}>
                  {m.name}
                </span>
                {m.type === 'request' && (
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    background: 'rgba(255,170,68,0.12)',
                    border: '1px solid rgba(255,170,68,0.30)',
                    color: '#FFAA44',
                    padding: '1px 6px',
                    borderRadius: 9999,
                    letterSpacing: '0.06em',
                  }}>
                    PEDIDO
                  </span>
                )}
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  color: '#5C5450',
                  marginLeft: 'auto',
                }}>
                  {formatTime(m.timestamp)}
                </span>
              </div>
              <p style={{
                fontSize: 14,
                color: '#9A8F88',
                margin: 0,
                lineHeight: 1.4,
              }}>
                {m.message}
              </p>
              {m.song && (
                <p style={{
                  fontSize: 12,
                  color: '#FFAA44',
                  fontFamily: 'JetBrains Mono, monospace',
                  margin: 0,
                }}>
                  🎵 {m.song}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,107,43,0.10)' }} />

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 16 }}>
          {/* Type toggle */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 12,
          }}>
            {(['chat', 'request'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 9999,
                  border: '1px solid',
                  borderColor: type === t ? '#FF6B2B' : 'rgba(255,107,43,0.20)',
                  background: type === t ? '#FF6B2B' : 'transparent',
                  color: type === t ? '#111214' : '#9A8F88',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'chat' ? '💬 CHAT' : '🎵 PEDIR MÚSICA'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={40}
              style={inputStyle}
            />
            {type === 'request' && (
              <input
                type="text"
                placeholder="Nome da música e artista"
                value={song}
                onChange={e => setSong(e.target.value)}
                maxLength={100}
                style={inputStyle}
              />
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder={type === 'chat' ? 'Sua mensagem...' : 'Mensagem (opcional)'}
                value={msg}
                onChange={e => setMsg(e.target.value)}
                maxLength={200}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="submit"
                disabled={sending}
                style={{
                  padding: '0 20px',
                  borderRadius: 9999,
                  border: 'none',
                  background: '#FF6B2B',
                  color: '#111214',
                  fontWeight: 700,
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 14,
                  cursor: sending ? 'wait' : 'pointer',
                  boxShadow: '0 0 16px rgba(255,107,43,0.40)',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                {sending ? '...' : 'ENVIAR'}
              </button>
            </div>
          </div>

          {error && (
            <p style={{
              fontSize: 12,
              color: '#ff6b6b',
              fontFamily: 'JetBrains Mono, monospace',
              marginTop: 6,
              marginBottom: 0,
            }}>
              ⚠ {error}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#111214',
  border: '1px solid rgba(255,107,43,0.15)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#F2EDE8',
  fontSize: 14,
  fontFamily: 'Space Grotesk, sans-serif',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};
