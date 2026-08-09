import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IBOX MUSIC Radio',
    short_name: 'IBOX MUSIC',
    description: 'Rádio Web IBOX MUSIC — Ouça ao vivo de qualquer lugar do mundo.',
    start_url: '/',
    display: 'standalone',
    background_color: '#111214',
    theme_color: '#FF6B2B',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['music', 'entertainment'],
  };
}
