export default function manifest() {
  return {
    name: 'Estate Tea AI',
    short_name: 'Estate Tea AI',
    description: 'Private Estate Tea owner command center',
    start_url: '/ai',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'portrait-primary',
    icons: [
      { src: '/estate-tea-ai-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
    ]
  };
}
