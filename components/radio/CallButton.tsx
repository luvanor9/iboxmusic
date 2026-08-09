'use client';

import { useState, useRef, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function CallButton() {
  const [state, setState]   = useState<'idle' | 'waiting' | 'connected' | 'ended'>('idle');
  const [name, setName]     = useState('');
  const [showForm, setShow] = useState(false);
  const [error, setError]   = useState('');
  const pcRef       = useRef<RTCPeerConnection | null>(null);
  const callerIdRef = useRef<string>('');
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const localAudRef = useRef<HTMLAudioElement | null>(null);

  const startCall = useCallback(async () => {
    if (!name.trim()) { setError('Informe seu nome.'); return; }
    setError('');

    const callerId = `caller-${Date.now()}`;
    callerIdRef.current = callerId;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {
      setError('Microfone bloqueado. Permita o acesso e tente novamente.');
      return;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    // Receive DJ audio
    pc.ontrack = (e) => {
      if (localAudRef.current) {
        localAudRef.current.srcObject = e.streams[0];
        localAudRef.current.play().catch(() => {});
      }
    };

    // Send ICE candidates
    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        await fetch('/api/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room: callerId, type: 'ice', payload: e.candidate, from: 'caller' }),
        });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Post offer + caller info to lobby for DJ to see
    await fetch('/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room: 'lobby', type: 'offer',
        payload: { callerId, callerName: name.trim() },
        from: 'caller',
      }),
    });
    // Post offer to caller's own room
    await fetch('/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: callerId, type: 'offer', payload: offer, from: 'caller' }),
    });

    setState('waiting');
    setShow(false);

    // Poll for answer
    let since = 0;
    pollRef.current = setInterval(async () => {
      const res  = await fetch(`/api/signal?room=${callerId}&from=caller&since=${since}`);
      const sigs = await res.json() as Array<{ type: string; payload: RTCSessionDescriptionInit | RTCIceCandidateInit; timestamp: number }>;
      if (!sigs.length) return;
      since = Math.max(...sigs.map(s => s.timestamp));

      for (const sig of sigs) {
        if (sig.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(sig.payload as RTCSessionDescriptionInit));
          setState('connected');
        }
        if (sig.type === 'ice') {
          pc.addIceCandidate(new RTCIceCandidate(sig.payload as RTCIceCandidateInit)).catch(() => {});
        }
      }
    }, 1500);
  }, [name]);

  const endCall = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pcRef.current?.close();
    pcRef.current = null;
    if (localAudRef.current) localAudRef.current.srcObject = null;
    setState('ended');
  }, []);

  return (
    <>
      <audio ref={localAudRef} autoPlay style={{ display: 'none' }} />

      {state === 'idle' && !showForm && (
        <button
          onClick={() => setShow(true)}
          style={{
            padding: '12px 28px', borderRadius: 9999,
            border: '1px solid rgba(55,240,194,0.4)',
            background: 'rgba(255,170,68,0.08)', color: '#FFAA44',
            fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 14, cursor: 'pointer', letterSpacing: '0.04em',
            transition: 'all 0.15s',
          }}
        >
          📞 Ligar para a Rádio ao Vivo
        </button>
      )}

      {showForm && state === 'idle' && (
        <div style={{
          background: '#1E2023', border: '1px solid rgba(255,170,68,0.25)',
          borderRadius: 16, padding: '20px', width: '100%', maxWidth: 320,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#F2EDE8', margin: '0 0 12px' }}>
            📞 Entrar ao Vivo na Rádio
          </p>
          <input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={40}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#111214', border: '1px solid rgba(255,107,43,0.15)',
              borderRadius: 10, padding: '10px 14px', color: '#F2EDE8',
              fontSize: 14, marginBottom: 10, outline: 'none',
            }}
          />
          {error && <p style={{ color: '#ff6b6b', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', margin: '0 0 8px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={startCall}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 9999, border: 'none',
                background: '#FF6B2B', color: '#111214', fontWeight: 700,
                fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, cursor: 'pointer',
              }}
            >
              LIGAR
            </button>
            <button
              onClick={() => setShow(false)}
              style={{
                padding: '10px 16px', borderRadius: 9999,
                border: '1px solid rgba(255,107,43,0.20)',
                background: 'transparent', color: '#9A8F88',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 12, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {state === 'waiting' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,170,68,0.08)', border: '1px solid rgba(255,170,68,0.25)',
          borderRadius: 9999, padding: '10px 20px',
        }}>
          <span className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFAA44', boxShadow: '0 0 6px #FFAA44', display: 'inline-block' }} />
          <span style={{ fontSize: 13, color: '#FFAA44', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>
            AGUARDANDO O DJ ATENDER...
          </span>
          <button onClick={endCall} style={{ background: 'none', border: 'none', color: '#5C5450', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
      )}

      {state === 'connected' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,107,43,0.08)', border: '1px solid rgba(255,107,43,0.40)',
            borderRadius: 9999, padding: '10px 20px',
          }}>
            <span className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF6B2B', boxShadow: '0 0 6px #FF6B2B', display: 'inline-block' }} />
            <span style={{ fontSize: 13, color: '#FF6B2B', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.06em' }}>
              ● VOCÊ ESTÁ AO VIVO!
            </span>
          </div>
          <button
            onClick={endCall}
            style={{
              padding: '10px 20px', borderRadius: 9999,
              border: '1px solid rgba(255,100,100,0.4)',
              background: 'rgba(255,60,60,0.08)', color: '#ff6b6b',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📴 Desligar
          </button>
        </div>
      )}

      {state === 'ended' && (
        <p style={{ fontSize: 13, color: '#5C5450', fontFamily: 'JetBrains Mono, monospace' }}>
          Ligação encerrada. Obrigado por participar! 🎶
        </p>
      )}
    </>
  );
}
