'use client';

import { useEffect, useState } from 'react';
import type { ScheduleItem } from '@/lib/radio-config';
import { SCHEDULE as FALLBACK } from '@/lib/radio-config';

const DAYS = ['Seg – Sex', 'Sáb', 'Dom'];

export function ScheduleSection() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(FALLBACK);
  const [activeDay, setActiveDay] = useState('Seg – Sex');

  useEffect(() => {
    fetch('/api/schedule')
      .then(r => r.json())
      .then((data: ScheduleItem[]) => { if (Array.isArray(data)) setSchedule(data); })
      .catch(() => {});
  }, []);

  const filtered = schedule.filter(s => s.day === activeDay);

  const nowHour  = new Date().getHours();
  const nowMin   = new Date().getMinutes();
  const nowTotal = nowHour * 60 + nowMin;

  const getCurrentShow = () => {
    const times = filtered.map(s => {
      const [h, m] = s.time.split(':').map(Number);
      return h * 60 + m;
    });
    let cur = -1;
    for (let i = 0; i < times.length; i++) {
      if (nowTotal >= times[i]) cur = i;
    }
    return cur;
  };
  const currentIdx = activeDay === 'Seg – Sex' ? getCurrentShow() : -1;

  return (
    <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.12em', color: '#FF6B2B', textTransform: 'uppercase', marginBottom: 8 }}>Programação</p>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: '#F2EDE8', letterSpacing: '-0.02em', margin: 0 }}>Grade Horária</h2>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        {DAYS.map(day => (
          <button key={day} onClick={() => setActiveDay(day)} style={{
            padding: '8px 20px', borderRadius: 9999, border: '1px solid',
            borderColor: activeDay === day ? '#FF6B2B' : 'rgba(255,107,43,0.20)',
            background: activeDay === day ? '#FF6B2B' : 'transparent',
            color: activeDay === day ? '#111214' : '#9A8F88',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {day}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#5C5450', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, padding: '32px 0' }}>
            Nenhum programa cadastrado para este dia.
          </p>
        )}
        {filtered.map((item, i) => {
          const isCurrent = i === currentIdx;
          return (
            <div key={i} style={{
              background: isCurrent ? 'rgba(255,107,43,0.08)' : '#1E2023',
              border: '1px solid', borderColor: isCurrent ? 'rgba(255,107,43,0.50)' : 'rgba(255,107,43,0.12)',
              borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20,
              boxShadow: isCurrent ? '0 0 20px rgba(255,107,43,0.12)' : 'none', transition: 'all 0.2s',
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: isCurrent ? '#FF6B2B' : '#5C5450', minWidth: 56, flexShrink: 0 }}>
                {item.time}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: isCurrent ? '#F2EDE8' : '#9A8F88', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item.show}
                  {isCurrent && (
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, background: '#FF6B2B', color: '#111214', padding: '2px 8px', borderRadius: 9999, fontWeight: 700, letterSpacing: '0.08em' }}>AO AR</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#5C5450', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.02em', marginTop: 2 }}>
                  {item.host} · {item.genre}
                </div>
              </div>
              {isCurrent && (
                <div className="animate-pulse-dot" style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF6B2B', boxShadow: '0 0 8px #FF6B2B', flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
