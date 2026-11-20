import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Owner only: who can use the team app (estatetea.in/team), each with their own 6-digit PIN, and what they've changed.
const when = d => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'never';
const WHAT = [[/\/delivery$/, 'updated a delivery'], [/\/proof-photos/, 'added a delivery photo'], [/\/manual-payment/, 'recorded a payment'], [/\/partner-dropped/, 'marked a partner drop-off'],
  [/manual-invoices/, 'sent an invoice'], [/saved-items/, 'changed a saved item'], [/inventory/, 'changed stock'], [/purchases/, 'recorded a tea purchase'], [/print/, 'changed printing']];
const what = a => (WHAT.find(([rx]) => rx.test(a.path)) || [null, `${a.method} ${a.path}`])[1];

export function TeamMembers({ headers }) {
  const [data, setData] = useState({ members: [], activity: [] });
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [shared, setShared] = useState(null);   // the last link made: { name, link, code, emailed }
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
      toast.success(ok); if (b.link) setShared({ name: b.name, link: b.link, code: b.code, emailed: b.emailed }); load(); return true;
    } catch (e) { toast.error(e.message); return false; } finally { setBusy(false); }
  };
  const input = 'w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#d7a84b]/40';
  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <h2 className="text-xl text-[#efbd63]">Team members</h2>
    <p className="mt-1 text-xs text-gray-500">Add someone with their email: they get a link, open it on their phone and choose their own PIN. After that they just type their PIN at <b className="text-gray-300">estatetea.in/team</b>, and it opens their own account. They get Deliveries, Sales, Inventory (stock and purchases, not the packs-on-sale switches), Send invoice, Reports and invoice emails. Never WhatsApp, Brew, Aegis, approvals or settings.</p>
    {shared && <div className="mt-4 rounded-2xl border border-[#d7a84b]/30 bg-[#d7a84b]/[.05] p-4 text-xs text-gray-300">
      <p>{shared.emailed ? `Emailed ${shared.name} their link.` : `The email didn't go out, so share this link with ${shared.name} yourself (only with them):`}</p>
      <div className="mt-2 flex gap-2"><input readOnly value={shared.link} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-gray-400" />
        <button onClick={() => { navigator.clipboard?.writeText(shared.link).then(() => toast.success('Link copied')).catch(() => {}); }} className="shrink-0 rounded-xl border border-white/10 px-3 text-xs text-gray-300">Copy</button></div>
      {shared.code && !shared.emailed && <p className="mt-2 text-gray-300">Or they type this code in the app: <b className="font-mono tracking-widest text-[#efbd63]">{shared.code}</b></p>}
      <p className="mt-2 text-[10px] text-gray-500">The link and code work once and last 7 days.</p>
    </div>}
    <div className="mt-4 divide-y divide-white/[.06] rounded-2xl border border-white/[.07]">
      {data.members.length === 0 && <p className="p-4 text-sm text-gray-500">No team members yet.</p>}
      {data.members.map(m => <div key={m.member_id} className="p-4 space-y-2">
        <div><p className="text-sm text-white">{m.name} {!m.active && <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-400">OFF</span>}</p>
          <p className="text-xs text-gray-500">{[m.email, m.phone].filter(Boolean).join(' · ')}</p>
          <p className="text-[11px] text-gray-500">{m.has_pin ? `PIN set · ${m.phones} phone${m.phones === 1 ? '' : 's'} · last signed in ${when(m.last_login_at)}` : m.link_pending ? 'Link sent, waiting for them to choose their PIN' : 'No PIN yet: send them a link'}</p></div>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => post({ action: 'send_link', member_id: m.member_id }, m.has_pin ? `New-phone link made for ${m.name}` : `Link sent to ${m.name}`)} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-gray-300">{m.has_pin ? 'Link for a new phone' : 'Send link again'}</button>
          {m.has_pin && <button disabled={busy} onClick={() => window.confirm(`Reset ${m.name}'s PIN? They're signed out and choose a new PIN from a fresh link.`) && post({ action: 'reset_pin', member_id: m.member_id }, `${m.name}'s PIN was reset: a link to choose a new one is on its way`)} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-gray-300">Reset PIN</button>}
          {m.phones > 0 && <button disabled={busy} onClick={() => window.confirm(`Sign ${m.name} out of all their phones? They'll need a new link to sign in again.`) && post({ action: 'signout_phones', member_id: m.member_id }, `${m.name} is signed out of all phones`)} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-gray-300">Sign out phones</button>}
          <button disabled={busy} onClick={() => post({ action: 'active', member_id: m.member_id, active: !m.active }, m.active ? `${m.name} is switched off (signed out now)` : `${m.name} can sign in again`)}
            className={`rounded-xl border px-3 py-1.5 text-xs ${m.active ? 'border-amber-400/30 text-amber-300' : 'border-emerald-400/30 text-emerald-300'}`}>{m.active ? 'Switch off' : 'Switch on'}</button>
          <button disabled={busy} onClick={() => window.confirm(`Remove ${m.name} from the team?`) && post({ action: 'remove', member_id: m.member_id }, `${m.name} removed`)} className="rounded-xl border border-red-400/30 px-3 py-1.5 text-xs text-red-300">Remove</button>
        </div>
      </div>)}
    </div>
    <div className="mt-4 rounded-2xl border border-white/[.07] p-4 space-y-2">
      <p className="text-xs uppercase tracking-[.14em] text-gray-500">Add a member</p>
      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className={input} />
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" autoCapitalize="none" placeholder="Email (their link goes here)" className={input} />
        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} inputMode="tel" placeholder="Phone (optional, for your records)" className={input} />
      </div>
      <button disabled={busy || form.name.trim().length < 2 || !form.email.trim()}
        onClick={async () => { if (await post({ action: 'add', ...form }, `${form.name.trim()} added`)) setForm({ name: '', phone: '', email: '' }); }}
        className="w-full rounded-2xl bg-gradient-to-r from-[#c9983c] to-[#efc66d] py-3 text-sm font-medium text-black disabled:opacity-40">Add and send their link</button>
      <p className="text-[11px] text-gray-500">They choose their own PIN; you never need to know it. Each PIN belongs to one person, so their PIN opens their own account.</p>
    </div>
    {data.activity.length > 0 && <div className="mt-4">
      <p className="text-xs uppercase tracking-[.14em] text-gray-500">What the team changed</p>
      <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-white/[.06] rounded-2xl border border-white/[.07]">
        {data.activity.map((a, i) => <p key={i} className="p-3 text-xs text-gray-300"><span className="text-white">{a.name}</span> {what(a)} <span className="text-gray-500">· {when(a.at)}</span></p>)}
      </div>
    </div>}
  </div>;
}
