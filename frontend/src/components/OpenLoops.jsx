'use client';
import { useEffect, useState } from 'react';

const TONE = { waiting_on_you: 'text-amber-300', order_card: 'text-amber-300', unpaid: 'text-[#efbd63]', sample_followup: 'text-[#efbd63]' };
const age = h => h == null ? '' : h < 1 ? 'just now' : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} days`;

// What Brew still has open with customers: so nothing he started goes cold.
export function OpenLoops({ headers }) {
  const [rows, setRows] = useState(null), [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    const load = () => fetch('/api/admin/open-loops', { headers, cache: 'no-store' }).then(r => r.json().then(b => ({ ok: r.ok, b })))
      .then(({ ok, b }) => { if (!live) return; if (!ok) throw new Error(b.error || 'Unavailable'); setRows(b.items || []); setError(''); })
      .catch(e => live && setError(e.message));
    load(); const t = setInterval(load, 60000); return () => { live = false; clearInterval(t); };
  }, []);
  return <section className="rounded-[24px] border border-white/[.07] bg-white/[.02] p-4 sm:p-5">
    <div className="flex items-baseline justify-between"><p className="text-[10px] uppercase tracking-[.22em] text-[#b99043]">Unfinished with customers</p>
      <p className="text-[11px] text-gray-500">{rows ? `${rows.length} open` : ''}</p></div>
    {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
    {rows && !rows.length && <p className="mt-3 text-sm text-gray-500">Nothing open. Brew is on top of everything.</p>}
    <div className="mt-2 divide-y divide-white/[.05]">
      {(rows || []).map((r, i) => <div key={i} className="py-3">
        <div className="flex items-baseline justify-between gap-3"><p className="text-[15px] text-gray-100 truncate">{r.who}</p><span className="shrink-0 text-[11px] text-gray-500">{age(r.age_hours)}</span></div>
        <p className={`mt-0.5 text-[13px] ${TONE[r.kind] || 'text-gray-300'}`}>{r.what}</p>
        {r.next && <p className="mt-0.5 text-[11px] text-gray-600">{r.next}</p>}
      </div>)}
    </div>
  </section>;
}
