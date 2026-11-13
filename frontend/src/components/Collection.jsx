'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, AlertTriangle, Eye, Minus, Plus, ShoppingBag } from 'lucide-react';
import CustomerDeliveryFields, { composeAddress, detailsComplete } from './CustomerDeliveryFields';
import Hampers from './Hampers';
import AccountButton from './AccountButton';
import { useAccount } from '@/lib/useAccount';

const loadRazorpay = () => new Promise(res => { if (window.Razorpay) return res(true); const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = () => res(true); s.onerror = () => res(false); document.body.appendChild(s); });
const inr = n => { const v = Number(n || 0); return Number.isInteger(v) ? `₹${v.toLocaleString('en-IN')}` : `₹${v.toFixed(2)}`; };
export const PREVIEW_KEY = 'estate_collection_preview';
const previewPass = () => { try { return sessionStorage.getItem(PREVIEW_KEY) || ''; } catch { return ''; } };

// The seasonal collection (Christmas now): individual items, any quantity of each, one payment for the lot. Its name,
// items, prices and how many are left all come from Steward (set in the owner web app). Until the owner makes it
// public, everyone else sees "coming soon"; his preview pass shows the real shop with a banner.
export default function Collection({ userInfo, navigate }) {
  const [shop, setShop] = useState(null), [cart, setCart] = useState({}), [error, setError] = useState(null), [paying, setPaying] = useState(false);
  const [details, setDetails] = useState({ name: userInfo?.name || '', phone: '', email: '', house: '', street: '', landmark: '', city: 'Bengaluru', pincode: '', customer_type: 'home', business_name: '', gstin: '' });
  const [dq, setDq] = useState(null);
  const navRef = useRef(navigate); navRef.current = navigate;
  const load = () => { const pass = previewPass();
    return fetch('/api/collection', { cache: 'no-store', headers: pass ? { 'x-collection-preview': pass } : {} }).then(r => r.json()).then(setShop).catch(() => setShop({ items: [] })); };
  useEffect(() => { window.scrollTo(0, 0); load(); }, []);
  // The boss signing in (or out) with his WhatsApp number: the owner's view of the hidden collection appears (or goes).
  const acct = useAccount(); const boss = !!acct.profile?.is_owner;
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } load(); }, [acct.signedIn, boss]);
  useEffect(() => { const pin = details.pincode || ''; if (!/^[0-9]{6}$/.test(pin)) { setDq(null); return; } let live = true;
    fetch(`/api/delivery-quote?pincode=${pin}`, { cache: 'no-store' }).then(r => r.json()).then(q => { if (live) setDq({ ...q, pin }); }).catch(() => live && setDq({ found: false, pin }));
    return () => { live = false; }; }, [details.pincode]);

  if (shop === null) return <Shell navigate={navigate}><p className="text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p></Shell>;
  const items = shop.items || [];
  if (!items.length) return <Hampers userInfo={userInfo} navigate={navigate} />;   // not public yet: "coming soon"

  const c = shop.collection || {};
  const update = (k, v) => setDetails(d => ({ ...d, [k]: v }));
  const qty = id => cart[id] || 0;
  const setQty = (it, n) => setCart(x => ({ ...x, [it.product_id]: Math.max(0, Math.min(it.available, n)) }));
  const lines = items.filter(it => qty(it.product_id) > 0).map(it => ({ ...it, quantity: qty(it.product_id) }));
  const goods = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const pinOk = /^[0-9]{6}$/.test(details.pincode || '');
  const beyond = !!(dq && dq.found && !dq.local) || !!(dq && !dq.found && pinOk);
  const fee = shop.free_delivery ? 0 : (!pinOk || !dq || !dq.found || !dq.local) ? null : Number(dq.own_delivery_fee) || 0;
  const feeGst = fee ? Math.round(fee * 0.18 * 100) / 100 : 0;
  const total = goods + (fee || 0) + feeGst;
  const valid = lines.length > 0 && detailsComplete(details) && pinOk && !beyond && (shop.free_delivery || fee !== null);

  const pay = async () => {
    if (paying || !valid) return; setPaying(true); setError(null);
    if (!await loadRazorpay()) { setError('Could not load the payment gateway. Please try again.'); setPaying(false); return; }
    try {
      const pass = previewPass();
      const r = await fetch('/api/collection-orders', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(pass ? { 'x-collection-preview': pass } : {}) },
        body: JSON.stringify({ items: lines.map(l => ({ product_id: l.product_id, quantity: l.quantity })), customer: { ...details, address: composeAddress(details), gstin: details.customer_type === 'business' ? details.gstin : '' } }) });
      const order = await r.json();
      if (!r.ok) { if (r.status === 409) load(); throw new Error(order.error || 'Could not create the order'); }
      if (!order.razorpay_order_id || !order.razorpay_key_id) throw new Error('Online payment is temporarily unavailable. Please message us on WhatsApp at +91 97426 68951.');
      const what = lines.map(l => `${l.name} × ${l.quantity}`).join(', ');
      const rzp = new window.Razorpay({
        key: order.razorpay_key_id, amount: Math.round(order.total_amount * 100), currency: 'INR', name: 'Estate Tea',
        description: `${order.estate_order_number ? `Order ${order.estate_order_number} · ` : ''}${what}`.slice(0, 250), order_id: order.razorpay_order_id,
        prefill: { name: details.name, email: details.email, contact: details.phone }, theme: { color: '#D4AF37' },
        notes: { estate_tea_order_id: order.order_id, estate_order_number: order.estate_order_number || '' }, modal: { ondismiss: () => setPaying(false) },
        handler: async resp => {
          let v = {}; try { const vr = await fetch(`/api/website-orders/${encodeURIComponent(order.order_id)}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ razorpay_payment_id: resp.razorpay_payment_id }) }); v = await vr.json(); } catch {}
          navRef.current('payment-success', { items: lines.map(l => ({ product_name: l.name, variant: l.size || c.name, quantity: l.quantity, price: l.price })), total: order.total_amount, paymentId: resp.razorpay_payment_id, orderId: order.order_id, estateOrderNumber: order.estate_order_number || null, paymentVerified: Boolean(v.payment_verified), paymentStatus: v.status || v.payment_status || 'AWAITING_LEDGER_CONFIRMATION', customerEmail: details.email });
        },
      });
      rzp.on('payment.failed', e => { setPaying(false); navRef.current('payment-failed', { reason: e?.error?.description || 'Payment was not completed.' }); });
      rzp.open();
    } catch (e) { setError(e.message || 'Could not start payment.'); setPaying(false); }
  };

  return <Shell navigate={navigate}>
    {shop.preview && <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/[.07] px-4 py-3 text-sm text-amber-200">
      <Eye className="w-4 h-4 mt-0.5 shrink-0" /><span><b>Preview, not public yet.</b> Only you can see this page. Customers still see "coming soon" until you switch the collection to public in the web app.</span></div>}
    <p className="text-[11px] uppercase tracking-[.35em] text-[#D4AF37]">{c.slug === 'christmas' ? 'Christmas' : 'Collection'}</p>
    <h1 className="mt-3 text-3xl sm:text-4xl font-light">{c.name}</h1>
    {c.tagline && <p className="mt-2 text-gray-400">{c.tagline}</p>}
    {shop.free_delivery && <p className="mt-4 inline-block rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/[.07] px-3 py-1 text-xs text-[#f0d58b]">Free delivery in Bangalore for a limited time</p>}
    <div className="mt-8 grid lg:grid-cols-5 gap-8">
      <section className="lg:col-span-3 space-y-6">
        <div className="grid sm:grid-cols-2 gap-5">
          {items.map(it => <div key={it.product_id} className="card-surface rounded-2xl border border-[#D4AF37]/15 overflow-hidden flex flex-col">
            <div className="h-64 sm:h-72 bg-gradient-to-b from-[#16120a] to-[#0a0a0a] flex items-center justify-center p-6 overflow-hidden">
              {it.image ? <img src={it.image} alt={it.label} loading="lazy" className="h-full w-auto max-w-full object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,.6)]" />
                : <ShoppingBag className="w-12 h-12 text-[#D4AF37]/40" />}
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h2 className="text-lg text-gray-100">{it.name}</h2>
              {it.size && <p className="text-xs text-gray-500">{it.size}</p>}
              {it.description && <p className="mt-2 text-sm leading-relaxed text-gray-400">{it.description}</p>}
              <div className="mt-auto pt-4 flex items-end justify-between gap-3">
                <div><p className="text-xl gold-text">{inr(it.price)}</p><p className="text-[11px] text-gray-500">GST included</p></div>
                {it.sold_out ? <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400">Sold out</span>
                  : qty(it.product_id) === 0 ? <button onClick={() => setQty(it, 1)} className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm text-black">Add</button>
                  : <div className="flex items-center gap-2" aria-label={`How many ${it.name}`}>
                      <button onClick={() => setQty(it, qty(it.product_id) - 1)} className="h-9 w-9 rounded-lg border border-white/15 flex items-center justify-center" aria-label="One less"><Minus className="w-4 h-4" /></button>
                      <input value={qty(it.product_id)} inputMode="numeric" onChange={e => setQty(it, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)} className="w-12 rounded-lg bg-black/40 border border-white/10 py-1.5 text-center text-white" />
                      <button onClick={() => setQty(it, qty(it.product_id) + 1)} disabled={qty(it.product_id) >= it.available} className="h-9 w-9 rounded-lg border border-white/15 flex items-center justify-center disabled:opacity-30" aria-label="One more"><Plus className="w-4 h-4" /></button>
                    </div>}
              </div>
              {!it.sold_out && it.few_left && <p className="mt-2 text-xs text-amber-300">Only {it.available} left</p>}
              {!it.sold_out && qty(it.product_id) > 0 && qty(it.product_id) >= it.available && it.available < 999 && <p className="mt-2 text-xs text-amber-300">That's all we have left right now.</p>}
            </div>
          </div>)}
        </div>
        {lines.length > 0 && <div className="card-surface rounded-2xl p-6"><h2 className="text-xl gold-text mb-5">Delivery details</h2><CustomerDeliveryFields details={details} update={update} />
          <p className="mt-3 text-xs text-gray-500">Delivered by us within Bangalore (up to about 10 km). For other addresses, message us on WhatsApp at +91 97426 68951.</p></div>}
      </section>
      <aside className="lg:col-span-2"><div className="card-surface rounded-2xl p-6 lg:sticky lg:top-24">
        <h2 className="text-xl gold-text mb-5">Your order</h2>
        {!lines.length && <p className="text-sm text-gray-500">Add as many of each as you like.</p>}
        {lines.map(l => <div key={l.product_id} className="flex justify-between gap-3 text-sm py-2 border-b border-white/10"><span className="text-gray-400">{l.name}{l.size ? `, ${l.size}` : ''} × {l.quantity}</span><span>{inr(l.price * l.quantity)}</span></div>)}
        {lines.length > 0 && <>
          <div className="flex justify-between text-sm py-2 border-b border-white/10"><span className="text-gray-400">Delivery{feeGst ? ' (+ GST)' : ''}</span>
            <span>{shop.free_delivery ? 'Free' : beyond ? 'Message us' : fee === null ? (pinOk ? 'Checking…' : 'Enter your PIN') : fee === 0 ? 'Free' : inr(fee + feeGst)}</span></div>
          <div className="flex justify-between mt-4 text-xl"><span>Total</span><span className="gold-text">{inr(total)}</span></div>
          <p className="mt-1 text-xs text-gray-500">GST included.</p>
          {beyond && <p className="mt-3 text-xs text-amber-200">This address is beyond our own delivery area. Please message us on WhatsApp at +91 97426 68951 and we'll arrange it.</p>}
          {error && <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-4 h-4 text-red-400 shrink-0" /><p className="text-xs text-red-300">{error}</p></div>}
          <button onClick={pay} disabled={!valid || paying} className="mt-5 w-full bg-[#D4AF37] disabled:opacity-40 text-black uppercase tracking-[.2em] py-4 rounded-lg flex justify-center gap-3">{paying && <Loader2 className="w-5 h-5 animate-spin" />}{paying ? 'Preparing payment…' : `Pay · ${inr(total)}`}</button>
          {!valid && !paying && <p className="mt-2 text-xs text-gray-500 text-center">{detailsComplete(details) ? 'Check your PIN code.' : 'Fill in your delivery details to pay.'}</p>}
          <p className="text-xs text-gray-500 text-center mt-3">Secured by Razorpay</p>
        </>}
      </div></aside>
    </div>
  </Shell>;
}

function Shell({ navigate, children }) {
  return <div className="min-h-screen bg-[#0a0a0a] text-white">
    <header className="glass-surface sticky top-0 z-40 border-b border-white/10"><div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between"><h2 className="text-2xl font-light gold-text">Estate Tea</h2><AccountButton /></div></header>
    <main className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => navigate('store')} className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] mb-8"><ArrowLeft className="w-5 h-5" />Back to the shop</button>
      {children}
    </main>
  </div>;
}
