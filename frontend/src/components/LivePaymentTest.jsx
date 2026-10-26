import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const loadRazorpay = () => new Promise(resolve => {
  if (window.Razorpay) return resolve(true);
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = () => resolve(true); s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

// Runs the real live payment path for ₹1: Ledger ET number -> Razorpay order -> payment -> Steward + Ledger verification.
export function LivePaymentTest({ headers }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState(null);

  // After paying, follow verification until both Steward and Ledger agree (or give up after ~2 minutes).
  useEffect(() => {
    if (!run?.paymentId || run.verified) return;
    let stopped = false, tries = 0;
    const poll = async () => {
      tries++;
      try {
        const r = await fetch(`/api/website-orders/${encodeURIComponent(run.order_id)}/status`, { cache: 'no-store' });
        const d = await r.json();
        if (!stopped) setRun(x => ({ ...x, status: d.payment_status || d.status || x.status, verified: Boolean(d.payment_verified), estate_order_number: d.estate_order_number || x.estate_order_number, email: d.confirmation_email }));
        if (d.payment_verified && d.confirmation_email === 'sent') return;
      } catch { /* keep polling */ }
      if (!stopped && tries < 40) setTimeout(poll, 3000);
    };
    poll();
    return () => { stopped = true; };
  }, [run?.paymentId, run?.order_id]);

  const start = async () => {
    setBusy(true);
    try {
      if (!await loadRazorpay()) throw new Error('Could not load Razorpay checkout');
      const r = await fetch('/api/admin/test-order', { method: 'POST', headers, body: JSON.stringify({ email, name }) });
      const order = await r.json();
      if (!r.ok) throw new Error(order.error || order.detail || 'Could not create the test order');
      if (!order.razorpay_order_id) throw new Error('Steward did not create a Razorpay order');
      setRun({ ...order, status: 'AWAITING_PAYMENT' });
      const rzp = new window.Razorpay({
        key: order.razorpay_key_id, amount: 100, currency: 'INR', name: 'Estate Tea',
        description: `Live payment test${order.estate_order_number ? ` · Order ${order.estate_order_number}` : ''}`,
        order_id: order.razorpay_order_id, prefill: { email, ...(name ? { name } : {}) },
        notes: { estate_tea_order_id: order.order_id, estate_order_number: order.estate_order_number || '' },
        theme: { color: '#D4AF37' },
        modal: { ondismiss: () => setBusy(false) },
        handler: async res => {
          setRun(x => ({ ...x, paymentId: res.razorpay_payment_id, status: 'VERIFYING' }));
          await fetch(`/api/website-orders/${encodeURIComponent(order.order_id)}/verify`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ razorpay_payment_id: res.razorpay_payment_id }),
          }).catch(() => {});
          setBusy(false);
        },
      });
      rzp.on('payment.failed', e => { toast.error(e?.error?.description || 'Payment failed'); setBusy(false); });
      rzp.open();
    } catch (e) { toast.error(e.message); setBusy(false); }
  };

  const row = (label, value, mono) => <div className="flex justify-between gap-3 py-1.5 text-xs"><span className="text-gray-500">{label}</span><span className={`text-right text-gray-200 ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span></div>;

  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <h2 className="text-xl text-[#efbd63]">Live payment test (₹1)</h2>
    <p className="text-xs text-gray-500 mt-1">Runs a real ₹1 Razorpay payment through Ledger and Steward so you can see the ET order number end to end. It reserves no stock and is left out of sales. Refund the ₹1 from your Razorpay dashboard afterwards.</p>
    <input value={name} onChange={e => setName(e.target.value)} placeholder="Recipient's name (used in the email greeting)" className="mt-4 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#d7a84b]/40" />
    <div className="mt-2 flex gap-2">
      <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email for the Razorpay receipt" className="min-w-0 flex-1 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#d7a84b]/40" />
      <button onClick={start} disabled={busy || !email} className="rounded-2xl bg-gradient-to-r from-[#c9983c] to-[#efc66d] text-black px-5 text-xs font-medium disabled:opacity-50">{busy ? 'Working…' : 'Pay ₹1'}</button>
    </div>
    {run && <div className="mt-4 rounded-2xl border border-white/[.07] p-4">
      {row('ET order number', run.estate_order_number || 'Not issued: Ledger did not respond', true)}
      {row('Razorpay order', run.razorpay_order_id, true)}
      {row('Razorpay receipt', run.razorpay_receipt, true)}
      {row('Razorpay payment', run.paymentId, true)}
      {row('Status', run.verified ? 'PAID: verified by Steward and Ledger' : run.status)}
      {run.verified && row('Confirmation email', run.email === 'sent' ? `Sent to ${email}` : run.email === 'failed' ? 'Not sent yet, retrying' : 'Sending…')}
      {run.estate_order_number && <p className="mt-2 text-[11px] text-gray-500">Check the website's order tracking with {run.estate_order_number} and {email}.</p>}
    </div>}
  </div>;
}
