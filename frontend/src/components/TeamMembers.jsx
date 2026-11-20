import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Owner only: who can use the team app (estatetea.in/team), each with their own 6-digit PIN, and what they've changed.
const when = d => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'never';
const WHAT = [[/\/delivery$/, 'updated a delivery'], [/\/proof-photos/, 'added a delivery photo'], [/\/manual-payment/, 'recorded a payment'], [/\/partner-dropped/, 'marked a partner drop-off'],
  [/manual-invoices/, 'sent an invoice'], [/saved-items/, 'changed a saved item'], [/inventory/, 'changed stock'], [/purchases/, 'recorded a tea purchase'], [/print/, 'changed printing']];
const what = a => (WHAT.find(([rx]) => rx.test(a.path)) || [null, `${a.method} ${a.path}`])[1];

export function TeamMembers({ headers }) {
  const [data, setData] = useState({ members: [], activity: [] });
  const [form, setForm] = useState({ name: '', phone: '', email: '', pin: '' });
  const [resetFor, setResetFor] = useState(null), [newPin, setNewPin] = useState('');
  const [busy, setBusy] = useState(false);
  const auth = headers?.Authorization;
  const load = useCallback(async () => {
    try { const r = await fetch('/api/admin/team-members', { headers, cache: 'no-store' }); if (r.ok) setData(await r.json()); } catch { /* keep the last */ }
  }, [auth]);
  useEffect(() => { load(); }, [load]);
  const post = async (body, ok) => {
    setBusy(true);
    try {
      const r = await fetch('/api/admin/team-members', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Could not save');
      toast.success(ok); load(); return true;
    } catch (e) { toast.error(e.message); return false; } finally { setBusy(false); }
  };
  const input = 'w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#d7a84b]/40';
  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <h2 className="text-xl text-[#efbd63]">Team members</h2>
    <p className="mt-1 text-xs text-gray-500">They sign in at <b className="text-gray-300">estatetea.in/team</b> with their phone number or email and their own PIN. They get Deliveries, Sales, Inventory (stock and purchases, not the packs-on-sale switches), Send invoice, Reports and invoice emails. Never WhatsApp, Brew, Aegis, approvals or settings.</p>
    <div className="mt-4 divide-y divide-white/[.06] rounded-2xl border border-white/[.07]">
      {data.members.length === 0 && <p className="p-4 text-sm text-gray-500">No team members yet.</p>}
      {data.members.map(m => <div key={m.member_id} className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><p className="text-sm text-white">{m.name} {!m.active && <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-400">OFF</span>}</p>
            <p className="text-xs text-gray-500">{[m.phone, m.email].filter(Boolean).join(' · ')} · last signed in {when(m.last_login_at)}</p></div>
          <div className="flex shrink-0 gap-2">
            <button disabled={busy} onClick={() => { setResetFor(resetFor === m.member_id ? null : m.member_id); setNewPin(''); }} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-gray-300">New PIN</button>
            <button disabled={busy} onClick={() => post({ action: 'active', member_id: m.member_id, active: !m.active }, m.active ? `${m.name} is switched off (signed out now)` : `${m.name} can sign in again`)}
              className={`rounded-xl border px-3 py-1.5 text-xs ${m.active ? 'border-amber-400/30 text-amber-300' : 'border-emerald-400/30 text-emerald-300'}`}>{m.active ? 'Switch off' : 'Switch on'}</button>
            <button disabled={busy} onClick={() => window.confirm(`Remove ${m.name} from the team?`) && post({ action: 'remove', member_id: m.member_id }, `${m.name} removed`)} className="rounded-xl border border-red-400/30 px-3 py-1.5 text-xs text-red-300">Remove</button>
          </div>
        </div>
        {resetFor === m.member_id && <div className="flex gap-2">
          <input value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="New 6-digit PIN" className={`${input} py-2`} />
          <button disabled={busy || newPin.length !== 6} onClick={async () => { if (await post({ action: 'update', member_id: m.member_id, pin: newPin }, `New PIN set for ${m.name} (they're signed out until they use it)`)) { setResetFor(null); setNewPin(''); } }}
            className="shrink-0 rounded-2xl bg-[#d7a84b] px-4 text-sm text-black disabled:opacity-40">Save</button>
        </div>}
      </div>)}
    </div>
    <div className="mt-4 rounded-2xl border border-white/[.07] p-4 space-y-2">
      <p className="text-xs uppercase tracking-[.14em] text-gray-500">Add a member</p>
      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className={input} />
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} inputMode="tel" placeholder="Phone number" className={input} />
        <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" autoCapitalize="none" placeholder="Email (optional if phone given)" className={input} />
      </div>
      <input value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))} inputMode="numeric" placeholder="Their 6-digit PIN" className={input} />
      <button disabled={busy || form.name.trim().length < 2 || (!form.phone.trim() && !form.email.trim()) || form.pin.length !== 6}
        onClick={async () => { if (await post({ action: 'add', ...form }, `${form.name.trim()} added. They can sign in at estatetea.in/team`)) setForm({ name: '', phone: '', email: '', pin: '' }); }}
        className="w-full rounded-2xl bg-gradient-to-r from-[#c9983c] to-[#efc66d] py-3 text-sm font-medium text-black disabled:opacity-40">Add member</button>
      <p className="text-[11px] text-gray-500">Tell them their PIN yourself. You can set a new one any time; switching someone off signs them out at once.</p>
    </div>
    {data.activity.length > 0 && <div className="mt-4">
      <p className="text-xs uppercase tracking-[.14em] text-gray-500">What the team changed</p>
      <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-white/[.06] rounded-2xl border border-white/[.07]">
        {data.activity.map((a, i) => <p key={i} className="p-3 text-xs text-gray-300"><span className="text-white">{a.name}</span> {what(a)} <span className="text-gray-500">· {when(a.at)}</span></p>)}
      </div>
    </div>}
  </div>;
}
