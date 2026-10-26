'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { OrderLookupResult } from '@/components/delivery/OrderLookupResult';

// Customers land here from their confirmation email (/track?order=ET-0001) to check order status.
function TrackOrder() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fromLink = params.get('order');
    if (fromLink && /^ET-\d{4,}$/i.test(fromLink.trim())) setOrderNumber(fromLink.trim().toUpperCase());
  }, [params]);

  const lookup = async e => {
    e.preventDefault();
    setLoading(true); setResult(null);
    try {
      const r = await fetch('/api/website-orders/lookup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estate_order_number: orderNumber.trim().toUpperCase(), email: email.trim() }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || data.detail || 'We could not find that order. Check the order number and email address.');
      setResult(data);
    } catch (err) { setResult({ error: err.message || 'Order lookup is temporarily unavailable. Please try again.' }); }
    finally { setLoading(false); }
  };

  const input = 'mt-1 w-full rounded-lg border border-white/20 bg-black/30 p-3 text-white placeholder:text-gray-600 focus:border-[#D4AF37] focus:outline-none';
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="glass-surface border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-light gold-text">Estate Tea</a>
          <a href="/" className="text-xs uppercase tracking-[.2em] text-gray-400 hover:text-[#D4AF37]">Shop</a>
        </div>
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center p-4">
        <div className="w-full max-w-md py-10">
          <p className="text-xs uppercase tracking-[.25em] text-[#D4AF37]">Order status</p>
          <h1 className="mt-2 text-4xl font-light gold-text">Track your order</h1>
          <p className="mt-3 text-sm text-gray-400">Enter your Estate Tea order number (it starts with ET-) and the email address you used at checkout.</p>
          <form onSubmit={lookup} className="mt-8 space-y-4">
            <label className="block text-xs text-gray-400">Order number
              <input required value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="ET-0001" autoCapitalize="characters" className={`${input} font-mono tracking-wider`} />
            </label>
            <label className="block text-xs text-gray-400">Email used for the order
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" autoFocus={Boolean(orderNumber)} className={input} />
            </label>
            <button type="submit" disabled={loading || !orderNumber.trim() || !email.trim()} className="w-full rounded-lg bg-[#D4AF37] hover:bg-[#FDE047] text-black uppercase tracking-[.2em] py-3.5 text-sm disabled:opacity-50">{loading ? 'Checking…' : 'Check order status'}</button>
          </form>
          <div className="mt-6">
            {result?.error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-200">{result.error}</p>}
            {result && !result.error && <OrderLookupResult order={result} />}
          </div>
          <p className="mt-6 text-[11px] leading-5 text-gray-500">For your privacy, order details are only shown when the email matches the order.</p>
        </div>
      </main>
    </div>
  );
}

export default function TrackPage() {
  return <Suspense fallback={null}><TrackOrder /></Suspense>;
}
