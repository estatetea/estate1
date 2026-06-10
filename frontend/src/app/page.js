'use client';

import { useState, useCallback } from 'react';
import { Toaster } from 'sonner';
import EntryForm from '@/components/EntryForm';
import WelcomeScreen from '@/components/WelcomeScreen';
import MainStore from '@/components/MainStore';
import CartComponent from '@/components/Cart';
import CheckoutComponent from '@/components/Checkout';
import PaymentSuccess from '@/components/PaymentSuccess';
import PaymentFailed from '@/components/PaymentFailed';

export default function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [cart, setCart] = useState([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [page, setPage] = useState('home');
  const [pageData, setPageData] = useState(null);

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
          if (data.latitude && data.longitude) {
            payload.latitude = data.latitude;
            payload.longitude = data.longitude;
          }
          const response = await fetch('/api/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (response.ok) {
            setWeatherData(await response.json());
          }
        } catch (e) {
          console.error('Weather fetch error:', e);
          setWeatherData(null);
        }
      }
    } catch (e) {
      console.error('handleEntrySubmit error:', e);
    }
  };

  const handleWelcomeComplete = () => {
    console.log('handleWelcomeComplete called, setting page to store');
    setShowWelcome(false);
    setPage('store');
  };

  // Welcome screen overlay
  if (showWelcome && userInfo) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <WelcomeScreen userName={userInfo.name} onComplete={handleWelcomeComplete} />
      </>
    );
  }

  // Not logged in
  if (!userInfo) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <EntryForm onSubmit={handleEntrySubmit} />
      </>
    );
  }

  // Pages
  let content;
  switch (page) {
    case 'store':
    case 'home':
      content = <MainStore userInfo={userInfo} weatherData={weatherData} cart={cart} setCart={setCart} navigate={navigate} />;
      break;
    case 'cart':
      content = <CartComponent cart={cart} setCart={setCart} userInfo={userInfo} navigate={navigate} />;
      break;
    case 'checkout':
      content = <CheckoutComponent cart={cart} userInfo={userInfo} navigate={navigate} />;
      break;
    case 'payment-success':
      content = <PaymentSuccess data={pageData} navigate={navigate} />;
      break;
    case 'payment-failed':
      content = <PaymentFailed data={pageData} navigate={navigate} />;
      break;
    default:
      content = <MainStore userInfo={userInfo} weatherData={weatherData} cart={cart} setCart={setCart} navigate={navigate} />;
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      {content}
    </>
  );
}
