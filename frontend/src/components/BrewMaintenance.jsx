import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Wrench, Loader2 } from 'lucide-react';

// Owner only: switch Brew to "under maintenance" (customers get one kind fixed reply; no chatting or orders) and back.
const when = d => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
export function BrewMaintenance({ headers }) {
  const auth = headers?.Authorization;
  const [s, setS] = useState(null), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false), [edit, setEdit] = useState(false);
  const load = useCallback(async () => {
    try { const r = await fetch('/api/admin/brew-maintenance', { headers, cache: 'no-store' }); const b = await r.json(); if (r.ok) { setS(b); setMsg(b.message || ''); } else setS({ error: b.error }); } catch { setS({ error: 'Could not reach Brew' }); }
  }, [auth]);
  useEffect(() => { load(); }, [load]);
  const flip = async on => {
    if (on && !window.confirm('Put Brew under maintenance? Customers who message get one short reply with your number, and Brew stops chatting and taking orders until you switch it back.')) return;
    setBusy(true);
    try {
      const r = await fetch('/api/admin/brew-maintenance', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ on, message: msg }) });
      const b = await r.json(); if (!r.ok) throw new Error(b.error || 'Could not change it');
      toast.success(on ? 'Brew is under maintenance' : 'Brew is back and chatting'); setEdit(false); load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const on = !!s?.on;
  return <div className={`rounded-[28px] border p-5 sm:p-6 ${on ? 'border-amber-400/40 bg-amber-400/[.05]' : 'border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909]'}`}>
    <div className="flex items-start justify-between gap-3">
      <div><h2 className="flex items-center gap-2 text-xl text-[#efbd63]"><Wrench className="h-5 w-5" />Brew maintenance</h2>
        <p className="mt-1 text-xs text-gray-400">{!s ? 'Loading…' : s.error ? s.error : on ? `ON since ${when(s.since)}. Customers get the maintenance reply; Brew isn't chatting or taking orders.` : 'Off. Brew is chatting with customers as usual.'}</p></div>
      {s && !s.error && <button disabled={busy} onClick={() => flip(!on)} className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${on ? 'bg-emerald-500 text-black' : 'bg-amber-400 text-black'}`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : on ? 'Bring Brew back' : 'Put under maintenance'}</button>}
    </div>
    {s && !s.error && <>
      <p className="mt-4 text-[11px] uppercase tracking-[.14em] text-gray-500">What customers get (once every 12 hours each)</p>
      {edit ? <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} placeholder={s.default_message} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-gray-200 outline-none" />
        : <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/[.06] bg-black/20 p-3 text-sm leading-6 text-gray-300">{(msg || s.default_message).replace('{name}', ' Riya').replace('{phone}', 'your number').replace('{email}', 'your email')}</p>}
      <div className="mt-2 flex gap-3 text-xs">
        <button onClick={() => setEdit(v => !v)} className="text-[#d7a84b]">{edit ? 'Done' : 'Change the wording'}</button>
        {edit && <span className="text-gray-500">{'{name}'}, {'{phone}'} and {'{email}'} are filled in for you. Leave empty for the standard message.</span>}
        {edit && on && <button disabled={busy} onClick={() => flip(true)} className="text-[#d7a84b]">Save</button>}
      </div>
      {on && <div className="mt-4">
        <p className="text-[11px] uppercase tracking-[.14em] text-gray-500">Wrote in while Brew was away · {s.waiting || 0}</p>
        {(s.people || []).length === 0 ? <p className="mt-2 text-xs text-gray-500">Nobody yet.</p> :
          <div className="mt-2 divide-y divide-white/[.06] rounded-2xl border border-white/[.07]">{s.people.map(p => <div key={p.phone} className="p-3 text-xs">
            <p className="text-white">{p.name || 'Customer'} <span className="text-gray-500">{p.phone} · {p.messages} message{p.messages === 1 ? '' : 's'} · {when(p.last_at)}</span></p>
            <p className="mt-0.5 text-gray-400">"{String(p.last || '').slice(0, 140)}"</p></div>)}</div>}
        <p className="mt-2 text-[10px] text-gray-500">Message them back from your own WhatsApp, or when Brew is back.</p>
      </div>}
    </>}
  </div>;
}
