'use client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Home, Truck, BarChart3, Boxes, Receipt, FileText, Mail, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { DeliveriesSection } from './delivery/DeliveriesSection';
import { SUMMARY_BUCKETS, inBucket } from './delivery/DeliverySummary';
import { SalesSection } from './SalesSection';
import { InventorySection } from './InventorySection';
import { TeaPurchases } from './TeaPurchases';
import { ManualInvoice } from './ManualInvoice';
import { LedgerMail } from './LedgerMail';
import { ReportsPanel } from './AIOpsSwipePanel';

// The team app (20 Nov): the owner's teammates run orders, deliveries, stock and invoices. No WhatsApp, Brew, Aegis,
// approvals or settings here (the server refuses those to a team login too).
const KEY = 'estate_team_session';
const LOGO = 'https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png';
const TABS = [
  ['today', 'Today', Home], ['deliveries', 'Deliveries', Truck], ['sales', 'Sales', BarChart3], ['inventory', 'Inventory', Boxes],
  ['invoice', 'Send invoice', Receipt], ['reports', 'Reports', FileText], ['mail', 'Invoice emails', Mail],
];
const kg = v => `${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg`;
const thisMonth = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 7);

function readSession() {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s?.token ? s : null; } catch { return null; }
}

function SignIn({ onDone }) {
  const [id, setId] = useState(''), [pin, setPin] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const submit = async e => {
    e.preventDefault(); if (busy) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/team/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id.trim(), pin }) });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Could not sign in');
      const s = { token: b.token, name: b.member?.name || '' };
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* still signed in for this visit */ }
      onDone(s);
    } catch (e2) { setErr(e2.message); setPin(''); } finally { setBusy(false); }
  };
  const input = 'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base text-white outline-none focus:border-[#D4AF37]/60';
  return <main className="min-h-[100dvh] bg-[#0A0A0A] px-5 py-10 text-[#F5F5F0] flex items-center justify-center">
    <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#121212] p-7 space-y-5">
      <div className="flex flex-col items-center text-center">
        <img src={LOGO} alt="Estate Tea" className="h-16 w-16 object-contain" />
        <h1 className="mt-4 text-2xl font-light text-[#D4AF37]">Estate Tea · Team</h1>
        <p className="mt-1 text-xs text-gray-500">Orders, deliveries, stock and invoices</p>
      </div>
      <label className="block"><span className="mb-1.5 block text-xs uppercase tracking-[.16em] text-gray-400">Phone number or email</span>
        <input value={id} onChange={e => { setId(e.target.value); setErr(''); }} autoComplete="username" inputMode="email" autoCapitalize="none" className={input} /></label>
      <label className="block"><span className="mb-1.5 block text-xs uppercase tracking-[.16em] text-gray-400">Your 6-digit PIN</span>
        <input value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setErr(''); }} type="password" inputMode="numeric" autoComplete="current-password" className={`${input} tracking-[.5em]`} /></label>
      {err && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-200">{err}</p>}
      <button disabled={busy || !id.trim() || pin.length !== 6} className="flex w-full items-center justify-center rounded-xl bg-[#D4AF37] py-3.5 text-sm font-medium text-black disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}</button>
      <p className="text-center text-[11px] text-gray-600">Forgot your PIN? Ask the owner to reset it.</p>
    </form>
  </main>;
}

