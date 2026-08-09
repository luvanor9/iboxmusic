import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import { AgentationGuard } from '@/components/AgentationGuard';
import { HappySeedsWatermark } from '@/components/HappySeedsWatermark';
import { PlayerProvider } from '@/components/radio/PlayerContext';
import { FloatingPlayer } from '@/components/radio/FloatingPlayer';
import './globals.css';

export const metadata: Metadata = {
  title: 'IBOX MUSIC — Rádio Web ao Vivo',
  description: 'Ouça a Rádio Web IBOX MUSIC ao vivo de qualquer lugar do mundo. Música, entretenimento e conexão 24 horas por dia.',
  keywords: ['rádio web', 'IBOX MUSIC', 'radio online', 'música ao vivo', 'streaming de rádio'],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'IBOX MUSIC',
  },
  openGraph: {
    title: 'IBOX MUSIC — Rádio Web ao Vivo',
    description: 'Ouça ao vivo de qualquer lugar do mundo.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#FF6B2B',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        {process.env.NODE_ENV === 'production' && (
          <Script
            async
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        )}
      </head>
      <body className="antialiased">
        <PlayerProvider>
          {children}
          <FloatingPlayer />
          <HappySeedsWatermark />
          <AgentationGuard />
        </PlayerProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
