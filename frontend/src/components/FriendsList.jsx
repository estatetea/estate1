'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// The boss's friends: Brew recognises them by the WhatsApp number or email they write from, and their home orders
// come with the GST absorbed (they pay the shop price: 250 g ₹180, 500 g ₹360) and free delivery.
export function FriendsList({ headers }) {
  const [rows, setRows] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const load = async () => {
    try {
      const r = await fetch('/api/admin/friends', { headers, cache: 'no-store' }), b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Friends list unavailable'); setRows(b.friends || []); setError('');
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);
  const add = async e => {
    e.preventDefault(); setBusy(true);
    try {
      const r = await fetch('/api/admin/friends', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Could not add them');
      setRows(b.friends || []); setForm({ name: '', phone: '', email: '' }); toast.success(`${b.friend?.name || 'Friend'} added: Brew will give them the friend price`);
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const remove = async f => {
    if (!window.confirm(`Remove ${f.name || f.phone || f.email} from your friends list? Their next orders will be at the normal price.`)) return;
    try {
      const r = await fetch(`/api/admin/friends/${f.id}`, { method: 'DELETE', headers }), b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Could not remove them'); setRows(b.friends || []); toast.success('Removed');
    } catch (e) { toast.error(e.message); }
  };
  const input = 'w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#d7a84b]/40 placeholder:text-gray-600';
  return <div className="rounded-[24px] border border-white/[.07] bg-white/[.02] p-4 sm:p-5">
    <p className="text-[10px] uppercase tracking-[.2em] text-[#b99043]">Friends of the boss</p>
    <h3 className="mt-1 text-lg text-white">Friend price</h3>
    <p className="mt-1 text-xs leading-5 text-gray-500">No delivery fee, and the GST is on you: they pay just the shop price (250 g ₹180, 500 g ₹360, all in). Brew recognises them by the WhatsApp number or email address they write from, and tells them they're a friend of the boss the first time.</p>
    {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
    <form onSubmit={add} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1.3fr_auto]">
      <input className={input} placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} maxLength={80} />
      <input className={input} placeholder="Phone (10 digits)" inputMode="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} maxLength={20} />
      <input className={input} placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} maxLength={254} />
      <button disabled={busy || !(form.phone.trim() || form.email.trim())} className="rounded-2xl bg-gradient-to-r from-[#c9983c] to-[#efc66d] px-5 py-3 text-xs font-medium text-black disabled:opacity-40">{busy ? 'Adding…' : 'Add friend'}</button>
    </form>
    <div className="mt-4 divide-y divide-white/[.05]">
      {rows === null && !error && <p className="py-3 text-xs text-gray-500">Loading…</p>}
      {rows?.length === 0 && <p className="py-3 text-xs text-gray-500">No friends added yet.</p>}
      {(rows || []).map(f => <div key={f.id} className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0"><p className="truncate text-[15px] text-gray-100">{f.name || 'No name'}</p>
          <p className="truncate text-[11px] text-gray-500">{[f.phone, f.email].filter(Boolean).join(' · ')}{f.relationship_id ? ' · has messaged Brew' : ''}</p></div>
        <button onClick={() => remove(f)} className="shrink-0 rounded-xl border border-white/10 px-3 py-1.5 text-[11px] text-gray-400 hover:border-red-400/30 hover:text-red-300">Remove</button>
      </div>)}
    </div>
  </div>;
}
