import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { WhyInfo } from './WhyInfo';

// Same retail packs and prices as the store and Steward.
const PACKS = [
  { id: '250g', label: '250 g', price: 180, kg: 0.25 },
  { id: '500g', label: '500 g', price: 360, kg: 0.5 },
  { id: '1kg', label: '1 kg', price: 720, kg: 1 },
  // Christmas items: the price includes GST (split at the item's own rate on the invoice); delivery is added on top.
  { id: 'christmas-spirit', label: 'Christmas Spirit 375 ml', price: 190, kg: 0, inclusive: true, gstRate: 0.18 },
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
  const [form, setForm] = useState({ name: '', email: '', phone: '', delivery_address: '', pincode: '', delivery_method: '', courier_fee: '', customer_type: 'home', business_name: '', gstin: '', gst_enabled: true });
  // What's on the invoice: any number of lines (tea packs, Christmas Spirit), each with its own quantity.
  const [lines, setLines] = useState([{ id: '250g', qty: 1 }]);
  // The owner's own amount (the total to charge, GST included); empty = shop prices.
  const [ownAmount, setOwnAmount] = useState('');
  // ...or a price per kg for the tea (e.g. Prem at ₹420 a kg): the total is worked out from it.
  const [priceMode, setPriceMode] = useState('total');
  const [ownRate, setOwnRate] = useState('');
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

  const packOf = id => PACKS.find(p => p.id === id) || PACKS[0];
  const isTest = lines.some(l => l.id === 'test');
  const qtyOf = l => isTest ? 1 : Math.max(1, Math.floor(Number(l.qty) || 1));
  // The same item on two lines counts once, added up.
  const merged = Object.values(lines.reduce((m, l) => { const q = qtyOf(l); m[l.id] = { id: l.id, qty: (m[l.id]?.qty || 0) + q }; return m; }, {}));
  const teaRows = merged.filter(l => !packOf(l.id).inclusive && !packOf(l.id).test);
  const drinkRow = merged.find(l => packOf(l.id).inclusive);
  const pack = packOf(merged[0]?.id);   // the first item (for the test invoice and older wording)
  const qty = merged[0] ? merged[0].qty : 1;
  const teaTotal = teaRows.reduce((s, l) => s + packOf(l.id).price * l.qty, 0);
  const drinkPack = drinkRow ? packOf(drinkRow.id) : null;
  const drinkTotal = drinkRow ? drinkPack.price * drinkRow.qty : 0;
  const testTotal = isTest ? 1 : 0;
  // Free delivery for more than 500 g within 10 km, and more than 750 g beyond (third-party; Estate Tea pays).
  const orderKg = isTest ? 0 : teaRows.reduce((s, l) => s + packOf(l.id).kg * l.qty, 0);
  const freeOwn = orderKg > 0.5 + 1e-9, freeFar = orderKg > 0.75 + 1e-9;
  const ownFee = freeOwn ? 0 : (quote?.own_delivery_fee ?? OWN_DELIVERY_FEE);
  const shopDeliveryFee = form.delivery_method === 'own_delivery' ? ownFee : form.delivery_method === 'third_party_courier' ? (freeFar ? 0 : Math.max(0, Number(form.courier_fee) || 0)) : 0;
  const rateTotal = Number(ownRate) > 0 && orderKg > 0 ? Math.round((orderKg * Number(ownRate) * (form.gst_enabled ? 1 + GST_RATE : 1) + drinkTotal) * 100) / 100 : 0;
  const agreed = isTest ? 0 : priceMode === 'kg' ? rateTotal : (Number(ownAmount) > 0 ? Math.round(Number(ownAmount) * 100) / 100 : 0);
  const deliveryFee = agreed ? 0 : shopDeliveryFee;   // your own amount includes delivery
  const round2 = v => Math.round(v * 100) / 100;
  // GST: tea and its delivery at 5%; Christmas Spirit's price already includes its 18% (delivery goes at 18% when it's the drink alone).
  const drinkGst = drinkRow && form.gst_enabled ? round2(drinkTotal - drinkTotal / (1 + drinkPack.gstRate)) : 0;
  const deliveryRate = teaRows.length ? GST_RATE : (drinkPack?.gstRate || GST_RATE);
  const teaGst = form.gst_enabled && !isTest ? round2((teaTotal + deliveryFee) * (teaRows.length || !drinkRow ? GST_RATE : 0) + (!teaRows.length && drinkRow ? deliveryFee * deliveryRate : 0)) : 0;
  const shopTotal = round2(isTest ? testTotal : teaTotal + drinkTotal + deliveryFee + teaGst);
  const gst = isTest ? 0 : round2(drinkGst + teaGst);
  const total = agreed || shopTotal;
  const subtotal = teaTotal + drinkTotal + deliveryFee;
  const needKg = Math.round(orderKg * 1000) / 1000;
  // 'ok' | 'reserve' (tea is there but inside the protected reserve) | 'shortfall' (not enough tea at all)
  const stockLevel = !stock || isTest || needKg <= stock.sellable ? 'ok' : needKg <= stock.onHand ? 'reserve' : 'shortfall';
  // What Steward gets: Christmas Spirit first when it's there (the tea rides along), else the first tea pack; 1 kg is two 500 g packs.
  const invoiceItems = () => {
    if (isTest) return { product_id: 'test', quantity: 1, extra_items: [] };
    const tea = teaRows.flatMap(l => l.id === '1kg' && (teaRows.length > 1 || drinkRow) ? [{ id: '500g', qty: l.qty * 2 }] : [l]);
    const teaMerged = Object.values(tea.reduce((m, l) => { m[l.id] = { id: l.id, qty: (m[l.id]?.qty || 0) + l.qty }; return m; }, {}));
    if (drinkRow) return { product_id: drinkRow.id, quantity: drinkRow.qty, extra_items: teaMerged.map(l => ({ product_id: l.id, quantity: l.qty })) };
    const [first, ...rest] = teaMerged;
    return { product_id: first.id, quantity: first.qty, extra_items: rest.map(l => ({ product_id: l.id, quantity: l.qty })) };
  };

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

  // What still stops the invoice, in plain words (shown under the button, never a silently greyed-out button).
  const missing = [
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) && 'the customer\'s email address',
    form.customer_type === 'business' && !form.business_name.trim() && 'the business name',
    form.gst_enabled && form.customer_type === 'business' && !GSTIN.test(form.gstin) && 'a valid GSTIN',
    form.delivery_method === 'third_party_courier' && !freeFar && !(Number(form.courier_fee) > 0) && 'the third-party delivery cost',
  ].filter(Boolean);
  const send = async (overrideStock = false) => {
    if (missing.length) return toast.error(`Please add ${missing.join(', ')}`);
    if (form.delivery_method === 'third_party_courier' && !freeFar && !(Number(form.courier_fee) > 0)) return toast.error('Enter what the third-party delivery service will cost');
    if (form.customer_type === 'business' && !form.business_name.trim()) return toast.error('Enter the business name');
    if (form.gst_enabled && form.customer_type === 'business' && !GSTIN.test(form.gstin)) return toast.error('With GST on, a business invoice needs a valid 15-character GSTIN');
    setBusy(true);
    try {
      if (!merged.length) { setBusy(false); return toast.error('Add at least one item'); }
      if (priceMode === 'total' && ownAmount && !(Number(ownAmount) > 0)) { setBusy(false); return toast.error('Enter the amount in rupees, or leave it empty for shop prices'); }
      if (priceMode === 'kg' && ownRate && !(Number(ownRate) > 0 && orderKg > 0)) { setBusy(false); return toast.error('Enter the price per kg, with at least one tea pack on the invoice'); }
      const r = await fetch('/api/admin/manual-invoices', { method: 'POST', headers: headersRef.current, body: JSON.stringify({ ...form, email: form.email.trim(), name: form.name.trim(), phone: form.phone.trim(), ...invoiceItems(), owner_total: agreed || 0, override_stock: overrideStock }) });
      const data = await r.json().catch(() => ({}));
      if (r.status === 409 && data.code === 'stock_warning') { setStockWarning(data); return; }
      if (!r.ok) throw new Error(data.error || 'Could not send the invoice');
      setStockWarning(null);
      if (overrideStock) toast.warning(stockLevel === 'shortfall'
        ? `Sent: ${data.estate_order_number} needs more tea than is in stock. Restock and update Inventory before fulfilling it.`
        : `Sent: ${data.estate_order_number} uses tea from your protected reserve.`);
      toast.success(`Invoice ${data.estate_order_number} sent to ${data.email}${data.phone ? ' and ' + data.phone : ''}`);
      setForm(f => ({ ...f, name: '', email: '', phone: '', delivery_address: '', pincode: '', delivery_method: '', courier_fee: '', customer_type: 'home', business_name: '', gstin: '', gst_enabled: true }));
      setLines([{ id: '250g', qty: 1 }]); setOwnAmount(''); setOwnRate('');
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
  // Why this delivery: the PIN's distance from us decides it; the owner can still change it.
  const autoMethod = quote?.found ? (quote.local ? 'own_delivery' : 'third_party_courier') : null;
  const deliveryWhy = !quote || quote.loading ? '' : !quote.found ? quote.message
    : `${quote.message} ${quote.rule || ''}`.trim() + (form.delivery_method !== autoMethod ? ' You changed it by hand.' : '');

  // A new pack or quantity needs a fresh check.
  useEffect(() => { setStockWarning(null); }, [JSON.stringify(lines)]);

  const input = 'w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#d7a84b]/40';
  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <h2 className="text-xl text-[#efbd63]">Send an invoice</h2>
    <p className="text-xs text-gray-500 mt-1">Razorpay emails and texts the customer a payment link. Ledger gives it an ET order number, and once it's paid the customer gets Estate Tea's confirmation with a tracking link.</p>
    <div className="mt-4 grid grid-cols-2 gap-2">
      {[['home', 'Home'], ['business', 'Business']].map(([value, label]) =>
        <button key={value} type="button" onClick={() => set('customer_type', value)}
          className={`rounded-2xl border px-2 py-2.5 text-xs ${form.customer_type === value ? 'border-[#D4AF37]/70 bg-[#D4AF37]/10 text-[#f1dc9c]' : 'border-white/10 text-gray-400'}`}>{label}</button>)}
    </div>
    <div className="mt-3">
      <p className="text-[11px] text-gray-500 mb-1">GST for this manual invoice</p>
      <div className="grid grid-cols-2 gap-2">
        {[{ value: true, label: 'Normal GST · 5%' }, { value: false, label: 'GST off' }].map(option =>
          <button key={String(option.value)} type="button" onClick={() => set('gst_enabled', option.value)}
            className={`rounded-2xl border px-3 py-2.5 text-xs ${form.gst_enabled === option.value ? 'border-[#D4AF37]/70 bg-[#D4AF37]/10 text-[#f1dc9c]' : 'border-white/10 text-gray-400'}`}>{option.label}</button>)}
      </div>
      <p className="mt-1 text-[11px] text-gray-500">{form.gst_enabled ? 'GST is calculated at 5% on tea and delivery.' : 'GST will not be added to this manual invoice.'}</p>
    </div>
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {form.customer_type === 'business' && <>
        <input value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Business name (on the tax invoice)" className={input} />
        <div>
          <input value={form.gstin} onChange={e => set('gstin', e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 15))} placeholder={form.gst_enabled ? "GSTIN (required with GST)" : "GSTIN (optional)"} className={`${input} font-mono ${form.gstin && !GSTIN.test(form.gstin) ? 'border-amber-500/60' : ''}`} />
          {form.gstin && !GSTIN.test(form.gstin) && <p className="mt-1 px-1 text-[11px] text-amber-400">GSTIN is 15 characters, like 29AAGCB7383J1Z4.</p>}
        </div>
      </>}
      <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={form.customer_type === 'business' ? 'Contact person' : 'Customer name'} className={input} />
      <input value={form.email} onChange={e => set('email', e.target.value)} onBlur={e => set('email', e.target.value)} type="email" autoComplete="off" autoCapitalize="none" placeholder="Email address" className={input} />
      <input value={form.phone} onChange={e => set('phone', e.target.value)} inputMode="tel" placeholder="Mobile number (for SMS)" className={input} />
      <textarea value={form.delivery_address} onChange={e => set('delivery_address', e.target.value)} rows={2} placeholder="Delivery address (printed on the bill)" className={`${input} sm:col-span-2 resize-none`} />
      <input value={form.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="PIN code" className={input} />
      <p className={`self-center text-xs ${quote?.found === false ? 'text-amber-400' : 'text-gray-400'}`}>{quote?.loading ? 'Measuring the distance…' : quote?.message || 'Type the PIN to measure the distance.'}</p>
    </div>
    <div className="mt-2">
      <p className="text-[11px] text-gray-500">Delivery <WhyInfo className="ml-1" text={deliveryWhy} /></p>
      <div className="mt-1 grid grid-cols-3 gap-2">
        {[['own_delivery', `Estate Tea · ${rupees(ownFee)}`, ownAllowed], ['third_party_courier', 'Third-party', courierAllowed], ['', 'No charge', true]].filter(o => o[2]).map(([value, label]) =>
          <button key={value || 'none'} type="button" onClick={() => set('delivery_method', value)}
            className={`rounded-2xl border px-2 py-2.5 text-xs ${form.delivery_method === value ? 'border-[#D4AF37]/70 bg-[#D4AF37]/10 text-[#f1dc9c]' : 'border-white/10 text-gray-400'}`}>{label}</button>)}
      </div>
      {form.delivery_method === 'third_party_courier' && freeFar && <p className="text-xs text-emerald-300/80">Over 750 g: delivery is free for the customer.</p>}{form.delivery_method === 'third_party_courier' && !freeFar && <input value={form.courier_fee} onChange={e => set('courier_fee', e.target.value)} type="number" min="1" inputMode="decimal" placeholder="What the third-party delivery service will cost (₹)" className={`${input} mt-2`} />}
    </div>
    <div className="mt-3">
      <p className="text-[11px] text-gray-500 mb-1">Items</p>
      <div className="space-y-2">
        {lines.map((l, idx) => <div key={idx} className="grid grid-cols-[1fr_5.5rem_2.5rem] gap-2">
          <select value={l.id} onChange={e => setLines(ls => e.target.value === 'test' ? [{ id: 'test', qty: 1 }] : ls.map((x, k) => k === idx ? { ...x, id: e.target.value } : x).filter(x => x.id !== 'test'))}
            aria-label={`Item ${idx + 1}`} className={input}>
            {PACKS.map(p => <option key={p.id} value={p.id} className="bg-[#111]">{p.label} · {rupees(p.price)}{p.inclusive ? ' incl. GST' : ''}</option>)}
          </select>
          <input value={isTest ? 1 : l.qty} disabled={isTest} onChange={e => setLines(ls => ls.map((x, k) => k === idx ? { ...x, qty: e.target.value } : x))}
            type="number" min="1" max="500" inputMode="numeric" aria-label={`How many of item ${idx + 1}`} className={input} />
          <button type="button" onClick={() => setLines(ls => ls.length > 1 ? ls.filter((_, k) => k !== idx) : ls)} disabled={lines.length < 2}
            aria-label={`Remove item ${idx + 1}`} className="rounded-2xl border border-white/10 text-gray-400 disabled:opacity-30">×</button>
        </div>)}
      </div>
      {!isTest && <button type="button" onClick={() => setLines(ls => [...ls, { id: ls.some(x => x.id === '250g') ? 'christmas-spirit' : '250g', qty: 1 }])}
        className="mt-2 rounded-2xl border border-dashed border-[#D4AF37]/40 px-3 py-2 text-xs text-[#f1dc9c]">+ Add another item</button>}
    </div>
    {!isTest && <div className="mt-3">
      <p className="text-[11px] text-gray-500">Your own price (optional)</p>
      <div className="mt-1 grid grid-cols-2 gap-2">
        {[['total', 'Total amount'], ['kg', 'Price per kg']].map(([v, label]) =>
          <button key={v} type="button" onClick={() => setPriceMode(v)}
            className={`rounded-2xl border px-2 py-2 text-xs ${priceMode === v ? 'border-[#D4AF37]/70 bg-[#D4AF37]/10 text-[#f1dc9c]' : 'border-white/10 text-gray-400'}`}>{label}</button>)}
      </div>
      {priceMode === 'total'
        ? <input value={ownAmount} onChange={e => setOwnAmount(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" aria-label="Your own total amount"
            placeholder={`Total to charge, GST included (shop price ${rupees(shopTotal)})`} className={`${input} mt-2`} />
        : <input value={ownRate} onChange={e => setOwnRate(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" aria-label="Price per kg"
            placeholder="Price per kg of tea, before GST (e.g. 420)" className={`${input} mt-2`} />}
      <p className="mt-1 text-[11px] text-gray-500">{priceMode === 'kg'
        ? (rateTotal ? `${Math.round(orderKg * 1000) / 1000} kg × ${rupees(Number(ownRate))}${form.gst_enabled ? ' + 5% GST' : ''}${drinkRow ? ` + Christmas Spirit ${rupees(drinkTotal)}` : ''} = ${rupees(rateTotal)}, delivery included. The first-order discount doesn't apply.` : 'Type the rate per kg (before GST) for the tea on this invoice.')
        : (agreed ? `The customer pays exactly ${rupees(agreed)}${form.gst_enabled ? ', GST worked out inside it' : ''}, delivery included. The first-order discount doesn't apply.` : 'Type the total you want to charge (GST included) to set your own price.')}</p>
    </div>}
    <div className="mt-3 rounded-2xl border border-white/[.07] p-4 text-xs text-gray-400 space-y-1">
      {merged.map(l => <div key={l.id} className="flex justify-between"><span>{packOf(l.id).label} × {l.qty}{packOf(l.id).inclusive ? ' (GST included)' : ''}</span><span>{agreed ? '' : rupees(packOf(l.id).price * l.qty)}</span></div>)}
      {!agreed && deliveryFee > 0 && <div className="flex justify-between"><span>Delivery ({form.delivery_method === 'own_delivery' ? 'Estate Tea' : 'third-party service'})</span><span>{rupees(deliveryFee)}</span></div>}
      {!agreed && form.gst_enabled && !isTest && teaGst > 0 && <div className="flex justify-between"><span>GST ({teaRows.length ? `5% on tea${deliveryFee > 0 ? ' and delivery' : ''}` : `${(drinkPack?.gstRate || 0) * 100}% on delivery`})</span><span>{rupees(teaGst)}</span></div>}
      {!agreed && form.gst_enabled && drinkRow && <div className="flex justify-between text-gray-500"><span>GST inside Christmas Spirit (18%)</span><span>{rupees(drinkGst)}</span></div>}
      {!form.gst_enabled && !isTest && <div className="flex justify-between text-gray-500"><span>GST</span><span>Off</span></div>}
      {agreed > 0 && <div className="flex justify-between text-gray-500"><span>Shop price would be</span><span>{rupees(shopTotal)}</span></div>}
      <div className="flex justify-between text-sm text-white"><span>Total{agreed ? ' (your amount)' : ''}</span><span className="text-[#efbd63]">{rupees(total)}</span></div>
    </div>
    {stock && needKg > 0 && <p className={`mt-2 text-xs ${stockLevel === 'shortfall' ? 'text-red-400' : stockLevel === 'reserve' ? 'text-amber-400' : 'text-gray-500'}`}>
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
    </div> : <button onClick={() => send(false)} disabled={busy} className="mt-3 w-full rounded-2xl bg-gradient-to-r from-[#c9983c] to-[#efc66d] text-black py-3 text-sm font-medium disabled:opacity-50">{busy ? 'Sending…' : `Send invoice for ${rupees(total)}`}</button>}
    {!stockWarning && missing.length > 0 && <p className="mt-2 text-center text-xs text-amber-300/90">Still needed: {missing.join(', ')}.</p>}
    {sent.length > 0 && <div className="mt-5">
      <p className="text-xs uppercase tracking-[.14em] text-gray-500">Sent invoices</p>
      <div className="mt-2 divide-y divide-white/[.06] rounded-2xl border border-white/[.07]">
        {sent.slice(0, 10).map(row => {
          const [label, tone] = statusLabel(row);
          const item = (row.items || [])[0] || {};
          return <div key={row.order_id} className="p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{row.is_test && <span className="mr-1.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-400">TEST</span>}{row.business_name || row.customer_name || row.email} <span className="text-gray-500 font-mono">· {row.estate_order_number || '—'}</span></p>
              <p className="text-xs text-gray-500 mt-0.5">{row.gstin && <span className="font-mono">GSTIN {row.gstin} · </span>}{(row.items || []).map(i => `${i.name || i.weight} × ${i.quantity}`).join(' + ') || `${item.weight} × ${item.quantity}`} · {rupees(row.total_amount)}{row.invoice_url && <> · <a href={row.invoice_url} target="_blank" rel="noreferrer" className="text-[#d7a84b]">invoice link</a></>}{row.qr_image_url && row.status === 'AWAITING_PAYMENT' && <> · <a href={row.qr_image_url} target="_blank" rel="noreferrer" className="text-[#d7a84b]">scan-to-pay QR</a></>}</p>
            </div>
            <p className={`text-[11px] text-right shrink-0 ${tone}`}>{label}</p>
          </div>;
        })}
      </div>
    </div>}
  </div>;
}
