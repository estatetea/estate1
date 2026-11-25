'use client';
import { exGst, shownPrice } from '@/lib/brand';
import { LOGO as BRAND_LOGO } from '@/lib/brand';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, Loader2, Minus, Plus } from 'lucide-react';

const LOGO_URL = BRAND_LOGO;
const BREW_CHAT_URL = 'https://wa.me/919742668951';
const MAX_EACH = 50;

function friendlyError(status, payload) {
  if (status === 404) return 'This link isn’t valid. Message Brew on WhatsApp and he’ll send you a fresh one.';
  if (status === 410) return payload?.detail || 'This link has expired. Message Brew on WhatsApp and he’ll send you a fresh one.';
  if (status === 400) return payload?.detail || 'Please check your choices and try again.';
  if (status === 503) return payload?.detail || 'We’re unable to place this order right now. Please try again shortly.';
  return payload?.detail || 'Something went wrong. Please try again.';
}

const rupees = n => { const v = Math.round(Number(n || 0) * 100) / 100; return `₹${v.toLocaleString('en-IN', v % 1 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 })}`; };
const blankAddress = { label: '', name: '', phone: '', address: '', pincode: '' };

// Brew's order page, opened from "More options" on WhatsApp: any mix of 250 g and 500 g packs, and where to send them
// (a saved address, or a new one: up to 3). The order goes back to Brew, who carries on in the chat.
export default function OrderPage() {
  const params = useParams();
  const token = useMemo(() => (Array.isArray(params?.token) ? params.token[0] : params?.token), [params]);
  const [state, setState] = useState('loading');
  const [data, setData] = useState(null);
  const [qty, setQty] = useState({});
  const [where, setWhere] = useState('home');
  const [addr, setAddr] = useState(blankAddress);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/order-page/${encodeURIComponent(token)}`, { cache: 'no-store' });
        const p = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok) { setError(friendlyError(r.status, p)); setState('error'); return; }
        setData(p);
        setWhere(p.gift ? 'new' : (p.addresses?.length ? p.addresses[0].id : 'new'));
        setState('form');
      } catch {
        if (!cancelled) { setError('We’re unable to load this page right now. Please try again shortly.'); setState('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (state !== 'done') return;
    const t = setTimeout(() => { window.location.href = BREW_CHAT_URL; }, 2200);
    return () => clearTimeout(t);
  }, [state]);

  const packs = data?.packs || [];
  const step = (id, d) => { setQty(q => ({ ...q, [id]: Math.max(0, Math.min(MAX_EACH, (q[id] || 0) + d)) })); if (error) setError(''); };
  const count = packs.reduce((s, p) => s + (qty[p.id] || 0), 0);
  const kg = packs.reduce((s, p) => s + (qty[p.id] || 0) * (p.id === '500g' ? 0.5 : 0.25), 0);
  const subtotal = data?.business_rate ? kg * data.business_rate : packs.reduce((s, p) => s + (qty[p.id] || 0) * p.price, 0);
  const belowMin = !!data?.business_rate && kg < 2 - 1e-9;
  const gst = data?.friend ? 0 : subtotal * (data?.gst_pct || 0) / 100;
  // Christmas Spirit: any number of bottles, its price already includes GST (the tea's 5% doesn't apply to it).
  // The Christmas collection (24 Nov): Christmas Spirit, Crumble and Classic, each with its own + / -, prices GST included.
  const coll = data?.collection?.length ? data.collection : (data?.drink ? [{ ...data.drink, unit: 'bottle', units: 'bottles' }] : []);
  const drink = coll.length ? coll[0] : null;
  const bottles = coll.reduce((s, c) => s + (qty[c.id] || 0), 0);
  const drinkTotal = coll.reduce((s, c) => s + (qty[c.id] || 0) * c.price, 0);
  const finalSale = coll.some(c => c.final_sale && qty[c.id]);
  // 🎁 A gift link: only other people's saved addresses, a new one is always possible (an old one makes room).
  const gift = !!data?.gift;
  const shown = (data?.addresses || []).filter(a => !gift || !a.own);
  const canAdd = gift || (data?.addresses?.length || 0) < (data?.max_addresses || 3);
  const recipient = gift || !!data?.addresses?.length;
  const setA = e => { const { name, value } = e.target; setAddr(a => ({ ...a, [name]: value })); if (error) setError(''); };

  const submit = async e => {
    e.preventDefault();
    if (busy) return;
    if (!count && !bottles) return setError(drink ? 'Please choose at least one item.' : 'Please choose at least one pack.');
    const body = { gift, items: [...packs.filter(p => qty[p.id]).map(p => ({ id: p.id, quantity: qty[p.id] })), ...coll.filter(c => qty[c.id]).map(c => ({ id: c.id, quantity: qty[c.id] }))] };
    if (where === 'new') {
      const a = Object.fromEntries(Object.entries(addr).map(([k, v]) => [k, v.trim()]));
      if (a.address.length < 8) return setError('Please enter the full delivery address.');
      if (!/^[1-9][0-9]{5}$/.test(a.pincode)) return setError('Please enter a valid 6-digit PIN code.');
      if (gift && a.name.replace(/[^A-Za-z]/g, '').length < 2) return setError('Please enter the name of the person receiving the gift.');
      if (gift && !a.phone) return setError('Please enter their mobile number, so we can reach them for the delivery.');
      if (a.phone && !/^(\+?91)?[6-9][0-9]{9}$/.test(a.phone.replace(/\s|-/g, ''))) return setError('Please enter a valid 10-digit mobile number for the person receiving it.');
      body.new_address = a;
    } else {
      body.address_id = where;
    }
    setBusy(true); setError('');
    try {
      const r = await fetch(`/api/order-page/${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const res = await r.json().catch(() => ({}));
      if (!r.ok) return setError(friendlyError(r.status, res));
      setDone(res.message || 'Done! Head back to WhatsApp 🙂');
      setState('done');
    } catch {
      setError('We couldn’t place your order right now. Please try again shortly.');
    } finally { setBusy(false); }
  };

  const input = 'block w-full rounded-lg border border-white/10 bg-white px-4 py-3 text-base text-black caret-black placeholder:text-black/40 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/40';
  return (
    <main className="min-h-[100dvh] bg-[#0A0A0A] text-[#F5F5F0] px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-xl flex-col justify-center">
        <div className="mb-8 flex justify-center sm:mb-10">
          <img src={LOGO_URL} alt="Estate Tea" className="h-24 w-24 object-contain logo-sharp sm:h-28 sm:w-28" />
        </div>
        <section className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl shadow-black/30 sm:p-9">
          {state === 'loading' && (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <Loader2 className="mb-5 h-7 w-7 animate-spin text-[#D4AF37]" aria-hidden="true" />
              <p className="text-sm font-light text-white/65">One moment…</p>
            </div>
          )}
          {state === 'error' && (
            <div className="min-h-72 flex flex-col items-center justify-center text-center">
              <div className="mb-5 h-px w-12 bg-[#D4AF37]" />
              <h1 className="text-3xl font-light tracking-wide sm:text-4xl">Your order</h1>
              <p className="mt-5 max-w-md text-sm font-light leading-6 text-white/65 sm:text-base">{error}</p>
              <a href={BREW_CHAT_URL} className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-medium text-black hover:bg-[#c9a432]">Back to WhatsApp</a>
            </div>
          )}
          {state === 'done' && (
            <div className="min-h-72 flex flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/70 bg-[#D4AF37]/10">
                <Check className="h-6 w-6 text-[#D4AF37]" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-light tracking-wide sm:text-4xl">Thank you.</h1>
              <p className="mt-4 max-w-md text-sm font-light leading-6 text-white/65 sm:text-base">{done} Taking you back to WhatsApp…</p>
              <a href={BREW_CHAT_URL} className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-medium text-black hover:bg-[#c9a432]">Back to WhatsApp</a>
            </div>
          )}
          {state === 'form' && data && (
            <>
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">Estate Tea</p>
                <h1 className="mt-3 text-3xl font-light tracking-wide sm:text-4xl">{gift ? '🎁 Send a gift' : data.name ? `Your order, ${data.name}` : 'Your order'}</h1>
                <p className="mx-auto mt-4 max-w-md text-sm font-light leading-6 text-white/65 sm:text-base">
                  {drink ? 'Premium tea from the Nilgiris, and our Christmas collection for the season. Choose as many as you like.' : 'Premium black CTC tea powder from the Nilgiris. Choose as many packs as you like.'}
                </p>
              </div>
              <form onSubmit={submit} className="mt-8 space-y-6" noValidate>
                <div className="space-y-3">
                  {packs.map(p => (
                    <div key={p.id} className={`flex items-center justify-between rounded-xl border px-4 py-4 ${p.in_stock ? 'border-white/10' : 'border-white/5 opacity-50'}`}>
                      <div>
                        <p className="text-base">{p.label} pack</p>
                        <p className="mt-0.5 text-sm text-white/55">
                          {p.in_stock ? (data.business_rate ? `${rupees(data.business_rate * (p.id === '500g' ? 0.5 : 0.25))}` : rupees(p.price)) + (data.friend ? ' · all in' : ' + GST') : 'Sold out right now'}
                        </p>
                      </div>
                      {p.in_stock ? (
                        <div className="flex items-center gap-3">
                          <button type="button" aria-label={`One less ${p.label} pack`} onClick={() => step(p.id, -1)} disabled={!qty[p.id]}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
                          <span className="w-6 text-center text-lg tabular-nums">{qty[p.id] || 0}</span>
                          <button type="button" aria-label={`One more ${p.label} pack`} onClick={() => step(p.id, 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"><Plus className="h-4 w-4" /></button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {coll.length > 0 && (
                  <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.04] px-4 py-2">
                    <p className="pt-2 text-xs uppercase tracking-[0.2em] text-[#D4AF37]/80">🎄 The Christmas collection</p>
                    {coll.map(c => (
                      <div key={c.id} className="flex items-center justify-between gap-3 border-b border-white/5 py-3 last:border-0">
                        <div className="min-w-0">
                          <p className="text-base">{c.label} <span className="text-sm text-white/50">· {c.size}</span></p>
                          <p className="mt-0.5 text-sm text-white/55">{c.about} · {rupees(shownPrice(c))} a {c.unit || 'piece'}, {exGst(c) ? 'GST excluded' : 'GST included'}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <button type="button" aria-label={`One less ${c.label}`} onClick={() => step(c.id, -1)} disabled={!qty[c.id]}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
                          <span className="w-8 text-center text-lg tabular-nums">{qty[c.id] || 0}</span>
                          <button type="button" aria-label={`One more ${c.label}`} onClick={() => step(c.id, 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"><Plus className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                    {finalSale && <p className="pb-2 text-xs text-amber-200/80">Christmas Spirit is a final sale: once paid, it can’t be cancelled or refunded.</p>}
                  </div>
                )}

                <div className="rounded-xl border border-white/10 px-4 py-4 text-sm">
                  {(count > 0 || !bottles) && <div className="flex justify-between text-white/70"><span>{count ? `${count} pack${count > 1 ? 's' : ''} · ${kg % 1 ? kg : kg.toFixed(0)} kg` : 'No packs yet'}</span><span>{rupees(subtotal)}</span></div>}
                  {!data.friend && count > 0 && <div className="mt-1 flex justify-between text-white/50"><span>GST on tea ({data.gst_pct}%)</span><span>{rupees(gst)}</span></div>}
                  {coll.filter(c => qty[c.id]).map(c => <div key={c.id} className="mt-1 flex justify-between text-white/70"><span>{qty[c.id]} × {c.label}{exGst(c) ? '' : ' (GST included)'}</span><span>{rupees(qty[c.id] * shownPrice(c))}</span></div>)}
                  {coll.some(c => qty[c.id] && exGst(c)) && <div className="mt-1 flex justify-between text-white/50"><span>GST on {coll.filter(c => qty[c.id] && exGst(c)).map(c => c.label).join(' and ')} (18%)</span><span>{rupees(coll.filter(c => qty[c.id] && exGst(c)).reduce((t, c) => t + qty[c.id] * (c.price - shownPrice(c)), 0))}</span></div>}
                  <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-base"><span>Total</span><span className="text-[#D4AF37]">{rupees(subtotal + gst + drinkTotal)}</span></div>
                  <p className="mt-2 text-xs font-light leading-5 text-white/45">
                    {data.business_rate ? `Your price: ${rupees(data.business_rate)} a kg + GST, 2 kg minimum, delivery included.` : <>{data.welcome_pct ? `Your ${data.welcome_pct}% first-order discount comes off ${drink ? 'the tea ' : ''}on the invoice. ` : ''}Delivery (if any) is added on the invoice, worked out from the address.</>}
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-sm text-white/80">{gift ? 'Who is it for?' : 'Deliver to'}</p>
                  {gift && <p className="-mt-2 mb-3 text-xs font-light leading-5 text-white/50">We deliver it straight to them. Your invoice comes to you on WhatsApp.</p>}
                  <div className="space-y-2">
                    {shown.map(a => (
                      <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 ${where === a.id ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10'}`}>
                        <input type="radio" name="where" className="mt-1 accent-[#D4AF37]" checked={where === a.id} onChange={() => setWhere(a.id)} />
                        <span className="text-sm leading-5"><span className="text-white">{a.label}</span><br /><span className="text-white/55">{a.address}{a.name ? ` · for ${a.name}` : ''}</span></span>
                      </label>
                    ))}
                    {canAdd && (
                      <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${where === 'new' ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10'}`}>
                        <input type="radio" name="where" className="accent-[#D4AF37]" checked={where === 'new'} onChange={() => setWhere('new')} />
                        <span className="text-sm">{gift ? (shown.length ? 'Someone new' : 'The person receiving it') : data.addresses?.length ? 'A new address (a gift, the office…)' : 'My delivery address'}</span>
                      </label>
                    )}
                  </div>
                  {where === 'new' && (
                    <div className="mt-4 space-y-4">
                      {recipient ? <>
                        {!gift && <Field label="Name this address" optional><input name="label" value={addr.label} onChange={setA} maxLength={30} placeholder="Mom, Office…" className={input} /></Field>}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
                          <Field label={gift ? 'Their name' : 'Who receives it'} optional={!gift} required={gift}><input name="name" value={addr.name} onChange={setA} maxLength={60} className={input} /></Field>
                          <Field label="Their mobile" optional={!gift} required={gift}><input name="phone" value={addr.phone} onChange={setA} inputMode="tel" maxLength={14} className={input} /></Field>
                        </div>
                      </> : null}
                      <Field label="Full address (house, street, area, city)" required><input name="address" value={addr.address} onChange={setA} maxLength={300} className={input} /></Field>
                      <Field label="PIN code" required><input name="pincode" value={addr.pincode} onChange={setA} inputMode="numeric" maxLength={6} className={input} /></Field>
                    </div>
                  )}
                  {!gift && <p className="mt-2 text-xs font-light text-white/40">You can save up to {data.max_addresses} addresses.</p>}
                </div>

                {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm leading-5 text-red-200">{error}</p>}
                <button type="submit" disabled={busy || (!count && !bottles) || belowMin}
                  className="flex min-h-12 w-full items-center justify-center rounded-lg border border-[#D4AF37] bg-[#D4AF37] px-5 py-3 text-sm font-medium tracking-wide text-[#0A0A0A] transition hover:bg-[#E1C15A] disabled:cursor-not-allowed disabled:opacity-60">
                  {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Placing your order…</> : belowMin && count ? 'Choose at least 2 kg' : (count || bottles) ? `Place order · ${rupees(subtotal + gst + drinkTotal)}` : (drink ? 'Choose your items' : 'Choose your packs')}
                </button>
                <p className="text-center text-xs font-light leading-5 text-white/40">Your invoice comes to you on WhatsApp, with a secure payment link and a QR code.</p>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, required, optional, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline justify-between text-sm text-white/80">
        <span>{label}{required ? <span className="ml-1 text-[#D4AF37]">*</span> : null}</span>
        {optional ? <span className="text-xs font-light text-white/35">Optional</span> : null}
      </span>
      {children}
    </label>
  );
}
