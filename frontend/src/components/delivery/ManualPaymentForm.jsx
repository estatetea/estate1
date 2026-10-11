import { useState } from 'react';
import { toast } from 'sonner';
import { Wallet, RefreshCw, AlertCircle } from 'lucide-react';
import { Field, inputClass } from './form-bits';

const METHODS = [['upi', 'UPI'], ['cash', 'Cash'], ['bank_transfer', 'Bank transfer'], ['other', 'Other']];

// Owner records an off-Razorpay payment; Steward audits it and unlocks delivery.
export const ManualPaymentForm = ({ order, headers, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState('upi');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState(order.total_amount != null ? String(order.total_amount) : '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!['AWAITING_PAYMENT', 'AWAITING_LEDGER_CONFIRMATION'].includes(order.status)) return null;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/40 text-sm text-[#e6d4a2] transition-colors hover:bg-[#D4AF37]/[0.08]" data-testid="manual-payment-open">
        <Wallet className="h-4 w-4" /> Mark paid manually
      </button>
    );
  }

  const save = async () => {
    if (reference.trim().length < 3) { setError('Enter the UPI / transaction / receipt reference.'); return; }
    if (!(Number(amount) > 0)) { setError('Enter the amount received.'); return; }
    setSaving(true); setError(null);
    try {
      const id = order.internal_order_id || order.order_id;
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}/manual-payment`, {
        method: 'POST', headers,
        body: JSON.stringify({ method, reference: reference.trim(), amount_received: Number(amount), note: note.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.error || `Could not record payment (${res.status}).`);
      toast.success('Payment recorded — delivery unlocked');
      await onSaved();
    } catch (e) {
      setError(e.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.03] p-4 animate-in fade-in" data-testid="manual-payment-form">
      <p className="flex items-center gap-2 text-sm text-[#e6d4a2]"><Wallet className="h-4 w-4" />Record a payment received outside Razorpay</p>
      <div className="grid grid-cols-4 gap-2">
        {METHODS.map(([value, label]) => (
          <button key={value} type="button" onClick={() => setMethod(value)} className={`h-10 rounded-lg border text-xs transition-colors ${method === value ? 'border-[#D4AF37]/70 bg-[#D4AF37]/10 text-[#f1dc9c]' : 'border-white/10 text-gray-400 hover:border-white/25'}`} data-testid={`manual-payment-method-${value}`}>{label}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
        <Field label="Payment reference" id="manual-payment-reference"><input id="manual-payment-reference" value={reference} onChange={e => setReference(e.target.value)} placeholder="UPI txn ID / receipt no." className={inputClass} data-testid="manual-payment-reference-input" /></Field>
        <Field label="Amount received ₹" id="manual-payment-amount"><input id="manual-payment-amount" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} className={inputClass} data-testid="manual-payment-amount-input" /></Field>
      </div>
      <Field label="Note (optional)" id="manual-payment-note"><input id="manual-payment-note" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Paid to 98xxxxxx via GPay" className={inputClass} data-testid="manual-payment-note-input" /></Field>
      {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/[0.06] p-3 text-sm text-red-200" data-testid="manual-payment-error"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-xl border border-white/10 px-4 text-sm text-gray-400 hover:text-white" data-testid="manual-payment-cancel">Back</button>
        <button type="button" onClick={save} disabled={saving} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] text-sm font-semibold text-black hover:bg-[#e2c04d] disabled:opacity-50" data-testid="manual-payment-save">
          {saving && <RefreshCw className="h-4 w-4 animate-spin" />}{saving ? 'Recording…' : 'Confirm payment received'}
        </button>
      </div>
      <p className="text-[11px] text-gray-600">Recorded in the order's history with your reference. Only mark paid once the money is in your account.</p>
    </div>
  );
};
