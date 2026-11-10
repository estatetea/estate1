'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, AlertTriangle, Gift, MessageCircle } from 'lucide-react';
import CustomerDeliveryFields, { composeAddress, detailsComplete } from './CustomerDeliveryFields';

const WA = 'https://wa.me/919742668951?text=';
const loadRazorpay = () => new Promise(res => { if (window.Razorpay) return res(true); const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = () => res(true); s.onerror = () => res(false); document.body.appendChild(s); });
const nice = iso => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : '';
const inr = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// The hampers page: Estate Noel Collection (and later the Signature hamper). Everything about dates and price comes
// from Steward, so the website, Brew and invoices always agree.
export default function Hampers({ userInfo, navigate }) {
  const [hampers, setHampers] = useState(null), [error, setError] = useState(null), [paying, setPaying] = useState(false);
  const [qty, setQty] = useState(1), [day, setDay] = useState(''), [note, setNote] = useState('');
  const [details, setDetails] = useState({ name: userInfo?.name || '', phone: '', email: '', house: '', street: '', landmark: '', city: 'Bengaluru', pincode: '', customer_type: 'home', business_name: '', gstin: '' });
  const navRef = useRef(navigate); navRef.current = navigate;
  useEffect(() => { window.scrollTo(0, 0); fetch('/api/hampers', { cache: 'no-store' }).then(r => r.json()).then(d => setHampers(d.hampers || [])).catch(() => setHampers([])); }, []);
  const update = (k, v) => setDetails(d => ({ ...d, [k]: v }));
  // Delivery: charged like tea (free in 560077 or for more than 500 g of tea, otherwise ₹10-25 by distance), plus GST at the hamper's rate.
  const [dq, setDq] = useState(null);
  useEffect(() => { const pin = details.pincode || ''; if (!/^[0-9]{6}$/.test(pin)) { setDq(null); return; } let live = true;
    fetch(`/api/delivery-quote?pincode=${pin}`, { cache: 'no-store' }).then(r => r.json()).then(q => { if (live) setDq({ ...q, pin }); }).catch(() => live && setDq({ found: false, pin }));
    return () => { live = false; }; }, [details.pincode]);
  const h = (hampers || [])[0], st = h?.status || {};
  const preorder = st.phase === 'preorder', open = st.can_order;
  const needDay = open && !preorder;
  const pinOk = /^[0-9]{6}$/.test(details.pincode || '');
  const beyond = !!(dq && dq.found && !dq.local);
  const fee = !pinOk || !dq ? null : (details.pincode === '560077' || qty * 0.25 > 0.5 + 1e-9) ? 0 : dq.found ? (dq.local ? Number(dq.own_delivery_fee) || 0 : null) : 25;
  const feeGst = fee ? Math.round(fee * 0.18 * 100) / 100 : 0;
  const total = h ? h.price * qty + (fee || 0) + feeGst : 0;
  const valid = () => open && detailsComplete(details) && (!needDay || day) && fee !== null && !beyond;

  const pay = async () => {
    if (paying || !valid()) return; setPaying(true); setError(null);
    if (!await loadRazorpay()) { setError('Could not load the payment gateway. Please try again.'); setPaying(false); return; }
    try {
      const r = await fetch('/api/hamper-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: h.product_id, quantity: qty, delivery_date: day, message: note, customer: { ...details, address: composeAddress(details), gstin: details.customer_type === 'business' ? details.gstin : '' } }) });
      const order = await r.json();
      if (!r.ok) throw new Error(order.detail || order.error || 'Could not create the order');
      if (!order.razorpay_order_id || !order.razorpay_key_id) throw new Error('Online payment is temporarily unavailable. Please message us on WhatsApp.');
      const rzp = new window.Razorpay({
        key: order.razorpay_key_id, amount: Math.round(order.total_amount * 100), currency: 'INR', name: 'Estate Tea',
        description: `${order.estate_order_number ? `Order ${order.estate_order_number} · ` : ''}${h.name} hamper × ${qty}`, order_id: order.razorpay_order_id,
        prefill: { name: details.name, email: details.email, contact: details.phone }, theme: { color: '#D4AF37' },
        notes: { estate_tea_order_id: order.order_id, estate_order_number: order.estate_order_number || '' }, modal: { ondismiss: () => setPaying(false) },
        handler: async resp => {
          let v = {}; try { const vr = await fetch(`/api/website-orders/${encodeURIComponent(order.order_id)}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ razorpay_payment_id: resp.razorpay_payment_id }) }); v = await vr.json(); } catch {}
          navRef.current('payment-success', { items: [{ product_name: `${h.name} hamper`, variant: 'Hamper', quantity: qty, price: h.price }], total: order.total_amount, paymentId: resp.razorpay_payment_id, orderId: order.order_id, estateOrderNumber: order.estate_order_number || null, paymentVerified: Boolean(v.payment_verified), paymentStatus: v.status || v.payment_status || 'AWAITING_LEDGER_CONFIRMATION', customerEmail: details.email });
        },
      });
      rzp.on('payment.failed', e => { setPaying(false); navRef.current('payment-failed', { reason: e?.error?.description || 'Payment was not completed.' }); });
      rzp.open();
    } catch (e) { setError(e.message || 'Could not start payment.'); setPaying(false); }
  };

  const brewText = encodeURIComponent(`Hi Brew! I'd like to ${preorder ? 'pre-order' : 'order'} the ${h?.name || 'Estate Noel'} hamper.`);
  return <div className="min-h-screen bg-[#0a0a0a] text-white">
    <header className="glass-surface sticky top-0 z-40 border-b border-white/10"><div className="max-w-6xl mx-auto px-4 py-4"><h2 className="text-2xl font-light gold-text">Estate Tea</h2></div></header>
    <main className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => navigate('store')} className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] mb-8"><ArrowLeft className="w-5 h-5" />Back to the shop</button>
      {hampers === null && <p className="text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading hampers…</p>}
      {hampers && !h && <p className="text-gray-400">Our hampers will be back soon.</p>}
      {h && <div className="grid lg:grid-cols-5 gap-8">
        <section className="lg:col-span-3 space-y-6">
          <div className="card-surface rounded-2xl p-6 sm:p-8 border border-[#D4AF37]/20 overflow-hidden">
            {h.product_id === 'hamper-noel' && <img src="/images/estate-noel-box.jpg" alt="The Estate NÖEL Collection gift box, Christmas in a box" width="1600" height="1200"
              className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 block w-[calc(100%+3rem)] sm:w-[calc(100%+4rem)] max-w-none aspect-[4/3] object-cover" />}
            <p className="text-[11px] uppercase tracking-[.35em] text-[#D4AF37]">{h.season} hamper</p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-light">{h.name}</h1>
            <p className="mt-2 text-gray-400">A gift box for the Christmas season.</p>
            {h.contents?.length ? <ul className="mt-6 space-y-2">{h.contents.map(c => <li key={c} className="flex gap-3 text-gray-200"><Gift className="w-4 h-4 mt-1 text-[#D4AF37] shrink-0" />{c}</li>)}</ul>
              : <p className="mt-6 flex items-center gap-3 text-gray-300"><Gift className="w-4 h-4 text-[#D4AF37] shrink-0" /><span>What's inside is a little surprise for now. <span className="text-[#D4AF37]">Revealed soon.</span></span></p>}
            <div className="mt-7 flex flex-wrap items-end gap-x-6 gap-y-2"><p className="text-3xl gold-text">{inr(h.price)}</p><p className="text-sm text-gray-400 pb-1">GST included · delivery extra, like our tea (₹10–25 in Bangalore)</p></div>
            <p className={`mt-5 rounded-xl px-4 py-3 text-sm ${open ? 'border border-[#D4AF37]/25 bg-[#D4AF37]/[.06] text-[#f0d58b]' : 'border border-white/10 bg-white/[.03] text-gray-300'}`}>{st.message}</p>
            {preorder && <a href={WA + brewText} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/90 px-4 py-3 text-sm font-medium text-black hover:bg-[#25D366]"><MessageCircle className="w-4 h-4" />Pre-order with Brew on WhatsApp and get {st.brew_discount_pct || 10}% off ({inr(h.price * (1 - (st.brew_discount_pct || 10) / 100))})</a>}
            {!open && st.phase === 'soon' && <a href={WA + encodeURIComponent('Hi Brew! Please let me know when the Estate Noel hamper pre-orders open.')} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:underline"><MessageCircle className="w-4 h-4" />Ask Brew to remind you</a>}
            {h.product_id === 'hamper-noel' && <img src="/images/estate-noel-inside.jpg" alt="Inside the Estate NÖEL Collection gift box" width="1600" height="1234" loading="lazy"
              className="mt-7 block w-full rounded-xl aspect-[4/3] object-cover" />}
          </div>
          {open && <div className="card-surface rounded-2xl p-6">
            <h2 className="text-xl gold-text mb-5">Your hamper</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block"><span className="text-xs uppercase tracking-widest text-gray-400">How many</span>
                <div className="mt-2 flex items-center gap-3"><button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="h-10 w-10 rounded-lg border border-white/15">−</button><span className="w-8 text-center text-lg">{qty}</span><button type="button" onClick={() => setQty(q => Math.min(20, q + 1))} className="h-10 w-10 rounded-lg border border-white/15">+</button></div></label>
              <label className="block"><span className="text-xs uppercase tracking-widest text-gray-400">Delivery day{preorder ? ' (optional)' : ''}</span>
                <input type="date" value={day} min={st.deliver_from} max={st.deliver_to} onChange={e => setDay(e.target.value)} className="mt-2 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white [color-scheme:dark]" />
                <span className="mt-1 block text-xs text-gray-500">{preorder ? `${nice(st.deliver_from)}, or pick a later day (up to ${nice(st.deliver_to)}). Leave it blank for ${nice(st.deliver_from)}.` : `${nice(st.deliver_from)} or any later day, up to ${nice(st.deliver_to)}.`}</span></label>
            </div>
            <label className="mt-5 block"><span className="text-xs uppercase tracking-widest text-gray-400">Message for the card</span>
              <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 300))} rows={3} placeholder="Merry Christmas, with love from…" className="mt-2 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white placeholder:text-gray-600" /></label>
          </div>}
          {open && <div className="card-surface rounded-2xl p-6"><h2 className="text-xl gold-text mb-5">Delivery details</h2><CustomerDeliveryFields details={details} update={update} />
            <p className="mt-3 text-xs text-gray-500">Hampers are delivered by us within Bangalore (up to about 10 km). For other addresses, message us on WhatsApp.</p></div>}
        </section>
        <aside className="lg:col-span-2">{open && <div className="card-surface rounded-2xl p-6 sticky top-24">
          <h2 className="text-xl gold-text mb-5">Order</h2>
          <div className="flex justify-between text-sm py-2 border-b border-white/10"><span className="text-gray-400">{h.name} × {qty}</span><span>{inr(h.price * qty)}</span></div>
          <div className="flex justify-between text-sm py-2 border-b border-white/10"><span className="text-gray-400">Delivery{feeGst ? ' (+ GST)' : ''}</span><span>{beyond ? 'Message us' : fee === null ? (pinOk ? 'Checking…' : 'Enter your PIN') : fee === 0 ? 'Free' : `₹${(fee + feeGst).toFixed(2)}`}</span></div>
          <div className="flex justify-between mt-4 text-xl"><span>Total</span><span className="gold-text">{Number.isInteger(total) ? inr(total) : `₹${total.toFixed(2)}`}</span></div>
          <p className="mt-1 text-xs text-gray-500">GST included.</p>
          {beyond && <p className="mt-3 text-xs text-amber-200">This address is beyond our own delivery area. Please message us on WhatsApp at +91 97426 68951 and we'll arrange it.</p>}
          {error && <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex gap-2"><AlertTriangle className="w-4 h-4 text-red-400 shrink-0" /><p className="text-xs text-red-300">{error}</p></div>}
          <button onClick={pay} disabled={!valid() || paying} className="mt-5 w-full bg-[#D4AF37] disabled:opacity-40 text-black uppercase tracking-[.2em] py-4 rounded-lg flex justify-center gap-3">{paying && <Loader2 className="w-5 h-5 animate-spin" />}{paying ? 'Preparing payment…' : `${preorder ? 'Pre-order' : 'Order'} · ${Number.isInteger(total) ? inr(total) : '₹' + total.toFixed(2)}`}</button>
          <p className="text-xs text-gray-500 text-center mt-3">Secured by Razorpay</p>
        </div>}</aside>
      </div>}
    </main>
  </div>;
}
