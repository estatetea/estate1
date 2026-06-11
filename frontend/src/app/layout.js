import './globals.css';

export const metadata = {
  title: 'Estate Tea — Premium Tea from Kotagiri',
  description: 'Hand-picked premium tea from the misty hills of Kotagiri, India.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