function Today({ headers, go }) {
  const [orders, setOrders] = useState(null), [inv, setInv] = useState(null);
  const load = useCallback(async () => {
    const [o, i] = await Promise.all([
      fetch('/api/admin/orders', { headers, cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/admin/inventory', { headers, cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    setOrders(Array.isArray(o) ? o.filter(x => x.source === 'steward') : []); setInv(i);
  }, [headers.Authorization]);
  useEffect(() => { load(); }, [load]);
  if (!orders) return <p className="py-10 text-center text-sm text-gray-500"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></p>;
  const unpaid = orders.filter(o => !o.payment_verified && !o.delivery_status && !['CANCELLED', 'EXPIRED', 'FAILED'].includes(String(o.status || '').toUpperCase()));
  const low = inv && (inv.at_protected_floor || inv.inventory_integrity_ok === false), warn = inv?.reorder_warning;
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {SUMMARY_BUCKETS.map(b => { const n = orders.filter(o => inBucket(b, o)).length; const I = b.icon;
        return <button key={b.id} onClick={() => go('deliveries')} className={`rounded-2xl border p-4 text-left ${b.id === 'exceptions' && n ? 'border-red-400/40 bg-red-400/[.05]' : 'border-white/10 bg-white/[.02]'}`}>
          <I className="h-4 w-4 text-[#D4AF37]" /><p className="mt-3 text-2xl text-white">{n}</p><p className="text-xs text-gray-400">{b.label}</p></button>; })}
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <button onClick={() => go('sales')} className="rounded-2xl border border-white/10 bg-white/[.02] p-4 text-left">
        <p className="text-xs text-gray-400">Waiting for payment</p><p className="mt-1 text-2xl text-amber-300">{unpaid.length}</p>
        <p className="mt-1 text-[11px] text-gray-500">Invoices sent, not paid yet. They don't need packing until they're paid.</p></button>
      <button onClick={() => go('inventory')} className={`rounded-2xl border p-4 text-left ${low ? 'border-red-400/40 bg-red-400/[.05]' : warn ? 'border-amber-400/40 bg-amber-400/[.04]' : 'border-white/10 bg-white/[.02]'}`}>
        <p className="text-xs text-gray-400">Available to sell</p><p className={`mt-1 text-2xl ${low ? 'text-red-400' : warn ? 'text-amber-300' : 'text-white'}`}>{inv ? kg(inv.sellable_kg) : '—'}</p>
        <p className="mt-1 text-[11px] text-gray-500">{low ? 'At the protected reserve: restock before taking new orders.' : warn ? 'At the reorder level: time to restock.' : 'Stock is fine.'}</p></button>
    </div>
    <button onClick={load} className="flex items-center gap-2 text-xs text-gray-500"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
  </div>;
}

export default function TeamApp() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState('today');
  const [sales, setSales] = useState(null), [salesLoading, setSalesLoading] = useState(false);
  const [inventory, setInventory] = useState(null);
  useEffect(() => { setSession(readSession()); }, []);
  const signOut = useCallback((why) => { try { localStorage.removeItem(KEY); } catch { /* */ } setSession(null); if (why) toast.error(why); }, []);
  const headers = session ? { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` } : {};
  // Still allowed? (The owner can switch someone off or reset their PIN: they're signed out at once.)
  useEffect(() => {
    if (!session) return;
    fetch('/api/team/me', { headers, cache: 'no-store' }).then(r => { if (r.status === 401) signOut('Please sign in again.'); }).catch(() => {});
  }, [session?.token]);
  useEffect(() => {
    if (!session) return;
    if (tab === 'sales' && !sales) {
      setSalesLoading(true);
      fetch('/api/admin/sales', { headers, cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(setSales).catch(() => {}).finally(() => setSalesLoading(false));
    }
    if (tab === 'inventory' && !inventory) fetch('/api/admin/inventory', { headers, cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(setInventory).catch(() => {});
  }, [tab, session?.token]);
  if (session === undefined) return <div className="min-h-[100dvh] bg-[#0A0A0A]" />;
  if (!session) return <SignIn onDone={setSession} />;
  return <div className="min-h-[100dvh] bg-[#0A0A0A] text-white">
    <header className="sticky top-0 z-20 border-b border-white/[.07] bg-[#0A0A0A]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3"><img src={LOGO} alt="" className="h-8 w-8 object-contain" />
          <div><p className="text-sm text-[#D4AF37]">Estate Tea · Team</p><p className="text-[11px] text-gray-500">{session.name ? `Signed in as ${session.name}` : ''}</p></div></div>
        <button onClick={() => signOut()} className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-gray-300"><LogOut className="h-3.5 w-3.5" />Sign out</button>
      </div>
      <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-2">
        {TABS.map(([id, label, I]) => <button key={id} onClick={() => setTab(id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm ${tab === id ? 'bg-[#D4AF37]/15 text-[#efbd63]' : 'text-gray-400'}`}><I className="h-4 w-4" />{label}</button>)}
      </nav>
    </header>
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-5">
      {tab === 'today' && <Today headers={headers} go={setTab} />}
      {tab === 'deliveries' && <DeliveriesSection token={session.token} />}
      {tab === 'sales' && <SalesSection sales={sales} loading={salesLoading} />}
      {tab === 'inventory' && <>
        <InventorySection inventory={inventory || {}} headers={headers} onChange={setInventory} showPacks={false} />
        <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
          <TeaPurchases headers={headers} month={thisMonth()} onChange={() => fetch('/api/admin/inventory', { headers, cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(v => v && setInventory(v)).catch(() => {})} />
        </div>
      </>}
      {tab === 'invoice' && <ManualInvoice headers={headers} />}
      {tab === 'reports' && <ReportsPanel headers={headers} />}
      {tab === 'mail' && <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
        <h2 className="text-xl text-[#efbd63]">Invoice emails</h2>
        <p className="mt-1 text-xs text-gray-500">Every order's invoice and order emails: who they went to, when, and whether they arrived. Read-only.</p>
        <div className="mt-4"><LedgerMail headers={headers} /></div></div>}
    </main>
  </div>;
}
