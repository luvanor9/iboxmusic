'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ScheduleItem } from '@/lib/radio-config';
import { SCHEDULE as DEFAULT_SCHEDULE } from '@/lib/radio-config';
import { usePlayer } from '@/components/radio/PlayerContext';

/* ── Types ──────────────────────────────────────────────────── */
interface CallerInfo { id: string; name: string; status: 'waiting' | 'connected' | 'ended'; }

const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };
const DAYS = ['Seg – Sex', 'Sáb', 'Dom'];
const POLL_MS = 1500;

/* ── Style helpers ─────────────────────────────────────────── */
const C = { bg: '#111214', surface: '#18191C', card: '#1E2023', orange: '#FF6B2B', amber: '#FFAA44', text: '#F2EDE8', muted: '#9A8F88', quiet: '#5C5450', dim: '#3A3330' };
function inp(x?: React.CSSProperties): React.CSSProperties {
  return { background: C.bg, border: `1px solid rgba(255,107,43,0.15)`, borderRadius: 10, padding: '9px 13px', color: C.text, fontSize: 13, fontFamily: 'Space Grotesk, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', ...x };
}
function tabBtn(active: boolean): React.CSSProperties {
  return { padding: '7px 18px', borderRadius: 9999, border: '1px solid', borderColor: active ? C.orange : 'rgba(255,107,43,0.20)', background: active ? C.orange : 'transparent', color: active ? C.bg : C.muted, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.15s' };
}
function iconBtn(disabled?: boolean): React.CSSProperties {
  return { background: 'none', border: 'none', color: disabled ? C.dim : C.muted, cursor: disabled ? 'default' : 'pointer', fontSize: 20, padding: 4 };
}
function fmt(s: number) { if (!isFinite(s) || s === 0) return '0:00'; const m = Math.floor(s / 60), sc = Math.floor(s % 60); return `${m}:${sc.toString().padStart(2, '0')}`; }

/* ════════════════════════════════════════════════════════════ */
export default function StudioPage() {

  /* ── Shared global player ── */
  const player = usePlayer();
  const musicFileRef = useRef<HTMLInputElement | null>(null);
  const jingleFileRef = useRef<HTMLInputElement | null>(null);

  /* ── mic ── */
  const [micOn, setMicOn] = useState(false);
  const [micVol, setMicVol] = useState(0);
  const [muted, setMuted] = useState(false);
  const [onAir, setOnAir] = useState(false);
  const [micErr, setMicErr] = useState('');
  const micStreamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);

  /* ── callers ── */
  const [callers, setCallers] = useState<CallerInfo[]>([]);
  const [activeCall, setActive] = useState<string | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudRef = useRef<HTMLAudioElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sinceRef = useRef<number>(0);

  /* ── schedule ── */
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [schedDay, setSchedDay] = useState('Seg – Sex');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<ScheduleItem | null>(null);
  const [schedSaved, setSchedSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'mic' | 'music' | 'schedule' | 'calls'>('mic');

  /* ── Load schedule ── */
  useEffect(() => {
    fetch('/api/schedule').then(r => r.json())
      .then((d: ScheduleItem[]) => setSchedule(Array.isArray(d) ? d : DEFAULT_SCHEDULE))
      .catch(() => setSchedule(DEFAULT_SCHEDULE));
  }, []);

  /* ── VU meter ── */
  const startVU = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser(); an.fftSize = 256;
    src.connect(an);
    const data = new Uint8Array(an.frequencyBinCount);
    const tick = () => { an.getByteFrequencyData(data); setMicVol(Math.min(100, data.reduce((a, b) => a + b, 0) / data.length * 2)); animRef.current = requestAnimationFrame(tick); };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  /* ── Mic ── */
  const startMic = useCallback(async () => {
    setMicErr('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = s; startVU(s); setMicOn(true); setOnAir(true);
    } catch { setMicErr('Microfone bloqueado. Permita o acesso nas configurações do navegador.'); }
  }, [startVU]);

  const stopMic = useCallback(() => {
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null; cancelAnimationFrame(animRef.current);
    setMicOn(false); setOnAir(false); setMicVol(0);
  }, []);

  /* ── Callers poll ── */
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/signal?room=lobby&from=studio&since=${sinceRef.current}`);
        const sigs = await res.json() as Array<{ type: string; payload: { callerId: string; callerName: string }; timestamp: number }>;
        if (!sigs.length) return;
        sinceRef.current = Math.max(...sigs.map(s => s.timestamp));
        sigs.forEach(sig => {
          if (sig.type === 'offer' && sig.payload?.callerId) {
            const { callerId, callerName } = sig.payload;
            setCallers(prev => prev.find(c => c.id === callerId) ? prev : [...prev, { id: callerId, name: callerName || 'Ouvinte', status: 'waiting' }]);
          }
        });
      } catch { /* silent */ }
    };
    pollRef.current = setInterval(poll, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const answerCaller = useCallback(async (caller: CallerInfo) => {
    const roomId = caller.id;
    const pc = new RTCPeerConnection(ICE);
    pcsRef.current.set(roomId, pc);
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => pc.addTrack(t, micStreamRef.current!));
    pc.ontrack = e => { if (remoteAudRef.current) { remoteAudRef.current.srcObject = e.streams[0]; remoteAudRef.current.play().catch(() => {}); } };
    pc.onicecandidate = async e => { if (e.candidate) await fetch('/api/signal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: roomId, type: 'ice', payload: e.candidate, from: 'studio' }) }); };
    const res = await fetch(`/api/signal?room=${roomId}&from=studio&since=0`);
    const sigs = await res.json() as Array<{ type: string; payload: RTCSessionDescriptionInit | RTCIceCandidateInit }>;
    const offer = sigs.find(s => s.type === 'offer'); if (!offer) return;
    await pc.setRemoteDescription(new RTCSessionDescription(offer.payload as RTCSessionDescriptionInit));
    const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
    await fetch('/api/signal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: roomId, type: 'answer', payload: answer, from: 'studio' }) });
    sigs.filter(s => s.type === 'ice').forEach(s => pc.addIceCandidate(new RTCIceCandidate(s.payload as RTCIceCandidateInit)).catch(() => {}));
    setCallers(prev => prev.map(c => c.id === roomId ? { ...c, status: 'connected' } : c)); setActive(roomId);
  }, []);

  const hangUp = useCallback((roomId: string) => {
    pcsRef.current.get(roomId)?.close(); pcsRef.current.delete(roomId);
    if (remoteAudRef.current) remoteAudRef.current.srcObject = null;
    setCallers(prev => prev.map(c => c.id === roomId ? { ...c, status: 'ended' } : c)); setActive(null);
    fetch(`/api/signal?room=${roomId}`, { method: 'DELETE' }).catch(() => {});
  }, []);

  /* ── Schedule helpers ── */
  const filteredSched = schedule.filter(s => s.day === schedDay);
  const startEdit = (gi: number) => { setEditIdx(gi); setEditItem({ ...schedule[gi] }); };
  const saveEdit = () => { if (!editItem || editIdx === null) return; setSchedule(schedule.map((s, i) => i === editIdx ? editItem : s)); setEditIdx(null); setEditItem(null); };
  const deleteItem = (gi: number) => setSchedule(schedule.filter((_, i) => i !== gi));
  const addNew = () => {
    const n: ScheduleItem = { day: schedDay, time: '08:00', show: 'Novo Programa', host: 'Apresentador', genre: 'Gospel' };
    const ins = schedule.reduce((l, s, i) => s.day === schedDay ? i : l, -1);
    const upd = [...schedule]; upd.splice(ins + 1, 0, n);
    setSchedule(upd); setTimeout(() => startEdit(ins + 1), 50);
  };
  const saveSchedule = async () => {
    try { await fetch('/api/schedule', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(schedule) }); setSchedSaved(true); setTimeout(() => setSchedSaved(false), 2500); } catch { /* silent */ }
  };

  /* ── Tabs ── */
  const tabs = [
    { id: 'mic' as const, label: 'Microfone', icon: '🎙' },
    { id: 'music' as const, label: 'Músicas + Vinhetas', icon: '🎵' },
    { id: 'schedule' as const, label: 'Programação', icon: '📅' },
    { id: 'calls' as const, label: `Ligações${callers.filter(c => c.status === 'waiting').length ? ` (${callers.filter(c => c.status === 'waiting').length})` : ''}`, icon: '📞' },
  ];

  /* ════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'Space Grotesk, sans-serif', paddingBottom: player.playlist.length > 0 ? 72 : 0 }}>
      <audio ref={remoteAudRef} autoPlay style={{ display: 'none' }} />

      {/* Navbar */}
      <nav style={{ height: 56, background: 'rgba(17,18,20,0.96)', borderBottom: '1px solid rgba(255,107,43,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ color: C.quiet, textDecoration: 'none', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>← Voltar</a>
          <span style={{ color: '#2A2825' }}>|</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>IBOX <span style={{ color: C.orange }}>MUSIC</span></span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.quiet, letterSpacing: '0.06em' }}>· ESTÚDIO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {player.playing && (
            <div style={{ background: 'rgba(255,107,43,0.08)', border: '1px solid rgba(255,107,43,0.30)', borderRadius: 9999, padding: '4px 12px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: C.orange, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: C.orange, display: 'inline-block' }} />
              TOCANDO
            </div>
          )}
          {onAir && (
            <div style={{ background: 'rgba(255,107,43,0.12)', border: '1px solid rgba(255,107,43,0.40)', borderRadius: 9999, padding: '4px 14px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: C.orange, fontWeight: 700, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: C.orange, boxShadow: `0 0 8px ${C.orange}`, display: 'inline-block' }} />
              NO AR
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {tabs.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabBtn(activeTab === t.id)}>{t.icon} {t.label}</button>)}
        </div>

        {/* ═══ MIC ════════════════════════════════════════════ */}
        {activeTab === 'mic' && (
          <div style={{ background: C.card, border: `1px solid rgba(255,107,43,0.18)`, borderRadius: 20, padding: '32px', boxShadow: onAir ? '0 0 40px rgba(255,107,43,0.10)' : 'none', transition: 'box-shadow 0.4s' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.12em', color: C.orange, textTransform: 'uppercase', marginBottom: 8 }}>Transmissão ao Vivo</p>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 28px' }}>Microfone 🎙</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', marginBottom: 28 }}>
              <button onClick={micOn ? stopMic : startMic} style={{ width: 96, height: 96, borderRadius: '50%', border: '2px solid', borderColor: micOn ? C.orange : 'rgba(255,107,43,0.30)', background: micOn ? 'rgba(255,107,43,0.10)' : C.surface, cursor: 'pointer', fontSize: 36, boxShadow: micOn ? '0 0 28px rgba(255,107,43,0.30)' : 'none', transition: 'all 0.2s' }}>
                {micOn ? '🎙' : '🎤'}
              </button>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: micOn ? C.orange : C.quiet, margin: '0 0 6px' }}>{micOn ? (muted ? '🔇 MICROFONE MUDO' : '● TRANSMITINDO AO VIVO') : 'MICROFONE DESLIGADO'}</p>
                <p style={{ fontSize: 13, color: C.muted, margin: '0 0 14px', fontFamily: 'JetBrains Mono, monospace' }}>{micOn ? 'Sua voz está sendo transmitida' : 'Clique no ícone para entrar ao vivo'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: C.quiet, minWidth: 30 }}>MIC</span>
                  <div style={{ flex: 1, height: 8, background: C.surface, borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,107,43,0.10)' }}>
                    <div style={{ height: '100%', borderRadius: 4, transition: 'width 0.05s', width: `${micVol}%`, background: micVol > 80 ? '#ff4444' : C.orange }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: C.quiet, minWidth: 36 }}>{Math.round(micVol)}%</span>
                </div>
              </div>
            </div>
            {micOn && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => { micStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted; }); setMuted(m => !m); }} style={{ padding: '10px 20px', borderRadius: 9999, border: '1px solid', borderColor: muted ? '#ff6b6b' : 'rgba(255,107,43,0.30)', background: 'transparent', color: muted ? '#ff6b6b' : C.muted, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {muted ? '🔇 MUDO ATIVO' : '🔇 MUTAR'}
                </button>
                <button onClick={stopMic} style={{ padding: '10px 20px', borderRadius: 9999, border: '1px solid rgba(255,100,100,0.40)', background: 'rgba(255,60,60,0.08)', color: '#ff6b6b', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>⏹ ENCERRAR</button>
              </div>
            )}
            {micErr && <p style={{ color: '#ff6b6b', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, marginTop: 14 }}>⚠ {micErr}</p>}
          </div>
        )}

        {/* ═══ MÚSICAS + VINHETAS ════════════════════════════ */}
        {activeTab === 'music' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── PLAYER DE MÚSICAS ── */}
            <div style={{ background: C.card, border: `1px solid rgba(255,107,43,0.18)`, borderRadius: 20, padding: '28px 32px' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.12em', color: C.orange, textTransform: 'uppercase', marginBottom: 4 }}>Fila Principal</p>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px' }}>🎵 Músicas</h2>

              {/* Notice: music keeps playing when navigating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,43,0.05)', border: '1px solid rgba(255,107,43,0.15)', borderRadius: 10, padding: '8px 14px', marginBottom: 16 }}>
                <span style={{ fontSize: 15 }}>💡</span>
                <p style={{ margin: 0, fontSize: 12, color: C.muted, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.5 }}>
                  A música <strong style={{ color: C.text }}>continua tocando</strong> mesmo que você saia do Estúdio ou navegue para outra página — o player fica na barra inferior.
                </p>
              </div>

              {/* Now playing */}
              {player.playlist.length === 0 ? (
                /* ── Estado vazio — instrução clara ── */
                <div style={{ background: 'rgba(255,107,43,0.04)', border: '2px dashed rgba(255,107,43,0.20)', borderRadius: 14, padding: '28px 20px', marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🎵</div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
                    Nenhuma música carregada ainda
                  </p>
                  <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px', lineHeight: 1.6, fontFamily: 'JetBrains Mono, monospace' }}>
                    Clique no botão abaixo para escolher<br />
                    músicas MP3, WAV ou OGG do seu computador
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>👇</span>
                    <span style={{ fontSize: 13, color: C.orange, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.06em' }}>USE O BOTÃO ABAIXO</span>
                    <span style={{ fontSize: 20 }}>👇</span>
                  </div>
                </div>
              ) : (
                /* ── Player ativo ── */
                <div style={{ background: C.surface, borderRadius: 14, padding: '16px 20px', marginBottom: 16, border: '1px solid rgba(255,107,43,0.10)' }}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.1em', color: C.quiet, margin: '0 0 4px', textTransform: 'uppercase' }}>Tocando agora</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: player.nowIdx !== null ? C.text : C.muted, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {player.nowIdx !== null
                      ? <><span style={{ background: 'rgba(255,107,43,0.12)', border: '1px solid rgba(255,107,43,0.30)', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: C.orange, fontWeight: 700, letterSpacing: '0.08em' }}>{player.playing ? '▶ TOCANDO' : '⏸ PAUSADO'}</span>{player.playlist[player.nowIdx]?.name}</>
                      : <span style={{ color: C.quiet, fontSize: 13 }}>Selecione uma música na lista abaixo ▼</span>
                    }
                    {player.volume < 1 && player.nowIdx !== null && (
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.amber, background: 'rgba(255,170,68,0.10)', border: '1px solid rgba(255,170,68,0.30)', borderRadius: 6, padding: '2px 8px' }}>⬇ VOLUME REDUZIDO — VINHETA TOCANDO</span>
                    )}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.quiet, minWidth: 36 }}>{fmt(player.progress)}</span>
                    <div style={{ flex: 1, height: 5, background: 'rgba(255,107,43,0.10)', borderRadius: 3, cursor: player.nowIdx !== null ? 'pointer' : 'default' }}
                      onClick={e => { const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); player.seek((e.clientX - r.left) / r.width); }}>
                      <div style={{ height: '100%', borderRadius: 3, background: C.orange, width: player.duration ? `${(player.progress / player.duration) * 100}%` : '0%', transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.quiet, minWidth: 36, textAlign: 'right' }}>{fmt(player.duration)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button onClick={player.prevTrack} disabled={player.nowIdx === null || player.nowIdx === 0} style={iconBtn(player.nowIdx === null || player.nowIdx === 0)}>⏮</button>
                    <button onClick={player.togglePlay} disabled={player.nowIdx === null} style={{ width: 46, height: 46, borderRadius: '50%', border: 'none', background: player.nowIdx !== null ? C.orange : C.surface, color: player.nowIdx !== null ? C.bg : C.dim, cursor: player.nowIdx !== null ? 'pointer' : 'default', fontSize: 18, boxShadow: player.nowIdx !== null ? `0 0 16px rgba(255,107,43,0.40)` : 'none' }}>
                      {player.playing ? '⏸' : '▶'}
                    </button>
                    <button onClick={player.nextTrack} disabled={player.nowIdx === null || player.nowIdx >= player.playlist.length - 1} style={iconBtn(player.nowIdx === null || player.nowIdx >= player.playlist.length - 1)}>⏭</button>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.quiet, marginLeft: 4 }}>{player.playlist.length} músicas na lista</span>
                  </div>
                </div>
              )}

              {/* Add music button */}
              <input ref={musicFileRef} type="file" accept="audio/*" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files) player.addTracks(e.target.files, 'music'); }} />
              <button onClick={() => musicFileRef.current?.click()} style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: '2px dashed rgba(255,107,43,0.25)', background: 'transparent', color: C.muted, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, letterSpacing: '0.05em', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget).style.borderColor = 'rgba(255,107,43,0.50)'; (e.currentTarget).style.color = C.orange; }}
                onMouseLeave={e => { (e.currentTarget).style.borderColor = 'rgba(255,107,43,0.25)'; (e.currentTarget).style.color = C.muted; }}>
                + ADICIONAR MÚSICAS DO COMPUTADOR (MP3, WAV, OGG...)
              </button>

              {/* Playlist */}
              {player.playlist.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.10em', color: C.quiet, textTransform: 'uppercase', marginBottom: 10 }}>LISTA DE REPRODUÇÃO</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {player.playlist.map((track, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderRadius: 10, background: i === player.nowIdx ? 'rgba(255,107,43,0.07)' : 'transparent', border: '1px solid', borderColor: i === player.nowIdx ? 'rgba(255,107,43,0.25)' : 'transparent', transition: 'all 0.15s' }}>
                        <button onClick={() => player.playTrack(i)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: i === player.nowIdx ? C.orange : 'rgba(255,107,43,0.10)', color: i === player.nowIdx ? C.bg : C.muted, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>
                          {i === player.nowIdx && player.playing ? '⏸' : '▶'}
                        </button>
                        <span style={{ flex: 1, fontSize: 13, color: i === player.nowIdx ? C.text : C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.name}</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.dim, flexShrink: 0 }}>#{i + 1}</span>
                        <button onClick={() => player.removeTrack(i, 'music')} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 15, padding: '0 4px', flexShrink: 0 }} title="Remover">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── PLAYER DE VINHETAS ── */}
            <div style={{ background: C.card, border: `1px solid rgba(255,170,68,0.25)`, borderRadius: 20, padding: '28px 32px', boxShadow: player.jinglePlaying ? '0 0 24px rgba(255,170,68,0.12)' : 'none', transition: 'box-shadow 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                <div>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.12em', color: C.amber, textTransform: 'uppercase', marginBottom: 4 }}>Linha Separada</p>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🎬 Vinhetas & Jingles</h2>
                </div>
                {player.jinglePlaying && (
                  <div style={{ background: 'rgba(255,170,68,0.12)', border: '1px solid rgba(255,170,68,0.40)', borderRadius: 9999, padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.amber, fontWeight: 700 }}>
                    <span className="animate-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: C.amber, boxShadow: `0 0 6px ${C.amber}`, display: 'inline-block' }} />
                    VINHETA AO AR
                  </div>
                )}
              </div>

              <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px', lineHeight: 1.5 }}>
                Clique em uma vinheta para tocar. A música em reprodução <strong style={{ color: C.text }}>não é interrompida</strong> — o volume dela reduz automaticamente durante a vinheta e volta ao normal ao terminar.
              </p>

              {/* Jingle now playing */}
              {player.jinglePlaying && player.jingleIdx !== null && (
                <div style={{ background: 'rgba(255,170,68,0.07)', border: '1px solid rgba(255,170,68,0.25)', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.amber, letterSpacing: '0.10em', textTransform: 'uppercase', margin: '0 0 4px' }}>Tocando agora</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 10px' }}>{player.jingles[player.jingleIdx]?.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.quiet, minWidth: 36 }}>{fmt(player.jingleProgress)}</span>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,170,68,0.15)', borderRadius: 3 }}>
                      <div style={{ height: '100%', borderRadius: 3, background: C.amber, width: player.jingleDuration ? `${(player.jingleProgress / player.jingleDuration) * 100}%` : '0%', transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.quiet, minWidth: 36, textAlign: 'right' }}>{fmt(player.jingleDuration)}</span>
                  </div>
                  <button onClick={player.stopJingle} style={{ padding: '7px 18px', borderRadius: 9999, border: '1px solid rgba(255,100,100,0.35)', background: 'rgba(255,60,60,0.07)', color: '#ff6b6b', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>⏹ PARAR VINHETA</button>
                </div>
              )}

              {/* Add jingle button */}
              <input ref={jingleFileRef} type="file" accept="audio/*" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files) player.addTracks(e.target.files, 'jingle'); }} />
              <button onClick={() => jingleFileRef.current?.click()} style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: '2px dashed rgba(255,170,68,0.30)', background: 'transparent', color: C.muted, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, letterSpacing: '0.05em', transition: 'all 0.15s', marginBottom: player.jingles.length > 0 ? 16 : 0 }}
                onMouseEnter={e => { (e.currentTarget).style.borderColor = 'rgba(255,170,68,0.60)'; (e.currentTarget).style.color = C.amber; }}
                onMouseLeave={e => { (e.currentTarget).style.borderColor = 'rgba(255,170,68,0.30)'; (e.currentTarget).style.color = C.muted; }}>
                + ADICIONAR VINHETAS / JINGLES DO COMPUTADOR (MP3, WAV, OGG...)
              </button>

              {/* Jingles list */}
              {player.jingles.length > 0 && (
                <div>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.10em', color: C.quiet, textTransform: 'uppercase', marginBottom: 10 }}>VINHETAS CARREGADAS — CLIQUE PARA DISPARAR</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {player.jingles.map((j, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 12, background: i === player.jingleIdx ? 'rgba(255,170,68,0.08)' : C.surface, border: '1px solid', borderColor: i === player.jingleIdx ? 'rgba(255,170,68,0.40)' : 'rgba(255,107,43,0.08)', transition: 'all 0.15s' }}>
                        <button
                          onClick={() => { if (i === player.jingleIdx && player.jinglePlaying) { player.stopJingle(); } else { player.fireJingle(i); } }}
                          title={i === player.jingleIdx && player.jinglePlaying ? 'Parar' : 'Disparar vinheta'}
                          style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: i === player.jingleIdx && player.jinglePlaying ? C.amber : 'rgba(255,170,68,0.15)', color: i === player.jingleIdx && player.jinglePlaying ? C.bg : C.amber, cursor: 'pointer', fontSize: 14, flexShrink: 0, fontWeight: 700, boxShadow: i === player.jingleIdx && player.jinglePlaying ? `0 0 10px rgba(255,170,68,0.50)` : 'none' }}>
                          {i === player.jingleIdx && player.jinglePlaying ? '⏸' : '▶'}
                        </button>
                        <span style={{ fontSize: 26, flexShrink: 0 }}>🎬</span>
                        <span style={{ flex: 1, fontSize: 13, color: i === player.jingleIdx ? C.text : C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: i === player.jingleIdx ? 600 : 400 }}>{j.name}</span>
                        {i === player.jingleIdx && player.jinglePlaying && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.amber, letterSpacing: '0.08em', flexShrink: 0 }}>AO AR</span>}
                        <button onClick={() => player.removeTrack(i, 'jingle')} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 15, padding: '0 4px', flexShrink: 0 }} title="Remover">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {player.jingles.length === 0 && (
                <p style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.dim, marginTop: 12 }}>
                  Nenhuma vinheta carregada. Adicione arquivos de áudio acima.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ═══ PROGRAMAÇÃO ═══════════════════════════════════ */}
        {activeTab === 'schedule' && (
          <div style={{ background: C.card, border: `1px solid rgba(255,107,43,0.15)`, borderRadius: 20, padding: '28px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.12em', color: C.orange, textTransform: 'uppercase', margin: 0, marginBottom: 4 }}>Gestão</p>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Editar Programação 📅</h2>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {schedSaved && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#4ade80', letterSpacing: '0.06em' }}>✓ Salvo!</span>}
                <button onClick={addNew} style={{ padding: '8px 16px', borderRadius: 9999, border: '1px solid rgba(255,107,43,0.30)', background: 'transparent', color: C.orange, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>+ ADICIONAR</button>
                <button onClick={saveSchedule} style={{ padding: '8px 16px', borderRadius: 9999, border: 'none', background: C.orange, color: C.bg, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>💾 SALVAR</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {DAYS.map(d => <button key={d} onClick={() => setSchedDay(d)} style={tabBtn(schedDay === d)}>{d}</button>)}
            </div>

            {editItem && editIdx !== null && (
              <div style={{ background: 'rgba(255,107,43,0.05)', border: '1px solid rgba(255,107,43,0.30)', borderRadius: 14, padding: '20px', marginBottom: 16 }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.orange, letterSpacing: '0.08em', marginBottom: 14, textTransform: 'uppercase' }}>Editando programa</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  {([['Dia', 'day', 'select'], ['Horário', 'time', 'time'], ['Nome do Programa', 'show', 'text'], ['Apresentador / DJ', 'host', 'text'], ['Estilo Musical', 'genre', 'text']] as [string, keyof ScheduleItem, string][]).map(([label, field, type]) => (
                    <div key={field}>
                      <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: C.quiet, margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
                      {type === 'select'
                        ? <select value={editItem[field]} onChange={e => setEditItem({ ...editItem, [field]: e.target.value })} style={{ ...inp(), appearance: 'none' }}>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                        : <input type={type} value={editItem[field]} onChange={e => setEditItem({ ...editItem, [field]: e.target.value })} style={inp()} />}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button onClick={saveEdit} style={{ padding: '8px 20px', borderRadius: 9999, border: 'none', background: C.orange, color: C.bg, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ CONFIRMAR</button>
                  <button onClick={() => { setEditIdx(null); setEditItem(null); }} style={{ padding: '8px 20px', borderRadius: 9999, border: '1px solid rgba(255,107,43,0.20)', background: 'transparent', color: C.muted, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredSched.length === 0 && <p style={{ textAlign: 'center', color: C.quiet, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, padding: '28px 0' }}>Nenhum programa para este dia. Clique em + ADICIONAR.</p>}
              {filteredSched.map(item => {
                const gi = schedule.indexOf(item);
                return (
                  <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: C.surface, border: '1px solid rgba(255,107,43,0.08)', borderRadius: 12 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: C.orange, minWidth: 50, flexShrink: 0 }}>{item.time}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: 0 }}>{item.show}</p>
                      <p style={{ fontSize: 12, color: C.quiet, fontFamily: 'JetBrains Mono, monospace', margin: '2px 0 0' }}>{item.host} · {item.genre}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => startEdit(gi)} style={{ padding: '6px 14px', borderRadius: 9999, border: '1px solid rgba(255,107,43,0.25)', background: 'transparent', color: C.orange, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>EDITAR</button>
                      <button onClick={() => deleteItem(gi)} style={{ padding: '6px 10px', borderRadius: 9999, border: '1px solid rgba(255,100,100,0.20)', background: 'transparent', color: '#ff6b6b', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.dim, marginTop: 16, lineHeight: 1.5 }}>ⓘ Clique em SALVAR para que as alterações apareçam na página principal.</p>
          </div>
        )}

        {/* ═══ LIGAÇÕES ══════════════════════════════════════ */}
        {activeTab === 'calls' && (
          <div style={{ background: C.card, border: `1px solid rgba(255,107,43,0.12)`, borderRadius: 20, padding: '28px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.12em', color: C.orange, textTransform: 'uppercase', margin: 0, marginBottom: 4 }}>Interação ao Vivo</p>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Fila de Ligações 📞</h2>
              </div>
              <div style={{ background: 'rgba(255,170,68,0.08)', border: '1px solid rgba(255,170,68,0.25)', borderRadius: 9999, padding: '4px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.amber, fontWeight: 600 }}>
                {callers.filter(c => c.status === 'waiting').length} aguardando
              </div>
            </div>
            {callers.length === 0 ? (
              <div style={{ border: '1px dashed rgba(255,107,43,0.10)', borderRadius: 14, padding: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: 36, margin: '0 0 8px' }}>📵</p>
                <p style={{ fontSize: 14, color: C.quiet, fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>Nenhum ouvinte na fila</p>
                <p style={{ fontSize: 12, color: C.dim, fontFamily: 'JetBrains Mono, monospace', margin: '4px 0 0' }}>Ouvintes clicam em &quot;Ligar para a Rádio&quot; na página principal</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {callers.map(caller => (
                  <div key={caller.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 14, background: caller.status === 'connected' ? 'rgba(255,107,43,0.06)' : C.surface, border: '1px solid', borderColor: caller.status === 'connected' ? 'rgba(255,107,43,0.35)' : 'rgba(255,107,43,0.08)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,107,43,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                      {caller.status === 'connected' ? '🎙' : caller.status === 'ended' ? '📴' : '📞'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: 0 }}>{caller.name}</p>
                      <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', margin: '2px 0 0', letterSpacing: '0.06em', color: caller.status === 'connected' ? C.orange : caller.status === 'ended' ? C.dim : C.amber }}>
                        {caller.status === 'connected' ? '● AO VIVO' : caller.status === 'ended' ? 'ENCERRADO' : '◌ AGUARDANDO'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {caller.status === 'waiting' && !activeCall && <button onClick={() => answerCaller(caller)} style={{ padding: '8px 18px', borderRadius: 9999, border: 'none', background: C.orange, color: C.bg, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, cursor: 'pointer' }}>ATENDER</button>}
                      {caller.status === 'connected' && <button onClick={() => hangUp(caller.id)} style={{ padding: '8px 18px', borderRadius: 9999, border: '1px solid rgba(255,100,100,0.40)', background: 'rgba(255,60,60,0.08)', color: '#ff6b6b', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>ENCERRAR</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
