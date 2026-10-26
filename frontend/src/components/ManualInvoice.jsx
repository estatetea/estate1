import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Same retail packs and prices as the store and Steward.
const PACKS = [
  { id: '250g', label: '250 g', price: 180, kg: 0.25 },
  { id: '500g', label: '500 g', price: 360, kg: 0.5 },
  { id: '1kg', label: '1 kg', price: 720, kg: 1 },
];
const GST_RATE = 0.05;
const rupees = v => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function statusLabel(row) {
  if (row.status === 'CANCELLED') return ['Cancelled', 'text-gray-500'];
  if (!row.payment_verified) return ['Invoice sent · awaiting payment', 'text-amber-400'];
  if (row.confirmation_email === 'sent') return ['Paid · confirmation emailed', 'text-emerald-400'];
  return ['Paid · confirmation sending', 'text-emerald-400'];
}

// Owner sends a Razorpay invoice (email + SMS). It becomes a normal "manual" order with an ET number.
export function ManualInvoice({ headers }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', product_id: '250g', quantity: 1 });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState([]);
  const [sellable, setSellable] = useState(null);
  // Set when Steward says this invoice is over stock; the owner can still send it.
  const [stockWarning, setStockWarning] = useState(null);
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  // The panel rebuilds `headers` every render; follow the login token so the list doesn't reload in a loop.
  const headersRef = useRef(headers);
  headersRef.current = headers;
  const auth = headers?.Authorization;

  const pack = PACKS.find(p => p.id === form.product_id) || PACKS[0];
  const qty = Math.max(1, Math.floor(Number(form.quantity) || 1));
  const subtotal = pack.price * qty;
  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  const total = subtotal + gst;
  const needKg = Math.round(pack.kg * qty * 1000) / 1000;
  const overStock = sellable !== null && needKg > sellable;

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/manual-invoices', { headers: headersRef.current, cache: 'no-store' });
      if (r.ok) setSent(await r.json());
      const inv = await fetch('/api/admin/inventory', { headers: headersRef.current, cache: 'no-store' });
      if (inv.ok) { const body = await inv.json(); if (Number.isFinite(Number(body.sellable_kg))) setSellable(Number(body.sellable_kg)); }
    } catch { /* keep the last list */ }
  }, [auth]);
  // Payments arrive from the customer's phone, so keep the list fresh while this is open.
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const send = async (overrideStock = false) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error('Enter the customer\'s email address');
    setBusy(true);
    try {
      const r = await fetch('/api/admin/manual-invoices', { method: 'POST', headers: headersRef.current, body: JSON.stringify({ ...form, quantity: qty, override_stock: overrideStock }) });
      const data = await r.json().catch(() => ({}));
      if (r.status === 409 && data.code === 'stock_warning') { setStockWarning(data); return; }
      if (!r.ok) throw new Error(data.error || 'Could not send the invoice');
      setStockWarning(null);
      if (overrideStock) toast.warning(`Sent over stock: ${data.estate_order_number} needs more tea than is recorded. Update Inventory before fulfilling it.`);
      toast.success(`Invoice ${data.estate_order_number} sent to ${data.email}${data.phone ? ' and ' + data.phone : ''}`);
      setForm(f => ({ ...f, name: '', email: '', phone: '', quantity: 1 }));
      load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  // A new pack or quantity needs a fresh check.
  useEffect(() => { setStockWarning(null); }, [form.product_id, qty]);

  const input = 'w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#d7a84b]/40';
  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <h2 className="text-xl text-[#efbd63]">Send an invoice</h2>
    <p className="text-xs text-gray-500 mt-1">Razorpay emails and texts the customer a payment link. Ledger gives it an ET order number, and once it's paid the customer gets Estate Tea's confirmation with a tracking link.</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Customer name" className={input} />
      <input value={form.email} onChange={e => set('email', e.target.value)} type="email" placeholder="Email address" className={input} />
      <input value={form.phone} onChange={e => set('phone', e.target.value)} inputMode="tel" placeholder="Mobile number (for SMS)" className={input} />
    </div>
    <div className="mt-2 grid grid-cols-[1fr_6.5rem] gap-2">
      <label className="text-[11px] text-gray-500">Packet size
        <select value={form.product_id} onChange={e => set('product_id', e.target.value)} className={`${input} mt-1`}>
          {PACKS.map(p => <option key={p.id} value={p.id} className="bg-[#111]">{p.label} · {rupees(p.price)}</option>)}
        </select>
      </label>
      <label className="text-[11px] text-gray-500">Quantity
        <input value={form.quantity} onChange={e => set('quantity', e.target.value)} type="number" min="1" max="500" inputMode="numeric" className={`${input} mt-1`} />
      </label>
    </div>
    <div className="mt-3 rounded-2xl border border-white/[.07] p-4 text-xs text-gray-400 space-y-1">
      <div className="flex justify-between"><span>{pack.label} × {qty}</span><span>{rupees(subtotal)}</span></div>
      <div className="flex justify-between"><span>GST (5%)</span><span>{rupees(gst)}</span></div>
      <div className="flex justify-between text-sm text-white"><span>Total</span><span className="text-[#efbd63]">{rupees(total)}</span></div>
    </div>
    {sellable !== null && <p className={`mt-2 text-xs ${overStock ? 'text-amber-400' : 'text-gray-500'}`}>Available to sell: {sellable} kg · this invoice needs {needKg} kg{overStock ? ' — above what can be fulfilled' : ''}</p>}
    {stockWarning ? <div className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
      <p className="text-sm text-amber-300">Stock warning</p>
      <p className="text-xs text-amber-200/80 mt-1">{stockWarning.message}</p>
      <p className="text-xs text-gray-400 mt-1">Agents and the website can't sell past this. You can, and it will be marked as an over-stock invoice in the activity log.</p>
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
              <p className="text-sm text-white truncate">{row.customer_name || row.email} <span className="text-gray-500 font-mono">· {row.estate_order_number || '—'}</span></p>
              <p className="text-xs text-gray-500 mt-0.5">{item.weight} × {item.quantity} · {rupees(row.total_amount)}{row.invoice_url && <> · <a href={row.invoice_url} target="_blank" rel="noreferrer" className="text-[#d7a84b]">invoice link</a></>}</p>
            </div>
            <p className={`text-[11px] text-right shrink-0 ${tone}`}>{label}</p>
          </div>;
        })}
      </div>
    </div>}
  </div>;
}
