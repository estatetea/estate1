import SiteApp from '@/components/SiteApp';

// estatetea.in/christmas: the link for adverts. Opens straight on the Christmas collection (customers see "coming soon"
// until it's public; the owner, signed in with his WhatsApp number, sees the real page), with a proper share preview.
const TITLE = 'The Christmas Collection · Estate Tea';
const DESCRIPTION = 'Christmas Crumble cookies and Christmas Classic plum cake from Estate Tea, made in small batches. Order online in Bangalore.';
export const metadata = {
  metadataBase: new URL('https://estatetea.in'),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/christmas' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/christmas', siteName: 'Estate Tea', type: 'website',
    images: [{ url: '/images/collection/christmas-share.jpg', width: 1200, height: 630, alt: 'The Estate Tea Christmas Collection' }] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/images/collection/christmas-share.jpg'] },
};

export default function ChristmasPage() {
  return <SiteApp start="collection" />;
}
