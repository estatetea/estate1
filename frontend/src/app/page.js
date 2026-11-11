'use client';

import { useState, useCallback, useEffect } from 'react';
import { Toaster } from 'sonner';
import EntryForm from '@/components/EntryForm';
import WelcomeScreen from '@/components/WelcomeScreen';
import MainStore from '@/components/MainStore';
import WebsiteBrew from '@/components/WebsiteBrew';
import CartComponent from '@/components/Cart';
import CheckoutComponent from '@/components/Checkout';
import Collection, { PREVIEW_KEY } from '@/components/Collection';
import PaymentSuccess from '@/components/PaymentSuccess';
import PaymentFailed from '@/components/PaymentFailed';
import AdminDashboard from '@/components/AdminDashboard';
import AIOpsDashboard from '@/components/AIOpsDashboard';

export default function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [cart, setCart] = useState([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [page, setPage] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#admin') return 'admin';
    if (typeof window !== 'undefined' && window.location.hash === '#ai') return 'ai';
    // The owner's preview of the hidden collection (opened from the web app): keep the pass for this tab, drop it from the URL.
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#collection-preview=')) {
      try { sessionStorage.setItem(PREVIEW_KEY, decodeURIComponent(window.location.hash.slice('#collection-preview='.length))); } catch {}
      return 'collection-preview';
    }
    return 'home';
  });
  const [pageData, setPageData] = useState(null);
  // The preview pass is kept for this tab; take it out of the address bar once the page is up.
  useEffect(() => {
    if (window.location.hash.startsWith('#collection-preview=')) {
      try { window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search); } catch {}
    }
  }, []);

  const navigate = useCallback((path, data) => {
    setPageData(data || null);
    setPage(path);
    window.scrollTo(0, 0);
  }, []);

  const handleEntrySubmit = async (data) => {
    try {
      setUserInfo(data);
      setShowWelcome(true);
      if (data.place) {
        try {
          const payload = { place: data.place };
          if (data.latitude && data.longitude) { payload.latitude = data.latitude; payload.longitude = data.longitude; }
          const response = await fetch('/api/weather', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (response.ok) setWeatherData(await response.json());
        } catch (e) { console.error('Weather fetch error:', e); setWeatherData(null); }
      }
    } catch (e) { console.error('handleEntrySubmit error:', e); }
  };

  const handleWelcomeComplete = () => { setShowWelcome(false); setPage('store'); };

  if (page === 'admin') return <><Toaster position="top-center" richColors /><AdminDashboard navigate={navigate} /></>;
  if (page === 'ai') return <><Toaster position="top-center" richColors /><AIOpsDashboard navigate={navigate} /></>;
  if (page === 'collection-preview') return <><Toaster position="top-center" richColors /><Collection userInfo={userInfo} navigate={p => navigate(p === 'store' ? 'home' : p)} /></>;
  if (showWelcome && userInfo) return <><Toaster position="top-center" richColors /><WelcomeScreen userName={userInfo.name} onComplete={handleWelcomeComplete} /></>;
  if (!userInfo && !['payment-success', 'payment-failed'].includes(page)) return <><Toaster position="top-center" richColors /><EntryForm onSubmit={handleEntrySubmit} /></>;

  let content;
  switch (page) {
    case 'store': case 'home': content = <MainStore userInfo={userInfo} weatherData={weatherData} cart={cart} setCart={setCart} navigate={navigate} />; break;
    case 'cart': content = <CartComponent cart={cart} setCart={setCart} userInfo={userInfo} navigate={navigate} />; break;
    case 'checkout': content = <CheckoutComponent cart={cart} userInfo={userInfo} navigate={navigate} />; break;
    case 'hampers': case 'collection': content = <Collection userInfo={userInfo} navigate={navigate} />; break;
    case 'payment-success': content = <PaymentSuccess data={pageData} navigate={navigate} />; break;
    case 'payment-failed': content = <PaymentFailed data={pageData} navigate={navigate} />; break;
    default: content = <MainStore userInfo={userInfo} weatherData={weatherData} cart={cart} setCart={setCart} navigate={navigate} />;
  }
  return <><Toaster position="top-center" richColors />{content}{(page === 'store' || page === 'home') && <WebsiteBrew navigate={navigate} />}</>;
}
