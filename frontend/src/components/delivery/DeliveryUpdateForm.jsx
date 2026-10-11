import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, RefreshCw, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { DELIVERY_LABELS, EXCEPTION_STATUSES, nextStatuses, isPaymentVerified } from '@/lib/delivery-status';
import { STATUS_ICONS, Field, inputClass } from './form-bits';

const draftFrom = order => ({
  targetStatus: '',
  deliveryMethod: order.delivery_method || '',
  courierName: order.courier_name || '',
  trackingReference: order.tracking_reference || '',
  deliveryNote: '',
  confirmationType: order.delivery_confirmation_type || 'customer_confirmation',
  confirmationNote: '',
  proofReference: '',
});

function validate(d) {
  if (!d.targetStatus) return 'Choose the next status.';
  if (d.targetStatus !== 'CANCELLED' && !d.deliveryMethod) return 'Choose a delivery method.';
  if (EXCEPTION_STATUSES.includes(d.targetStatus) && !d.deliveryNote.trim()) return 'Add a note with the reason and the retry plan.';
  if (d.targetStatus === 'DELIVERED') {
    if (d.confirmationType === 'customer_confirmation' && !d.confirmationNote.trim()) return 'Record how the customer confirmed receipt.';
    if (d.confirmationType === 'proof_of_delivery' && !d.proofReference.trim() && !d.confirmationNote.trim()) return 'Record a proof reference or description.';
  }
  return null;
}

