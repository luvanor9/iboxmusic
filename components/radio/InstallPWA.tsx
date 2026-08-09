'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  if (installed) return null;
  if (!visible && !isIOS) return null;

  return (
    <>
      <div style={{
        background: '#1E2023',
        border: '1px solid rgba(255,107,43,0.20)',
        borderRadius: 16,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 400,
        width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#FF6B2B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}>
            📻
          </div>
          <div>
            <p style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#F2EDE8',
              margin: 0,
              lineHeight: 1.2,
            }}>
              Baixe o App IBOX MUSIC
            </p>
            <p style={{
              fontSize: 12,
              color: '#9A8F88',
              margin: 0,
              marginTop: 2,
            }}>
              Acesso rápido na tela inicial
            </p>
          </div>
        </div>

        <button
          onClick={handleInstall}
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 9999,
            border: 'none',
            background: '#FF6B2B',
            color: '#111214',
            fontWeight: 700,
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(255,107,43,0.40)',
            letterSpacing: '0.04em',
          }}
        >
          📲 INSTALAR AGORA — GRÁTIS
        </button>

        {isIOS && (
          <p style={{
            fontSize: 11,
            color: '#5C5450',
            fontFamily: 'JetBrains Mono, monospace',
            margin: 0,
            textAlign: 'center',
          }}>
            Toque em <strong style={{ color: '#9A8F88' }}>Compartilhar</strong> → <strong style={{ color: '#9A8F88' }}>Tela de Início</strong>
          </p>
        )}
      </div>

      {/* iOS guide modal */}
      {showIOSGuide && (
        <div
          onClick={() => setShowIOSGuide(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4,5,5,0.85)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 999,
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1E2023',
              border: '1px solid rgba(255,107,43,0.30)',
              borderRadius: 20,
              padding: 28,
              maxWidth: 360,
              width: '100%',
              marginBottom: 16,
            }}
          >
            <h3 style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#F2EDE8',
              marginTop: 0,
              marginBottom: 16,
            }}>
              Instalar no iPhone/iPad
            </h3>
            {[
              ['1️⃣', 'Toque no ícone de Compartilhar', '(caixa com seta ↑)'],
              ['2️⃣', 'Role a lista e toque em', '"Adicionar à Tela de Início"'],
              ['3️⃣', 'Toque em "Adicionar"', 'no canto superior direito'],
            ].map(([num, line1, line2]) => (
              <div key={num} style={{
                display: 'flex',
                gap: 12,
                marginBottom: 14,
                alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 20 }}>{num}</span>
                <div>
                  <p style={{ fontSize: 14, color: '#F2EDE8', margin: 0 }}>{line1}</p>
                  <p style={{ fontSize: 12, color: '#9A8F88', margin: 0, marginTop: 2 }}>{line2}</p>
                </div>
              </div>
            ))}
            <button
              onClick={() => setShowIOSGuide(false)}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 9999,
                border: '1px solid rgba(255,107,43,0.30)',
                background: 'transparent',
                color: '#FF6B2B',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
