import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'khedhiri.me — Notre famille',
    short_name: 'Khedhiri',
    description: 'Notre petit monde entre Lisbonne et Tunis',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF4EA',
    theme_color: '#C5563D',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
