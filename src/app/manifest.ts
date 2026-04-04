import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Factorial',
    short_name: 'Factorial',
    description: 'Gestione turni per il tuo team',
    start_url: '/home',
    display: 'standalone',
    background_color: '#fcf9f4',
    theme_color: '#234428',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
