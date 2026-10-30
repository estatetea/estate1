import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, RefreshCw, CheckCircle2, AlertCircle, Lock, Printer } from 'lucide-react';
import { printBill } from '@/lib/print-bill';

// The bill belongs to the parcel once it's packed and ready to go; the laptop prints it at that step.
const BILL_STAGES = ['READY_FOR_DISPATCH', 'OUT_FOR_DELIVERY', 'DELIVERED'];
// The delivery method is chosen once, on Send invoice; this screen only shows it.
const METHOD_LABELS = { own_delivery: 'Estate Tea delivery', third_party_courier: 'Third-party delivery service' };
import { DELIVERY_LABELS, EXCEPTION_STATUSES, nextStatuses, isPaymentVerified } from '@/lib/delivery-status';
import { STATUS_ICONS, Field, inputClass } from './form-bits';
import { ManualPaymentForm } from './ManualPaymentForm';

const draftFrom = order => ({
  targetStatus: '',
  deliveryMethod: order.delivery_method || '',
  courierName: order.courier_name || '',
  trackingReference: order.tracking_reference || '',
  deliveryNote: '',
  // Orders with a code default to it; the customer reads it from their confirmation email.
  confirmationType: order.delivery_confirmation_type || (order.has_delivery_code ? 'delivery_code' : 'customer_confirmation'),
  deliveryCode: '',
  confirmationNote: '',
  proofReference: '',
});

// Entering or leaving a failed/rescheduled state must record why and what happens next.
const needsNote = (target, current) => EXCEPTION_STATUSES.includes(target) || EXCEPTION_STATUSES.includes(current);

function validate(d, current) {
  if (!d.targetStatus) return 'Choose the next status.';
  if (needsNote(d.targetStatus, current) && !d.deliveryNote.trim()) return 'Add a note with the reason and the retry plan.';
  if (d.targetStatus === 'DELIVERED') {
    if (d.confirmationType === 'delivery_code' && !/^\d{4}$/.test(d.deliveryCode)) return 'Enter the 4-digit code the customer gives you.';
    if (d.confirmationType === 'customer_confirmation' && !d.confirmationNote.trim()) return 'Record how the customer confirmed receipt.';
    if (d.confirmationType === 'proof_of_delivery' && !d.proofReference.trim() && !d.confirmationNote.trim()) return 'Record a proof reference or description.';
  }
  return null;
}

