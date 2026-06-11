import './globals.css';

export const metadata = {
  title: 'Estate Tea — Premium Tea from Kotagiri',
  description: 'Hand-picked premium tea from the misty hills of Kotagiri, India.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>{children}</body>
    </html>
  );
}
