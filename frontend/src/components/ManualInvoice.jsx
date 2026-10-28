import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Same retail packs and prices as the store and Steward.
const PACKS = [
  { id: '250g', label: '250 g', price: 180, kg: 0.25 },
  { id: '500g', label: '500 g', price: 360, kg: 0.5 },
  { id: '1kg', label: '1 kg', price: 720, kg: 1 },
  // Temporary: a ₹1 owner test that runs the whole flow without counting as a sale.
  { id: 'test', label: 'Test (₹1, no GST)', price: 1, kg: 0, test: true },
];
const GST_RATE = 0.05;
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const OWN_DELIVERY_FEE = 10; // Steward has the final say; this is for the preview
const rupees = v => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function statusLabel(row) {
  if (row.status === 'CANCELLED') return ['Cancelled', 'text-gray-500'];
  if (!row.payment_verified) return ['Invoice sent · awaiting payment', 'text-amber-400'];
  if (row.confirmation_email === 'sent') return ['Paid · confirmation emailed', 'text-emerald-400'];
  return ['Paid · confirmation sending', 'text-emerald-400'];
}

// Owner sends a Razorpay invoice (email + SMS). It becomes a normal "manual" order with an ET number.
export function ManualInvoice({ headers }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', delivery_address: '', pincode: '', delivery_method: '', courier_fee: '', product_id: '250g', quantity: 1, customer_type: 'home', business_name: '', gstin: '' });
  // Steward's distance check for the PIN: which delivery options apply.
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState([]);
  const [stock, setStock] = useState(null);
  // Set when Steward says this invoice is over stock; the owner can still send it.
  const [stockWarning, setStockWarning] = useState(null);
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  // The panel rebuilds `headers` every render; follow the login token so the list doesn't reload in a loop.
  const headersRef = useRef(headers);
  headersRef.current = headers;
  const auth = headers?.Authorization;

  const pack = PACKS.find(p => p.id === form.product_id) || PACKS[0];
  const qty = pack.test ? 1 : Math.max(1, Math.floor(Number(form.quantity) || 1));
  const teaTotal = pack.price * qty;
  const ownFee = quote?.own_delivery_fee ?? OWN_DELIVERY_FEE;
  const deliveryFee = form.delivery_method === 'own_delivery' ? ownFee : form.delivery_method === 'third_party_courier' ? Math.max(0, Number(form.courier_fee) || 0) : 0;
  // Delivery is charged with the tea, so GST applies to both.
  const subtotal = teaTotal + deliveryFee;
  const gst = pack.test ? 0 : Math.round(subtotal * GST_RATE * 100) / 100;
  const total = subtotal + gst;
  const needKg = Math.round(pack.kg * qty * 1000) / 1000;
  // 'ok' | 'reserve' (tea is there but inside the protected reserve) | 'shortfall' (not enough tea at all)
  const stockLevel = !stock || pack.test || needKg <= stock.sellable ? 'ok' : needKg <= stock.onHand ? 'reserve' : 'shortfall';

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/manual-invoices', { headers: headersRef.current, cache: 'no-store' });
      if (r.ok) setSent(await r.json());
      const inv = await fetch('/api/admin/inventory', { headers: headersRef.current, cache: 'no-store' });
      if (inv.ok) {
        const body = await inv.json();
        if (Number.isFinite(Number(body.sellable_kg))) setStock({
          sellable: Number(body.sellable_kg),
          reserve: Number(body.protected_reserve_kg || 0),
          // On hand after open orders, protected reserve included.
          onHand: Math.max(0, Math.round((Number(body.physical_kg || 0) - Number(body.committed_kg || 0)) * 1000) / 1000),
        });
      }
    } catch { /* keep the last list */ }
  }, [auth]);
  // Payments arrive from the customer's phone, so keep the list fresh while this is open.
  useEffect(() => { load(); const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 30000); return () => clearInterval(t); }, [load]);

  const send = async (overrideStock = false) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error('Enter the customer\'s email address');
    if (form.delivery_method === 'third_party_courier' && !(Number(form.courier_fee) > 0)) return toast.error('Enter what the courier will cost');
    if (form.customer_type === 'business' && !form.business_name.trim()) return toast.error('Enter the business name');
    if (form.customer_type === 'business' && !GSTIN.test(form.gstin)) return toast.error('A business invoice needs a valid 15-character GSTIN');
    setBusy(true);
    try {
      const r = await fetch('/api/admin/manual-invoices', { method: 'POST', headers: headersRef.current, body: JSON.stringify({ ...form, quantity: qty, override_stock: overrideStock }) });
      const data = await r.json().catch(() => ({}));
      if (r.status === 409 && data.code === 'stock_warning') { setStockWarning(data); return; }
      if (!r.ok) throw new Error(data.error || 'Could not send the invoice');
      setStockWarning(null);
      if (overrideStock) toast.warning(stockLevel === 'shortfall'
        ? `Sent: ${data.estate_order_number} needs more tea than is in stock. Restock and update Inventory before fulfilling it.`
        : `Sent: ${data.estate_order_number} uses tea from your protected reserve.`);
      toast.success(`Invoice ${data.estate_order_number} sent to ${data.email}${data.phone ? ' and ' + data.phone : ''}`);
      setForm(f => ({ ...f, name: '', email: '', phone: '', delivery_address: '', pincode: '', delivery_method: '', courier_fee: '', quantity: 1, customer_type: 'home', business_name: '', gstin: '' }));
      load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  // Measure the distance once a full PIN is typed, and pick the delivery that applies.
  useEffect(() => {
    const pin = form.pincode.replace(/\D/g, '');
    if (pin.length !== 6) { setQuote(null); return; }
    let live = true;
    setQuote({ loading: true });
    fetch(`/api/admin/delivery-quote?pincode=${pin}`, { headers: headersRef.current, cache: 'no-store' })
      .then(r => r.json()).then(q => {
        if (!live) return;
        setQuote(q);
        if (q.found) setForm(f => ({ ...f, delivery_method: q.local ? 'own_delivery' : 'third_party_courier' }));
      }).catch(() => live && setQuote({ found: false, message: "Couldn't measure the distance, so choose the delivery yourself.", own_delivery_allowed: true, courier_allowed: true }));
    return () => { live = false; };
  }, [form.pincode]);
  const ownAllowed = !quote || quote.loading || quote.own_delivery_allowed !== false;
  const courierAllowed = !quote?.found || quote.courier_allowed;

  // A new pack or quantity needs a fresh check.
  useEffect(() => { setStockWarning(null); }, [form.product_id, qty]);

  const input = 'w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#d7a84b]/40';
  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <h2 className="text-xl text-[#efbd63]">Send an invoice</h2>
    <p className="text-xs text-gray-500 mt-1">Razorpay emails and texts the customer a payment link. Ledger gives it an ET order number, and once it's paid the customer gets Estate Tea's confirmation with a tracking link.</p>
    <div className="mt-4 grid grid-cols-2 gap-2">
      {[['home', 'Home'], ['business', 'Business']].map(([value, label]) =>
        <button key={value} type="button" onClick={() => set('customer_type', value)}
          className={`rounded-2xl border px-2 py-2.5 text-xs ${form.customer_type === value ? 'border-[#D4AF37]/70 bg-[#D4AF37]/10 text-[#f1dc9c]' : 'border-white/10 text-gray-400'}`}>{label}</button>)}
    </div>
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {form.customer_type === 'business' && <>
        <input value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Business name (on the tax invoice)" className={input} />
        <div>
          <input value={form.gstin} onChange={e => set('gstin', e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 15))} placeholder="GSTIN (required)" className={`${input} font-mono ${form.gstin && !GSTIN.test(form.gstin) ? 'border-amber-500/60' : ''}`} />
          {form.gstin && !GSTIN.test(form.gstin) && <p className="mt-1 px-1 text-[11px] text-amber-400">GSTIN is 15 characters, like 29AAGCB7383J1Z4.</p>}
        </div>
      </>}
      <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={form.customer_type === 'business' ? 'Contact person' : 'Customer name'} className={input} />
      <input value={form.email} onChange={e => set('email', e.target.value)} type="email" placeholder="Email address" className={input} />
      <input value={form.phone} onChange={e => set('phone', e.target.value)} inputMode="tel" placeholder="Mobile number (for SMS)" className={input} />
      <textarea value={form.delivery_address} onChange={e => set('delivery_address', e.target.value)} rows={2} placeholder="Delivery address (printed on the bill)" className={`${input} sm:col-span-2 resize-none`} />
      <input value={form.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="PIN code" className={input} />
      <p className={`self-center text-xs ${quote?.found === false ? 'text-amber-400' : 'text-gray-400'}`}>{quote?.loading ? 'Measuring the distance…' : quote?.message || 'Type the PIN to measure the distance.'}</p>
    </div>
    <div className="mt-2">
      <p className="text-[11px] text-gray-500">Delivery</p>
      <div className="mt-1 grid grid-cols-3 gap-2">
        {[['own_delivery', `Estate Tea · ${rupees(ownFee)}`, ownAllowed], ['third_party_courier', 'Courier', courierAllowed], ['', 'No charge', true]].filter(o => o[2]).map(([value, label]) =>
          <button key={value || 'none'} type="button" onClick={() => set('delivery_method', value)}
            className={`rounded-2xl border px-2 py-2.5 text-xs ${form.delivery_method === value ? 'border-[#D4AF37]/70 bg-[#D4AF37]/10 text-[#f1dc9c]' : 'border-white/10 text-gray-400'}`}>{label}</button>)}
      </div>
      {form.delivery_method === 'third_party_courier' && <input value={form.courier_fee} onChange={e => set('courier_fee', e.target.value)} type="number" min="1" inputMode="decimal" placeholder="What the courier will cost (₹)" className={`${input} mt-2`} />}
    </div>
    <div className="mt-2 grid grid-cols-[1fr_6.5rem] gap-2">
      <label className="text-[11px] text-gray-500">Packet size
        <select value={form.product_id} onChange={e => set('product_id', e.target.value)} className={`${input} mt-1`}>
          {PACKS.map(p => <option key={p.id} value={p.id} className="bg-[#111]">{p.label} · {rupees(p.price)}</option>)}
        </select>
      </label>
      <label className="text-[11px] text-gray-500">Quantity
 <input value={pack.test ? 1 : form.quantity} disabled={pack.test} onChange={e => set('quantity', e.target.value)} type="number" min="1" max="500" inputMode="numeric" className={`${input} mt-1`} />
      </label>
    </div>
    <div className="mt-3 rounded-2xl border border-white/[.07] p-4 text-xs text-gray-400 space-y-1">
      <div className="flex justify-between"><span>{pack.label} × {qty}</span><span>{rupees(teaTotal)}</span></div>
      {deliveryFee > 0 && <div className="flex justify-between"><span>Delivery ({form.delivery_method === 'own_delivery' ? 'Estate Tea' : 'courier'})</span><span>{rupees(deliveryFee)}</span></div>}
      <div className="flex justify-between"><span>GST (5%)</span><span>{rupees(gst)}</span></div>
      <div className="flex justify-between text-sm text-white"><span>Total</span><span className="text-[#efbd63]">{rupees(total)}</span></div>
    </div>
    {stock && <p className={`mt-2 text-xs ${stockLevel === 'shortfall' ? 'text-red-400' : stockLevel === 'reserve' ? 'text-amber-400' : 'text-gray-500'}`}>
      Available to sell: {stock.sellable} kg (+ {stock.reserve} kg protected reserve) · this invoice needs {needKg} kg
      {stockLevel === 'reserve' && ' — dips into your protected reserve'}
      {stockLevel === 'shortfall' && ` — more than the ${stock.onHand} kg in stock`}
    </p>}
    {stockWarning ? <div className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
      <p className="text-sm text-amber-300">{stockWarning.kind === 'reserve' ? 'Protected reserve' : 'Not enough stock'}</p>
      <p className="text-xs text-amber-200/80 mt-1">{stockWarning.message}</p>
      <p className="text-xs text-gray-400 mt-1">Agents and the website are stopped here. You can still send it; it's noted in the activity log.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => setStockWarning(null)} disabled={busy} className="rounded-2xl border border-white/10 py-2.5 text-sm text-gray-300">Cancel</button>
        <button onClick={() => send(true)} disabled={busy} className="rounded-2xl bg-amber-500 text-black py-2.5 text-sm font-medium disabled:opacity-50">{busy ? 'Sending…' : 'Send anyway'}</button>
      </div>
    </div> : <button onClick={() => send(false)} disabled={busy || !form.email} className="mt-3 w-full rounded-2xl bg-gradient-to-r from-[#c9983c] to-[#efc66d] text-black py-3 text-sm font-medium disabled:opacity-50">{busy ? 'Sending…' : `Send invoice for ${rupees(total)}`}</button>}
    {sent.length > 0 && <div className="mt-5">
      <p className="text-xs uppercase tracking-[.14em] text-gray-500">Sent invoices</p>
      <div className="mt-2 divide-y divide-white/[.06] rounded-2xl border border-white/[.07]">
        {sent.slice(0, 10).map(row => {
          const [label, tone] = statusLabel(row);
          const item = (row.items || [])[0] || {};
          return <div key={row.order_id} className="p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{row.is_test && <span className="mr-1.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-400">TEST</span>}{row.business_name || row.customer_name || row.email} <span className="text-gray-500 font-mono">· {row.estate_order_number || '—'}</span></p>
              <p className="text-xs text-gray-500 mt-0.5">{row.gstin && <span className="font-mono">GSTIN {row.gstin} · </span>}{item.weight} × {item.quantity} · {rupees(row.total_amount)}{row.invoice_url && <> · <a href={row.invoice_url} target="_blank" rel="noreferrer" className="text-[#d7a84b]">invoice link</a></>}{row.qr_image_url && row.status === 'AWAITING_PAYMENT' && <> · <a href={row.qr_image_url} target="_blank" rel="noreferrer" className="text-[#d7a84b]">scan-to-pay QR</a></>}</p>
            </div>
            <p className={`text-[11px] text-right shrink-0 ${tone}`}>{label}</p>
          </div>;
        })}
      </div>
    </div>}
  </div>;
}
