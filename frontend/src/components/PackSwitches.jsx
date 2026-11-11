'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const LABEL = { '250g': '250 g', '500g': '500 g' };   // our only packs: 1 kg goes out as two 500 g

// Which packs are on sale. The same switch the website and Brew use: change it here, by telling Brew, or in the website admin.
export function PackSwitches({ headers }) {
  const [cat, setCat] = useState(null), [busy, setBusy] = useState(null), [error, setError] = useState('');
  const load = async () => {
    try {
      const r = await fetch('/api/admin/packs', { headers, cache: 'no-store' }), b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Packs unavailable'); setCat(b); setError('');
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);
  const flip = async p => {
    setBusy(p.product_id);
    try {
      const r = await fetch('/api/admin/packs', { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: p.product_id, available: !p.enabled }) });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Could not change it');
      setCat(b); toast.success(`${LABEL[p.product_id] ? LABEL[p.product_id] + ' pack' : (p.name || p.weight)} ${p.enabled ? 'switched off' : 'back on sale'}`);
    } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };
  return <div className="rounded-[24px] border border-white/[.07] bg-white/[.02] p-4">
    <div className="flex items-baseline justify-between"><p className="text-[10px] uppercase tracking-[.2em] text-gray-500">Packs on sale</p><p className="text-[10px] text-gray-600">Website · Brew · web app</p></div>
    {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
    <div className="mt-3 divide-y divide-white/[.05]">
      {(cat?.products || []).map(p => <div key={p.product_id} className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0"><p className="text-[15px] text-gray-100">{LABEL[p.product_id] || p.weight}</p>
          <p className={`text-[11px] ${p.in_stock ? 'text-emerald-400' : 'text-amber-300'}`}>{p.in_stock ? 'On sale' : p.reason === 'owner_disabled' ? 'Switched off: shows unavailable' : 'Not enough stock: shows unavailable'}</p></div>
        <button disabled={busy === p.product_id} onClick={() => flip(p)} aria-label={`${p.enabled ? 'Switch off' : 'Switch on'} the ${LABEL[p.product_id]} pack`}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${p.enabled ? 'bg-[#d7a84b]' : 'bg-white/15'} disabled:opacity-50`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-black transition-all ${p.enabled ? 'left-6' : 'left-1'}`} />
        </button>
      </div>)}
    </div>
    <p className="mt-1 text-[10px] leading-4 text-gray-600">Switching a pack off hides it from sale on the website, and Brew tells customers it's unavailable right now. You can also tell Brew "switch 500 g on".</p>
  </div>;
}
