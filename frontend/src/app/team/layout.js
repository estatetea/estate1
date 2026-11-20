// The team app is its own installable beta app: its own name, icon and home-screen entry, always opening on /team
// (never the owner's Estate Tea AI app).
export const metadata = {
  title: 'Estate Tea Team · Beta',
  description: 'Estate Tea team app (beta)',
  manifest: '/team.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'ET Team Beta' },
  icons: {
    icon: [{ url: '/team-icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/team-apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function TeamLayout({ children }) {
  return children;
}
