'use client';
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const TZ = { timeZone: 'Asia/Kolkata' };
const when = d => d ? new Date(d).toLocaleString('en-IN', { ...TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
const tone = s => !s ? 'text-gray-600' : /bounced|spam|failed|blocked|not sent/.test(s) ? 'text-red-300' : /delivered|opened/.test(s) ? 'text-emerald-400' : /after payment/.test(s) ? 'text-gray-500' : 'text-[#efbd63]';

// Ledger's side of Mail: every order's invoice and order emails, and whether each one actually arrived.
export function LedgerMail({ headers }) {
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [only, setOnly] = useState(false);
  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const r = await fetch('/api/admin/aegis/mail/ledger', { headers, cache: 'no-store' }), b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Invoice mail unavailable'); setData(b); setError('');
    } catch (e) { setError(e.message); } finally { if (!quiet) setLoading(false); }
  };
  useEffect(() => { load(); const t = setInterval(() => { if (document.visibilityState==='visible') load(true); }, 60000); return () => clearInterval(t); }, []);
  const orders = (data?.orders || []).filter(o => !only || o.needs_attention);
  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-gray-500">{loading ? 'Loading…' : `${data?.count || 0} orders · ${data?.needs_attention || 0} need a look`}</p>
      <div className="flex gap-2">
        <button onClick={() => setOnly(v => !v)} className={`rounded-xl border px-3 py-2 text-xs ${only ? 'border-red-300/40 text-red-300' : 'border-white/10 text-gray-400'}`}>{only ? 'Showing problems' : 'Only problems'}</button>
        <button onClick={() => load()} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-gray-400 flex items-center gap-2"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
      </div>
    </div>
    {error && <p className="text-xs text-red-300">{error}</p>}
    {!loading && !orders.length && <p className="text-sm text-gray-500">{only ? 'No problems: every invoice and order email went out.' : 'No orders yet.'}</p>}
    {orders.map(o => <section key={o.order_id} className={`rounded-2xl border p-4 ${o.needs_attention ? 'border-red-300/30 bg-red-300/[.03]' : 'border-white/[.07] bg-white/[.02]'}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[15px] text-gray-100 truncate"><span className="text-[#efbd63]">{o.number}</span> · {o.customer}</p>
        <span className="shrink-0 text-[11px] text-gray-500">{o.total ? `₹${Math.round(o.total)}` : ''} · {o.paid ? 'paid' : 'unpaid'}</span>
      </div>
      <p className="mt-0.5 text-[11px] text-gray-600 truncate">{o.email || 'no email on the order'}{o.created_at ? ` · ${when(o.created_at)}` : ''}</p>
      <div className="mt-3 space-y-2">
        {o.emails.map((e, i) => <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-white/[.05] bg-black/20 px-3 py-2">
          <div className="min-w-0"><p className="text-[13px] text-gray-200">{e.kind}</p>
            <p className="text-[11px] text-gray-600 truncate">{e.to ? `to ${e.to}` : 'no email address'}{e.at ? ` · ${when(e.at)}` : ''}{e.tracked_at ? ` · update ${when(e.tracked_at)}` : ''}</p>
            {e.error && <p className="mt-0.5 text-[11px] text-red-300/90">{e.error}</p>}
            {e.link && <a href={e.link} target="_blank" rel="noreferrer" className="text-[11px] text-[#b99043] underline">Open invoice</a>}</div>
          <span className={`shrink-0 text-[12px] ${tone(e.status)}`}>{e.status || '—'}</span>
        </div>)}
      </div>
    </section>)}
    <p className="text-[10px] leading-4 text-gray-600">Razorpay emails and texts the invoice itself, so it shows as "sent by Razorpay". The order emails (confirmation with the delivery code, on its way, delivered) show whether they were delivered, opened or bounced.</p>
  </div>;
}
