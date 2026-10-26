import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

const rupees = v => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const input = 'w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-[#d7a84b]/40';

// Tea bought from the estate, recorded so Ledger can claim the GST already paid on it.
export function TeaPurchases({ headers, month, onChange }) {
  const auth = headers?.Authorization;
  const h = { 'Content-Type': 'application/json', Authorization: auth };
  const [defaults, setDefaults] = useState(null);
  const [form, setForm] = useState(null);
  const [list, setList] = useState(null);
  const [editingTerms, setEditingTerms] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [d, l] = await Promise.all([
      fetch('/api/admin/purchases?defaults=1', { headers: h, cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/admin/purchases?month=${month}`, { headers: h, cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    if (d) { setDefaults(d); setForm(f => f || { purchase_date: today(), supplier_name: d.supplier_name, supplier_gstin: d.supplier_gstin, supplier_invoice_no: '', kg: d.usual_kg || '', rate_per_kg: d.rate_per_kg || '', transport_fee: d.transport_fee || 0, tea_gst_rate: d.tea_gst_rate, transport_gst_rate: d.transport_gst_rate }); }
    setList(l);
  }, [auth, month]);
  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setTerm = (k, v) => setDefaults(d => ({ ...d, [k]: v }));
  const num = v => Number(v || 0);
  const preview = form ? (() => { const tea = num(form.kg) * num(form.rate_per_kg); const credit = tea * num(form.tea_gst_rate) / 100 + num(form.transport_fee) * num(form.transport_gst_rate) / 100; return { tea, credit }; })() : null;

  const saveTerms = async () => {
    setBusy(true);
    const r = await fetch('/api/admin/purchases', { method: 'PUT', headers: h, body: JSON.stringify({ ...defaults, rate_per_kg: num(defaults.rate_per_kg), usual_kg: num(defaults.usual_kg), transport_fee: num(defaults.transport_fee), tea_gst_rate: num(defaults.tea_gst_rate), transport_gst_rate: num(defaults.transport_gst_rate) }) });
    setBusy(false);
    if (!r.ok) return toast.error('Could not save your usual terms');
    toast.success('Usual purchase terms saved'); setEditingTerms(false); setForm(null); load();
  };
  const record = async () => {
    if (!(num(form.kg) > 0 && num(form.rate_per_kg) > 0)) return toast.error('Enter the kg and the price per kg');
    setBusy(true);
    const r = await fetch('/api/admin/purchases', { method: 'POST', headers: h, body: JSON.stringify({ ...form, kg: num(form.kg), rate_per_kg: num(form.rate_per_kg), transport_fee: num(form.transport_fee), tea_gst_rate: num(form.tea_gst_rate), transport_gst_rate: num(form.transport_gst_rate) }) });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return toast.error(data.error || 'Could not record the purchase');
    toast.success(`Recorded. GST credit ${rupees(data.gst_credit)}`); setForm(null); load(); onChange?.();
  };
  const remove = async id => {
    const r = await fetch(`/api/admin/purchases?id=${id}`, { method: 'DELETE', headers: h });
    if (!r.ok) { const d = await r.json().catch(() => ({})); return toast.error(d.error || 'Could not remove it'); }
    load(); onChange?.();
  };

  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <h2 className="text-xl text-[#efbd63]">Tea purchases</h2>
    <p className="mt-1 text-xs text-gray-500">Record what you buy from the estate. Ledger claims the GST you paid on it against the GST on your sales. Purchase costs stay out of the GST report.</p>
    {defaults && <div className="mt-4 rounded-2xl border border-white/[.07] p-4">
      <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[.16em] text-gray-500">Usual terms</p><button onClick={() => setEditingTerms(v => !v)} className="text-xs text-[#efbd63]">{editingTerms ? 'Cancel' : 'Edit'}</button></div>
      {editingTerms ? <div className="mt-3 grid grid-cols-2 gap-2">
        {[['supplier_name', 'Supplier'], ['supplier_gstin', 'Supplier GSTIN'], ['rate_per_kg', 'Price per kg (₹, before GST)'], ['usual_kg', 'Usual order (kg)'], ['transport_fee', 'Transport fee (₹)'], ['tea_gst_rate', 'GST on tea (%)'], ['transport_gst_rate', 'GST on transport (%)']].map(([k, label]) =>
          <label key={k} className="text-[11px] text-gray-500">{label}<input value={defaults[k] ?? ''} onChange={e => setTerm(k, e.target.value)} className={`${input} mt-1`} /></label>)}
        <button onClick={saveTerms} disabled={busy} className="col-span-2 mt-1 rounded-xl bg-[#efbd63] py-2.5 text-sm font-medium text-black disabled:opacity-50">Save usual terms</button>
      </div> : <p className="mt-2 text-sm text-gray-300">{defaults.supplier_name || 'Supplier not set'} · {defaults.usual_kg || 0} kg at ₹{defaults.rate_per_kg || 0}/kg · transport ₹{defaults.transport_fee || 0} · GST {defaults.tea_gst_rate}% tea, {defaults.transport_gst_rate}% transport</p>}
    </div>}
    {form && <div className="mt-3 rounded-2xl border border-white/[.07] p-4">
      <p className="text-xs uppercase tracking-[.16em] text-gray-500">Record a purchase</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-[11px] text-gray-500">Date<input type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} className={`${input} mt-1`} /></label>
        <label className="text-[11px] text-gray-500">Supplier bill no.<input value={form.supplier_invoice_no} onChange={e => set('supplier_invoice_no', e.target.value)} className={`${input} mt-1`} /></label>
        <label className="text-[11px] text-gray-500">Kg<input inputMode="decimal" value={form.kg} onChange={e => set('kg', e.target.value)} className={`${input} mt-1`} /></label>
        <label className="text-[11px] text-gray-500">Price per kg (₹)<input inputMode="decimal" value={form.rate_per_kg} onChange={e => set('rate_per_kg', e.target.value)} className={`${input} mt-1`} /></label>
        <label className="col-span-2 text-[11px] text-gray-500">Transport fee (₹)<input inputMode="decimal" value={form.transport_fee} onChange={e => set('transport_fee', e.target.value)} className={`${input} mt-1`} /></label>
      </div>
      {preview && <p className="mt-3 text-xs text-gray-400">Tea {rupees(preview.tea)} · GST credit <span className="text-[#efbd63]">{rupees(preview.credit)}</span></p>}
      <button onClick={record} disabled={busy} className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#c9983c] to-[#efc66d] py-2.5 text-sm font-medium text-black disabled:opacity-50">Record purchase</button>
    </div>}
    {list?.purchases?.length > 0 && <div className="mt-4 divide-y divide-white/[.06] rounded-2xl border border-white/[.07]">
      {list.purchases.map(p => <div key={p.purchase_id} className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0"><p className="text-sm text-white">{p.kg} kg · {p.supplier_name || 'Supplier'}{p.supplier_invoice_no ? ` · ${p.supplier_invoice_no}` : ''}</p><p className="text-[11px] text-gray-500">{p.purchase_date} · GST credit {rupees(p.gst_credit)}{!p.supplier_gstin && ' · no GSTIN'}</p></div>
        {!list.closed && <button onClick={() => remove(p.purchase_id)} aria-label="Remove purchase" className="text-gray-600 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>}
      </div>)}
    </div>}
  </div>;
}
