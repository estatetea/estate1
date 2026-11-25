'use client';
import { LOGO as BRAND_LOGO } from '@/lib/brand';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, Loader2, Minus, Plus } from 'lucide-react';

// The owner's "any mix" page for an invoice he gave an amount for ("send Pearl a new invoice of 380 rupees" -> Choose a
// pack -> Choose items): any number of each item, then ONE invoice at his amount with all of them (WhatsApp's lists only
// take one choice). Brew sends the invoice to the customer and tells him in WhatsApp.
const LOGO_URL = BRAND_LOGO;
const MAX_EACH = 50;
const rupees = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function OwnerInvoicePage() {
  const params = useParams();
  const token = useMemo(() => (Array.isArray(params?.token) ? params.token[0] : params?.token), [params]);
  const [state, setState] = useState('loading');
  const [data, setData] = useState(null);
  const [qty, setQty] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/owner-invoice/${encodeURIComponent(token)}`, { cache: 'no-store' });
        const p = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok) { setError(p?.detail || 'This link isn’t valid any more. Send the invoice message to Brew again.'); setState('error'); return; }
        setData(p); setState('form');
      } catch {
        if (!cancelled) { setError('This page couldn’t load just now. Please try again.'); setState('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const items = data?.items || [];
  const step = (id, d) => { setQty(q => ({ ...q, [id]: Math.max(0, Math.min(MAX_EACH, (q[id] || 0) + d)) })); if (error) setError(''); };
  const chosen = items.filter(i => qty[i.id]);
  const summary = chosen.map(i => `${qty[i.id]} × ${i.label}`).join(', ');

  const submit = async e => {
    e.preventDefault();
    if (busy) return;
    if (!chosen.length) return setError('Choose at least one item.');
    setBusy(true); setError('');
    try {
      const r = await fetch(`/api/owner-invoice/${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: chosen.map(i => ({ id: i.id, quantity: qty[i.id] })) }) });
      const res = await r.json().catch(() => ({}));
      if (!r.ok) return setError(res?.detail || 'That didn’t go through. Please try again.');
      setDone(res); setState('done');
    } catch {
      setError('That didn’t go through. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <main className="min-h-[100dvh] bg-[#0A0A0A] px-5 py-8 text-[#F5F5F0] sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-xl flex-col justify-center">
        <div className="mb-8 flex justify-center"><img src={LOGO_URL} alt="Estate Tea" className="logo-sharp h-20 w-20 object-contain" /></div>
        <section className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl shadow-black/30 sm:p-9">
          {state === 'loading' && <div className="flex min-h-60 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#D4AF37]" /></div>}
          {state === 'error' && <div className="min-h-60 flex flex-col items-center justify-center text-center">
            <h1 className="text-2xl font-light">New invoice</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/65">{error}</p>
          </div>}
          {state === 'done' && <div className="min-h-60 flex flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/70 bg-[#D4AF37]/10"><Check className="h-6 w-6 text-[#D4AF37]" /></div>
            <h1 className="text-2xl font-light">{done?.sent ? 'Invoice sent' : 'Not sent'}</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/65">{done?.message}</p>
            <p className="mt-3 text-xs text-white/40">Brew has told you on WhatsApp too. You can close this page.</p>
          </div>}
          {state === 'form' && data && <>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">New invoice</p>
              <h1 className="mt-3 text-3xl font-light">{rupees(data.amount)} for {data.name}</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/60">Choose everything that goes on it. It’s one invoice for {rupees(data.amount)} in total, with delivery and GST included.</p>
            </div>
            <form onSubmit={submit} className="mt-8 space-y-3" noValidate>
              {items.map(i => (
                <div key={i.id} className={`flex items-center justify-between rounded-xl border px-4 py-4 ${i.kind === 'drink' ? 'border-[#D4AF37]/30 bg-[#D4AF37]/[0.04]' : 'border-white/10'}`}>
                  <p className="text-base">{i.kind === 'drink' ? '🎄 ' : ''}{i.label}</p>
                  <div className="flex items-center gap-3">
                    <button type="button" aria-label={`One less ${i.label}`} onClick={() => step(i.id, -1)} disabled={!qty[i.id]}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
                    <span className="w-6 text-center text-lg tabular-nums">{qty[i.id] || 0}</span>
                    <button type="button" aria-label={`One more ${i.label}`} onClick={() => step(i.id, 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              <p className="pt-2 text-center text-sm text-white/60 min-h-5">{summary || 'Nothing chosen yet'}</p>
              {error && <p className="text-center text-sm text-red-300">{error}</p>}
              <button type="submit" disabled={busy || !chosen.length}
                className="mt-2 w-full rounded-lg bg-[#D4AF37] py-3.5 text-sm font-medium text-black disabled:opacity-40">
                {busy ? 'Sending…' : `Send ${data.name.split(' ')[0]} the ${rupees(data.amount)} invoice`}
              </button>
            </form>
          </>}
        </section>
      </div>
    </main>
  );
}
