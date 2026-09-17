export default function manifest() {
  return {
    name: 'Estate Tea AI',
    short_name: 'Estate Tea AI',
    description: 'Private Estate Tea owner command center',
    start_url: '/#ai',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  };
}
