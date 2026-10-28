import './globals.css';

export const metadata = {
  title: 'Estate Tea — Premium Tea from Nilgiris',
  description: 'Premium tea from the misty hills of Nilgiris, India.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Estate Tea AI',
  },
  icons: {
    icon: [{ url: '/estate-tea-favicon.png', sizes: '48x48', type: 'image/png' }, { url: '/estate-tea-icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/estate-tea-apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
