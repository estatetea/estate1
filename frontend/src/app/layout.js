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
    icon: '/estate-tea-ai-icon.svg',
    apple: '/estate-tea-ai-icon.svg',
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