export const DeliveryUpdateForm = ({ order, headers, onSaved }) => {
  const [draft, setDraft] = useState(() => draftFrom(order));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { setDraft(draftFrom(order)); setError(null); }, [order]);
  const set = patch => setDraft(prev => ({ ...prev, ...patch }));
  const locked = !isPaymentVerified(order);
  // Unpaid orders can only be cancelled (Steward re-checks the unpaid rule).
  const options = nextStatuses(order).filter(s => !locked || s === 'CANCELLED');
  const lockedNotice = locked && <div className="flex gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-4 text-sm text-amber-100" data-testid="delivery-locked-notice"><Lock className="mt-0.5 h-4 w-4 shrink-0" /><p>Delivery is locked until payment is independently verified. Current payment status: <strong>{order.payment_status || order.status || 'unknown'}</strong>.</p></div>;

  if (locked && !options.length) return lockedNotice;
  if (!options.length) {
    return <p className="rounded-xl border border-white/10 p-4 text-sm text-gray-400" data-testid="delivery-terminal-notice">{DELIVERY_LABELS[order.delivery_status]} is a final state. Corrections need an audited owner correction, not a status button.</p>;
  }

  const save = async () => {
    const problem = validate(draft);
    if (problem) { setError(problem); return; }
    setSaving(true); setError(null);
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
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.error || `Update failed (${res.status}). Nothing was changed.`);
      toast.success(`Saved: ${DELIVERY_LABELS[data.delivery_status] || data.delivery_status}`);
      await onSaved();
    } catch (e) {
      setError(e.message || 'Could not save. Check your connection and retry.');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5" data-testid="delivery-update-form">
      {lockedNotice}
      <div>
        <p className="mb-2.5 text-[10px] uppercase tracking-[0.2em] text-gray-500">Move this order to</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map(status => {
            const Icon = STATUS_ICONS[status];
            const selected = draft.targetStatus === status;
            const exception = EXCEPTION_STATUSES.includes(status) || status === 'CANCELLED';
            return (
              <button key={status} type="button" onClick={() => { set({ targetStatus: status }); setError(null); }}
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

      {draft.targetStatus && draft.targetStatus !== 'CANCELLED' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
          <Field label="Delivery method" id="delivery-method">
            <div className="grid grid-cols-2 gap-2">
              {[['own_delivery', 'Estate Tea delivery'], ['third_party_courier', 'Third-party courier']].map(([value, label]) => (
                <button key={value} type="button" onClick={() => set({ deliveryMethod: value })}
                  className={`h-11 rounded-xl border text-xs transition-colors ${draft.deliveryMethod === value ? 'border-[#D4AF37]/70 bg-[#D4AF37]/10 text-[#f1dc9c]' : 'border-white/10 text-gray-400 hover:border-white/25'}`}
                  data-testid={`delivery-method-${value}`}>{label}</button>
              ))}
            </div>
          </Field>
          {draft.deliveryMethod === 'third_party_courier' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-in fade-in">
              <Field label="Courier / service" id="courier-name"><input id="courier-name" value={draft.courierName} onChange={e => set({ courierName: e.target.value })} placeholder="e.g. Porter" className={inputClass} data-testid="delivery-courier-input" /></Field>
              <Field label="Tracking / booking ref" id="tracking-reference"><input id="tracking-reference" value={draft.trackingReference} onChange={e => set({ trackingReference: e.target.value })} placeholder="Optional" className={inputClass} data-testid="delivery-tracking-input" /></Field>
            </div>
          )}
        </div>
      )}

      {draft.targetStatus === 'DELIVERED' && (
        <div className="space-y-3 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.03] p-4 animate-in fade-in" data-testid="delivery-proof-section">
          <p className="flex items-center gap-2 text-sm text-[#e6d4a2]"><CheckCircle2 className="h-4 w-4" />Delivery evidence required</p>
          <div className="grid grid-cols-2 gap-2">
            {[['customer_confirmation', 'Customer confirmed'], ['proof_of_delivery', 'Proof recorded']].map(([value, label]) => (
              <button key={value} type="button" onClick={() => set({ confirmationType: value })}
                className={`h-10 rounded-lg border text-xs transition-colors ${draft.confirmationType === value ? 'border-[#D4AF37]/70 bg-[#D4AF37]/10 text-[#f1dc9c]' : 'border-white/10 text-gray-400'}`}
                data-testid={`delivery-confirmation-${value}`}>{label}</button>
            ))}
          </div>
          <Field label={draft.confirmationType === 'customer_confirmation' ? 'How and when did the customer confirm?' : 'Proof description'} id="delivery-confirmation-note">
            <textarea id="delivery-confirmation-note" rows={2} value={draft.confirmationNote} onChange={e => set({ confirmationNote: e.target.value })} placeholder={draft.confirmationType === 'customer_confirmation' ? 'e.g. Confirmed by phone at 4:15 PM' : 'e.g. Handed to reception'} className={inputClass} data-testid="delivery-confirmation-note-input" />
          </Field>
          {draft.confirmationType === 'proof_of_delivery' && (
            <Field label="Proof reference" id="proof-reference"><input id="proof-reference" value={draft.proofReference} onChange={e => set({ proofReference: e.target.value })} placeholder="Photo/file ref, receipt or courier POD" className={inputClass} data-testid="delivery-proof-reference-input" /></Field>
          )}
        </div>
      )}

      {draft.targetStatus && (
        <Field label={EXCEPTION_STATUSES.includes(draft.targetStatus) ? 'Reason and retry plan (required)' : 'Internal note (optional)'} id="delivery-note">
          <textarea id="delivery-note" rows={2} value={draft.deliveryNote} onChange={e => set({ deliveryNote: e.target.value })} placeholder={EXCEPTION_STATUSES.includes(draft.targetStatus) ? 'e.g. Customer unavailable; retry tomorrow 11 AM' : 'Handover or packing note'} className={inputClass} data-testid="delivery-note-input" />
        </Field>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/[0.06] p-3 text-sm text-red-200" data-testid="delivery-update-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p className="flex-1">{error}</p>
        </div>
      )}

      <button type="button" onClick={save} disabled={saving || !draft.targetStatus}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] text-sm font-semibold tracking-wide text-black transition-[background-color,transform] hover:bg-[#e2c04d] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500"
        data-testid="save-delivery-status">
        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {saving ? 'Saving…' : draft.targetStatus ? `Save · ${DELIVERY_LABELS[draft.targetStatus]}` : 'Choose a status'}
      </button>
      <p className="text-[11px] leading-5 text-gray-600">Owner-authenticated and audited. Customers are not notified yet — WhatsApp updates will be connected separately.</p>
    </div>
  );
};
