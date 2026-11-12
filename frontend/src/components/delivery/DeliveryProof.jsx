'use client';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Camera, Loader2, PackageCheck, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

// Shrink a photo on the phone before it's sent: about 1280 px on the long side, JPEG, usually 100-200 KB.
async function shrink(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    let q = 0.72, out = c.toDataURL('image/jpeg', q);
    while (out.length > 600000 && q > 0.35) { q -= 0.1; out = c.toDataURL('image/jpeg', q); }
    return out;
  } finally { URL.revokeObjectURL(url); }
}
const when = iso => iso ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';

// Proof that a delivery reached the customer. Partner deliveries (Porter): photos of the sealed parcel / the completed
// trip, then "Porter says delivered" -> Brew asks the customer; no problem within 24 hours closes it as delivered.
export function DeliveryProof({ order, headers, onSaved }) {
  const partner = order.delivery_method === 'third_party_courier';
  const [photos, setPhotos] = useState(null), [busy, setBusy] = useState('');
  const parcelRef = useRef(null), tripRef = useRef(null);
  const id = encodeURIComponent(order.order_id);
  const load = async () => {
    try { const r = await fetch(`/api/admin/orders/${id}/proof-photos`, { headers, cache: 'no-store' }); const b = await r.json(); if (r.ok) setPhotos(b.photos || []); } catch {}
  };
  useEffect(() => { load(); }, [order.order_id]);
  const upload = async (file, kind) => {
    if (!file) return;
    setBusy(kind);
    try {
      const image = await shrink(file);
      const r = await fetch(`/api/admin/orders/${id}/proof-photos`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ image, kind }) });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Could not save the photo');
      setPhotos(b.photos || []); toast.success(kind === 'trip' ? 'Trip screenshot saved' : 'Parcel photo saved');
    } catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };
  const dropped = async () => {
    if (!window.confirm('Has Porter (or the delivery partner) completed the trip? Brew will ask the customer whether it arrived.')) return;
    setBusy('drop');
    try {
      const r = await fetch(`/api/admin/orders/${id}/partner-dropped`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}' });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Could not save it');
      toast.success('Brew is asking the customer whether it arrived'); onSaved?.(b);
    } catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };
  const check = order.receipt_check || {}, issue = order.delivery_issue || {};
  const paid = ['PAID', 'FULFILLED'].includes(String(order.status || '').toUpperCase());
  if (!paid && !photos?.length) return null;
  return <section className="space-y-3 border-t border-white/[0.07] pt-5" data-testid="delivery-proof">
    <h3 className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]/70">Delivery proof</h3>
    {issue.open && <div className="flex gap-3 rounded-xl border border-red-400/30 bg-red-400/[0.06] p-3 text-sm text-red-200" data-testid="delivery-issue">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p>The customer reported a problem {when(issue.reported_at)}{issue.note ? `: "${issue.note}"` : '.'} Photos are kept until it's sorted. Mark it delivered (with a note) once resolved.</p></div>}
    {partner && order.delivery_status === 'OUT_FOR_DELIVERY' && !check.status && <div className="space-y-2">
      <button type="button" onClick={dropped} disabled={busy === 'drop'} data-testid="partner-dropped"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-medium text-black disabled:opacity-50">
        {busy === 'drop' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}Porter says delivered</button>
      <p className="text-[11px] leading-4 text-gray-500">Press this when the delivery partner's trip is completed. Brew asks the customer "Has your order arrived?". If they say yes, or report nothing within 24 hours, it's marked delivered.</p>
    </div>}
    {partner && ['due', 'asked'].includes(check.status) && !issue.open && <p className="flex items-center gap-2 text-sm text-amber-200" data-testid="receipt-waiting">
      <Clock className="h-4 w-4" />Waiting for the customer. Closes as delivered at {when(check.report_by)} if they report nothing.</p>}
    {order.delivery_status === 'DELIVERED' && order.delivery_confirmation_type && ['customer_confirmation', 'no_problem_reported'].includes(order.delivery_confirmation_type) &&
      <p className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" />{order.delivery_confirmation_type === 'no_problem_reported' ? 'Closed: no problem reported within 24 hours.' : 'The customer confirmed it arrived.'}</p>}
    <div className="grid grid-cols-2 gap-2">
      {[['parcel', 'Photo of the sealed parcel', parcelRef], ['trip', "Partner's trip screenshot", tripRef]].map(([kind, label, ref]) => <div key={kind}>
        <input ref={ref} type="file" accept="image/*" capture={kind === 'parcel' ? 'environment' : undefined} className="hidden" data-testid={`proof-input-${kind}`}
          onChange={e => { upload(e.target.files?.[0], kind); e.target.value = ''; }} />
        <button type="button" onClick={() => ref.current?.click()} disabled={!!busy} data-testid={`proof-add-${kind}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2.5 text-xs text-gray-200 hover:border-[#D4AF37]/40 disabled:opacity-50">
          {busy === kind ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}{label}</button>
      </div>)}
    </div>
    {photos?.length > 0 && <div className="grid grid-cols-3 gap-2" data-testid="proof-photos">
      {photos.map((p, i) => <a key={i} href={p.image} target="_blank" rel="noopener noreferrer" className="block">
        <img src={p.image} alt={p.kind === 'trip' ? 'Trip screenshot' : 'Parcel photo'} className="aspect-square w-full rounded-lg object-cover" />
        <p className="mt-1 text-[10px] leading-3 text-gray-500">{p.kind === 'trip' ? 'Trip' : 'Parcel'} · {when(p.taken_at)}<br />{p.deletes_at ? `Deletes ${when(p.deletes_at)}` : 'Kept (problem open)'}</p>
      </a>)}
    </div>}
    <p className="text-[10px] leading-4 text-gray-600">Photos delete themselves 24 hours after the order is delivered (14 days at most), and are kept while a problem is open.</p>
  </section>;
}