export const DeliveryUpdateForm = ({ order, headers, onSaved }) => {
  const [draft, setDraft] = useState(() => draftFrom(order));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  // Steward's protected-reserve warning: the owner can still go ahead.
  const [reserveWarning, setReserveWarning] = useState(null);
  useEffect(() => { setDraft(draftFrom(order)); setError(null); setReserveWarning(null); }, [order]);
  const set = patch => setDraft(prev => ({ ...prev, ...patch }));
  const locked = !isPaymentVerified(order);
  // Unpaid orders can only be cancelled (Steward re-checks the unpaid rule).
  const options = nextStatuses(order).filter(s => !locked || s === 'CANCELLED');
  const lockedNotice = locked && <div className="space-y-3"><div className="flex gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-4 text-sm text-amber-100" data-testid="delivery-locked-notice"><Lock className="mt-0.5 h-4 w-4 shrink-0" /><p>Delivery is locked until payment is verified. Current payment status: <strong>{String(order.payment_status || order.status || 'unknown').replace(/_/g, ' ')}</strong>. If the customer paid by UPI, cash or bank transfer, mark it paid below.</p></div><ManualPaymentForm order={order} headers={headers} onSaved={onSaved} /></div>;

  if (locked && !options.length) return lockedNotice;
  if (!options.length) {
    return <p className="rounded-xl border border-white/10 p-4 text-sm text-gray-400" data-testid="delivery-terminal-notice">{DELIVERY_LABELS[order.delivery_status]} is a final state. Corrections need an audited owner correction, not a status button.</p>;
  }

  const save = async (overrideReserve = false) => {
    const problem = validate(draft, order.delivery_status);
    if (problem) { setError(problem); return; }
    setSaving(true); setError(null); setReserveWarning(null);
    try {
      const id = order.internal_order_id || order.order_id;
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}/delivery`, {
        method: 'PATCH', headers,
        body: JSON.stringify({
          delivery_status: draft.targetStatus,
          delivery_method: draft.deliveryMethod || null,
          courier_name: draft.deliveryMethod === 'third_party_courier' ? draft.courierName || null : null,
          tracking_reference: draft.deliveryMethod === 'third_party_courier' ? draft.trackingReference || null : null,
          delivery_note: draft.deliveryNote || null,
          delivery_confirmation_type: draft.targetStatus === 'DELIVERED' ? draft.confirmationType : null,
          delivery_confirmation_note: draft.confirmationNote || null,
          proof_of_delivery_reference: draft.proofReference || null,
          delivery_code: draft.targetStatus === 'DELIVERED' && draft.confirmationType === 'delivery_code' ? draft.deliveryCode : null,
          override_reserve: overrideReserve,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.detail?.code === 'reserve_warning') { setReserveWarning(data.detail.message); return; }
      if (!res.ok) throw new Error((typeof data.detail === 'string' && data.detail) || data.error || `Update failed (${res.status}). Nothing was changed.`);
      if (data.delivery_status === 'READY_FOR_DISPATCH') {
        // The laptop print helper picks this up within a minute; nothing opens on this screen.
        toast.success('Saved: Ready for dispatch. The bill will print on the laptop printer within a minute.', { duration: 8000 });
      } else toast.success(`Saved: ${DELIVERY_LABELS[data.delivery_status] || data.delivery_status}`);
      await onSaved();
    } catch (e) {
      setError(e.message || 'Could not save. Check your connection and retry.');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5" data-testid="delivery-update-form">
      {lockedNotice}
      {BILL_STAGES.includes(order.delivery_status) && <button type="button" onClick={() => printBill(order.internal_order_id || order.order_id, headers).catch(e => toast.error(e.message))}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.06] py-2.5 text-sm text-[#f1dc9c]" data-testid="print-bill">
        <Printer className="h-4 w-4" />Print bill</button>}
      {order.helper_print?.printed_at && <p className="-mt-3 text-center text-[11px] text-emerald-400">Bill printed on the laptop printer at {new Date(order.helper_print.printed_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</p>}
      <div>
        <p className="mb-2.5 text-[10px] uppercase tracking-[0.2em] text-gray-500">Move this order to</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map(status => {
            const Icon = STATUS_ICONS[status];
            const selected = draft.targetStatus === status;
            const exception = EXCEPTION_STATUSES.includes(status) || status === 'CANCELLED';
            return (
              <button key={status} type="button" onClick={() => { set({ targetStatus: status }); setError(null); setReserveWarning(null); }}
                className={`flex min-h-[52px] items-center gap-3 rounded-xl border px-4 text-left text-sm transition-[background-color,border-color,transform] duration-200 active:scale-[0.98] ${selected ? (exception ? 'border-amber-300/60 bg-amber-300/10 text-amber-100' : 'border-[#D4AF37] bg-[#D4AF37]/[0.12] text-[#f1dc9c]') : 'border-white/10 text-gray-300 hover:border-white/25 hover:bg-white/[0.02]'}`}
                data-testid={`delivery-status-${status.toLowerCase()}`}>
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                <span className="flex-1">{DELIVERY_LABELS[status]}</span>
                {selected && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </div>

      {order.delivery_method && draft.targetStatus && draft.targetStatus !== 'CANCELLED' && (
        <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm" data-testid="delivery-method-fixed">
          <span className="text-gray-300">{METHOD_LABELS[order.delivery_method] || order.delivery_method}{Number(order.delivery_fee) > 0 && <span className="text-gray-500"> · ₹{Number(order.delivery_fee)} charged</span>}</span>
        </div>
      )}
      {draft.targetStatus === 'OUT_FOR_DELIVERY' && order.delivery_method === 'third_party_courier' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-in fade-in">
          <Field label="Courier / service" id="courier-name-fixed"><input id="courier-name-fixed" value={draft.courierName} onChange={e => set({ courierName: e.target.value })} placeholder="e.g. Porter" className={inputClass} /></Field>
          <Field label="Tracking / booking ref" id="tracking-reference-fixed"><input id="tracking-reference-fixed" value={draft.trackingReference} onChange={e => set({ trackingReference: e.target.value })} placeholder="Optional" className={inputClass} /></Field>
        </div>
      )}
      {draft.targetStatus === 'DELIVERED' && (
        <div className="space-y-3 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.03] p-4 animate-in fade-in" data-testid="delivery-proof-section">
          <p className="flex items-center gap-2 text-sm text-[#e6d4a2]"><CheckCircle2 className="h-4 w-4" />Delivery evidence required</p>
          <div className={`grid gap-2 ${order.has_delivery_code ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {[...(order.has_delivery_code ? [['delivery_code', 'Delivery code']] : []), ['customer_confirmation', 'Customer confirmed'], ['proof_of_delivery', 'Proof recorded']].map(([value, label]) => (
              <button key={value} type="button" onClick={() => set({ confirmationType: value })}
                className={`h-10 rounded-lg border text-xs transition-colors ${draft.confirmationType === value ? 'border-[#D4AF37]/70 bg-[#D4AF37]/10 text-[#f1dc9c]' : 'border-white/10 text-gray-400'}`}
                data-testid={`delivery-confirmation-${value}`}>{label}</button>
            ))}
          </div>
          {draft.confirmationType === 'delivery_code' ? <Field label="Code the customer gives you" id="delivery-code">
            <input id="delivery-code" value={draft.deliveryCode} onChange={e => set({ deliveryCode: e.target.value.replace(/\D/g, '').slice(0, 4) })} inputMode="numeric" autoComplete="off" placeholder="••••" className={`${inputClass} text-center font-mono text-2xl tracking-[0.5em]`} data-testid="delivery-code-input" />
            <p className="mt-1.5 text-[11px] text-gray-500">It's in their order confirmation email and on the order-tracking page.</p>
          </Field> : <Field label={draft.confirmationType === 'customer_confirmation' ? 'How and when did the customer confirm?' : 'Proof description'} id="delivery-confirmation-note">
            <textarea id="delivery-confirmation-note" rows={2} value={draft.confirmationNote} onChange={e => set({ confirmationNote: e.target.value })} placeholder={draft.confirmationType === 'customer_confirmation' ? 'e.g. Confirmed by phone at 4:15 PM' : 'e.g. Handed to reception'} className={inputClass} data-testid="delivery-confirmation-note-input" />
          </Field>}
          {draft.confirmationType === 'proof_of_delivery' && (
            <Field label="Proof reference" id="proof-reference"><input id="proof-reference" value={draft.proofReference} onChange={e => set({ proofReference: e.target.value })} placeholder="Photo/file ref, receipt or courier POD" className={inputClass} data-testid="delivery-proof-reference-input" /></Field>
          )}
        </div>
      )}

      {draft.targetStatus && (
        <Field label={needsNote(draft.targetStatus, order.delivery_status) ? 'Reason and retry plan (required)' : 'Internal note (optional)'} id="delivery-note">
          <textarea id="delivery-note" rows={2} value={draft.deliveryNote} onChange={e => set({ deliveryNote: e.target.value })} placeholder={needsNote(draft.targetStatus, order.delivery_status) ? 'e.g. Customer unavailable; retry tomorrow 11 AM' : 'Handover or packing note'} className={inputClass} data-testid="delivery-note-input" />
        </Field>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/[0.06] p-3 text-sm text-red-200" data-testid="delivery-update-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p className="flex-1">{error}</p>
        </div>
      )}

      {reserveWarning && (
        <div role="alert" className="space-y-3 rounded-xl border border-amber-300/40 bg-amber-300/[0.06] p-4" data-testid="delivery-reserve-warning">
          <p className="flex items-center gap-2 text-sm text-amber-200"><AlertCircle className="h-4 w-4 shrink-0" />Protected reserve</p>
          <p className="text-xs leading-5 text-amber-100/80">{reserveWarning}</p>
          <p className="text-[11px] leading-5 text-gray-400">Agents are stopped here. You can still go ahead; it's noted in the activity log.</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setReserveWarning(null)} disabled={saving} className="h-10 rounded-lg border border-white/10 text-xs text-gray-300">Cancel</button>
            <button type="button" onClick={() => save(true)} disabled={saving} className="h-10 rounded-lg bg-amber-400 text-xs font-semibold text-black disabled:opacity-50" data-testid="delivery-reserve-override">{saving ? 'Saving…' : `Save anyway · ${DELIVERY_LABELS[draft.targetStatus]}`}</button>
          </div>
        </div>
      )}

      {!reserveWarning && <button type="button" onClick={() => save(false)} disabled={saving || !draft.targetStatus}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] text-sm font-semibold tracking-wide text-black transition-[background-color,transform] hover:bg-[#e2c04d] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500"
        data-testid="save-delivery-status">
        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {saving ? 'Saving…' : draft.targetStatus ? `Save · ${DELIVERY_LABELS[draft.targetStatus]}` : 'Choose a status'}
      </button>}
      <p className="text-[11px] leading-5 text-gray-600">Owner-authenticated and audited. Customers are not notified yet — WhatsApp updates will be connected separately.</p>
    </div>
  );
};
