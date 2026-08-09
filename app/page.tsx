'use client';

import { RadioPlayer } from '@/components/radio/RadioPlayer';
import { Ticker } from '@/components/radio/Ticker';
import { ScheduleSection } from '@/components/radio/ScheduleSection';
import { ChatSection } from '@/components/radio/ChatSection';
import { InstallPWA } from '@/components/radio/InstallPWA';
import { SocialLinks } from '@/components/radio/SocialLinks';
import { CallButton } from '@/components/radio/CallButton';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#111214', color: '#F2EDE8' }}>

      {/* ── NAVBAR ────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 56,
        background: 'rgba(4,5,5,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,107,43,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#FF6B2B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}>
            📻
          </div>
          <span style={{
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: '-0.01em',
          }}>
            IBOX <span style={{ color: '#FF6B2B' }}>MUSIC</span>
          </span>
        </div>

        <div style={{
          display: 'flex',
          gap: 20,
          alignItems: 'center',
        }}>
          <a href="#programacao" style={navLink}>Programação</a>
          <a href="#chat" style={navLink}>Chat</a>
          <a href="#redes" style={navLink}>Redes</a>
          <a href="/studio" style={{
            ...navLink,
            color: '#FF6B2B',
            border: '1px solid rgba(255,107,43,0.30)',
            borderRadius: 9999,
            padding: '4px 14px',
          }}>🎙 Estúdio</a>
          <div style={{
            background: 'rgba(255,107,43,0.12)',
            border: '1px solid rgba(255,107,43,0.40)',
            borderRadius: 9999,
            padding: '4px 12px',
            fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace',
            color: '#FF6B2B',
            fontWeight: 600,
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#FF6B2B',
                display: 'inline-block',
                boxShadow: '0 0 6px #FF6B2B',
              }}
              className="animate-pulse-dot"
            />
            AO VIVO
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '60px 24px',
      }}>
        {/* Background gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,107,43,0.12), transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 70%, rgba(255,170,68,0.08), transparent 60%),
            #111214
          `,
        }} />

        {/* Grid lines decoration */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,107,43,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,107,43,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.6,
        }} />

        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 48,
          width: '100%',
          maxWidth: 1100,
        }}>
          {/* Text + player layout */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 48,
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}>
            {/* Left: headline */}
            <div style={{
              flex: '1 1 340px',
              textAlign: 'left',
              maxWidth: 540,
            }}
            className="animate-fade-in-up"
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,107,43,0.08)',
                border: '1px solid rgba(255,107,43,0.25)',
                borderRadius: 9999,
                padding: '6px 16px',
                marginBottom: 24,
              }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#FFAA44',
                  display: 'inline-block',
                  boxShadow: '0 0 6px #FFAA44',
                }} className="animate-pulse-dot" />
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  color: '#FFAA44',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                }}>
                  TRANSMISSÃO AO VIVO · 24H
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(48px, 8vw, 90px)',
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                margin: 0,
                marginBottom: 10,
              }}>
                IBOX<br />
                <span style={{ color: '#FF6B2B' }}>MUSIC</span>
              </h1>

              <p style={{
                fontSize: 'clamp(13px, 2vw, 16px)',
                fontWeight: 600,
                color: '#FF6B2B',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'JetBrains Mono, monospace',
                margin: 0,
                marginBottom: 6,
                lineHeight: 1.4,
              }}>
                A Sintonia que te Aproxima de Deus
              </p>
              <p style={{
                fontSize: 12,
                color: '#5C5450',
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                margin: 0,
                marginBottom: 28,
              }}>
                Brazabrantes · Goiás
              </p>

              <p style={{
                fontSize: 18,
                color: '#9A8F88',
                lineHeight: 1.6,
                margin: 0,
                marginBottom: 32,
                maxWidth: 400,
              }}>
                Sua rádio online ao vivo, transmitindo para o mundo inteiro. 
                Música, energia e conexão — onde você estiver.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  color: '#9A8F88',
                }}>
                  <span style={{ color: '#FF6B2B' }}>✓</span> Acesso grátis
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  color: '#9A8F88',
                }}>
                  <span style={{ color: '#FF6B2B' }}>✓</span> Funciona no celular
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  color: '#9A8F88',
                }}>
                  <span style={{ color: '#FF6B2B' }}>✓</span> Instalável como app
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  color: '#9A8F88',
                }}>
                  <span style={{ color: '#FF6B2B' }}>✓</span> Transmissão ao vivo
                </div>
              </div>
            </div>

            {/* Right: player */}
            <div style={{
              flex: '0 0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}>
              <RadioPlayer />
              <InstallPWA />
              <CallButton />
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex',
            gap: 1,
            background: 'rgba(255,107,43,0.08)',
            borderRadius: 16,
            border: '1px solid rgba(255,107,43,0.12)',
            overflow: 'hidden',
            flexWrap: 'wrap',
            width: '100%',
            maxWidth: 600,
          }}>
            {[
              ['24H', 'No ar todos os dias'],
              ['HD', 'Qualidade de áudio'],
              ['∞', 'Ouvintes no mundo'],
              ['FREE', 'Acesso gratuito'],
            ].map(([num, label]) => (
              <div key={num} style={{
                flex: '1 1 120px',
                padding: '20px 16px',
                textAlign: 'center',
                borderRight: '1px solid rgba(255,107,43,0.08)',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#FF6B2B',
                  letterSpacing: '-0.01em',
                }}>
                  {num}
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#5C5450',
                  marginTop: 4,
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.04em',
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TICKER ─────────────────────────────────────────── */}
      <Ticker />

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section style={{
        padding: '80px 24px',
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.12em',
            color: '#FF6B2B',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>Como funciona</p>
          <h2 style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#F2EDE8',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>Como ouvir a rádio</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {[
            { step: '01', title: 'Abra o app', desc: 'Acesse pelo navegador do celular ou computador — sem instalar nada.', icon: '🌐' },
            { step: '02', title: 'Clique em Ouvir', desc: 'Pressione o botão OUVIR AO VIVO para conectar à transmissão.', icon: '▶️' },
            { step: '03', title: 'Instale no celular', desc: 'Salve na tela inicial para acesso rápido, como um app nativo.', icon: '📲' },
            { step: '04', title: 'Peça músicas', desc: 'Use o chat para interagir e pedir suas músicas favoritas.', icon: '💬' },
          ].map(item => (
            <div
              key={item.step}
              style={{
                background: '#1E2023',
                border: '1px solid rgba(255,107,43,0.10)',
                borderRadius: 16,
                padding: '24px 20px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.borderColor = 'rgba(255,107,43,0.35)';
                el.style.boxShadow = '0 0 16px rgba(255,107,43,0.10)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.borderColor = 'rgba(255,107,43,0.10)';
                el.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: '#FF6B2B',
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}>
                PASSO {item.step}
              </div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#F2EDE8',
                margin: 0,
                marginBottom: 8,
              }}>
                {item.title}
              </h3>
              <p style={{
                fontSize: 13,
                color: '#9A8F88',
                margin: 0,
                lineHeight: 1.5,
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SCHEDULE ───────────────────────────────────────── */}
      <section id="programacao" style={{ padding: '60px 0 80px' }}>
        <ScheduleSection />
      </section>

      {/* ── CHAT ───────────────────────────────────────────── */}
      <section id="chat" style={{
        padding: '60px 0 80px',
        background: 'rgba(255,107,43,0.03)',
        borderTop: '1px solid rgba(255,107,43,0.06)',
        borderBottom: '1px solid rgba(255,107,43,0.06)',
      }}>
        <ChatSection />
      </section>

      {/* ── SOCIAL ─────────────────────────────────────────── */}
      <section id="redes" style={{ padding: '80px 0' }}>
        <SocialLinks />
      </section>

      {/* ── HOW TO BROADCAST ───────────────────────────────── */}
      <section style={{
        padding: '60px 24px 80px',
        maxWidth: 720,
        margin: '0 auto',
      }}>
        <div style={{
          background: '#1E2023',
          border: '1px solid rgba(255,107,43,0.20)',
          borderRadius: 20,
          padding: '36px 32px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(255,107,43,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}>
              🎙
            </div>
            <div>
              <h2 style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#F2EDE8',
                margin: 0,
              }}>
                Como transmitir ao vivo
              </h2>
              <p style={{
                fontSize: 12,
                color: '#9A8F88',
                fontFamily: 'JetBrains Mono, monospace',
                margin: 0,
                marginTop: 2,
              }}>
                Guia rápido para DJs e locutores
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              {
                title: '1. Configure o AzuraCast (recomendado)',
                desc: 'Servidor gratuito e open-source. Instale em qualquer VPS ou use um provedor hospedado. Ele gera automaticamente a URL do stream.',
                link: { text: 'azuracast.com', href: 'https://azuracast.com' },
              },
              {
                title: '2. Baixe o BUTT (Broadcast Using This Tool)',
                desc: 'Aplicativo gratuito para Windows, Mac e Linux. Configure o servidor AzuraCast e comece a transmitir do seu microfone.',
                link: { text: 'danielnoethen.de/butt', href: 'https://danielnoethen.de/butt/' },
              },
              {
                title: '3. Cole a URL do stream aqui',
                desc: 'Edite o arquivo lib/radio-config.ts e substitua a streamUrl pela URL fornecida pelo AzuraCast.',
              },
              {
                title: '4. Transmita para o mundo',
                desc: 'Com a URL configurada, qualquer pessoa com internet consegue ouvir sua rádio em tempo real, de qualquer lugar do planeta.',
              },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 12,
                border: '1px solid rgba(255,107,43,0.06)',
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255,107,43,0.12)',
                  border: '1px solid rgba(255,107,43,0.30)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#FF6B2B',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div>
                  <p style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#F2EDE8',
                    margin: 0,
                    marginBottom: 4,
                  }}>
                    {item.title}
                  </p>
                  <p style={{
                    fontSize: 13,
                    color: '#9A8F88',
                    margin: 0,
                    lineHeight: 1.5,
                  }}>
                    {item.desc}
                    {item.link && (
                      <>
                        {' '}
                        <a href={item.link.href} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#FF6B2B', textDecoration: 'none' }}>
                          → {item.link.text}
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,107,43,0.08)',
        padding: '32px 24px',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 16,
          fontWeight: 700,
          color: '#FF6B2B',
          letterSpacing: '0.08em',
          marginBottom: 8,
        }}>
          IBOX MUSIC
        </div>
        <p style={{
          fontSize: 12,
          color: '#5C5450',
          fontFamily: 'JetBrains Mono, monospace',
          margin: '0 0 16px',
        }}>
          Rádio Web · Transmissão ao Vivo 24H · Acesso Global
        </p>
        <div style={{
          display: 'flex',
          gap: 24,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 16,
        }}>
          <a href="#programacao" style={{ ...navLink, fontSize: 12 }}>Programação</a>
          <a href="#chat" style={{ ...navLink, fontSize: 12 }}>Chat</a>
          <a href="#redes" style={{ ...navLink, fontSize: 12 }}>Redes Sociais</a>
        </div>
        <p style={{
          fontSize: 11,
          color: '#3A3330',
          fontFamily: 'JetBrains Mono, monospace',
          margin: 0,
        }}>
          © 2025 IBOX MUSIC · Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}

const navLink: React.CSSProperties = {
  fontSize: 13,
  color: '#9A8F88',
  textDecoration: 'none',
  fontFamily: 'JetBrains Mono, monospace',
  letterSpacing: '0.04em',
  transition: 'color 0.15s',
};
