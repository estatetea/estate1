'use client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Home, Truck, BarChart3, Boxes, Receipt, FileText, Mail, LogOut, Loader2, RefreshCw, Wallet } from 'lucide-react';
import { AccountsPanel } from './AccountsPanel';
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
  ['invoice', 'Send invoice', Receipt], ['accounts', 'Accounts', Wallet], ['reports', 'Reports', FileText], ['mail', 'Invoice emails', Mail],
];
const kg = v => `${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg`;
const thisMonth = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 7);

const DEVICE_KEY = 'estate_team_device';
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* */ } } };
function readSession() {
  try { const s = JSON.parse(store.get(KEY) || 'null'); return s?.token ? s : null; } catch { return null; }
}
const input = 'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-base text-white outline-none focus:border-[#D4AF37]/60';
const pinInput = `${input} text-center text-2xl tracking-[.6em] placeholder:text-base placeholder:tracking-normal`;
function Card({ title, sub, children }) {
  return <main className="min-h-[100dvh] bg-[#0A0A0A] px-5 py-10 text-[#F5F5F0] flex items-center justify-center">
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#121212] p-7 space-y-5">
      <div className="flex flex-col items-center text-center">
        <img src={LOGO} alt="Estate Tea" className="h-16 w-16 object-contain" />
        <h1 className="mt-4 text-2xl font-light text-[#D4AF37]">{title}</h1>
        <span className="mt-2 rounded-full border border-[#D4AF37]/50 px-2.5 py-0.5 text-[10px] tracking-[.2em] text-[#D4AF37]">BETA</span>
        {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
      </div>
      {children}
    </div>
  </main>;
}
const Err = ({ children }) => children ? <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-200">{children}</p> : null;
const Gold = ({ busy, disabled, children }) => <button disabled={busy || disabled} className="flex w-full items-center justify-center rounded-xl bg-[#D4AF37] py-3.5 text-sm font-medium text-black disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : children}</button>;
const post = async (url, body) => {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const b = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(b.error || 'Something went wrong'); e.body = b; throw e; }
  return b;
};

// "New phone? Get a link": a code and a link go to their email. Typing the code here registers THIS app (on an iPhone,
// the home-screen app doesn't share Safari's storage, so the code is the way in for the installed app).
function NewPhone({ onBack, onCode }) {
  const [email, setEmail] = useState(''), [code, setCode] = useState(''), [busy, setBusy] = useState(false), [msg, setMsg] = useState(''), [err, setErr] = useState('');
  const send = async e => { e.preventDefault(); setBusy(true); setErr('');
    try { setMsg((await post('/api/team/new-phone', { email: email.trim() })).message); } catch (e2) { setErr(e2.message); } finally { setBusy(false); } };
  const useCode = e => { e.preventDefault(); const c = code.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (c.length === 8) onCode(c); else setErr('The code has 8 letters and numbers, like K7QM-2XPA.'); };
  return <Card title="Sign in on this phone" sub="First time? The owner adds you to the team and gives you a sign-in code (it's also emailed to you). After this, it's just your PIN.">
    <form onSubmit={useCode} className="space-y-3">
      <p className="text-xs text-gray-400">Have a code? Type it here:</p>
      <input value={code} onChange={e => { setCode(e.target.value.toUpperCase().slice(0, 12)); setErr(''); }} autoCapitalize="characters" autoComplete="one-time-code" placeholder="K7QM-2XPA" className={`${input} text-center font-mono tracking-[.3em]`} />
      <Gold disabled={code.replace(/[^A-Za-z0-9]/g, '').length !== 8}>Use this code</Gold>
    </form>
    <div className="space-y-3 border-t border-white/[.07] pt-4">
      <p className="text-xs text-gray-400">Already on the team and need a new code? We'll email it to you.</p>
      {msg ? <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-3 text-sm text-emerald-200">{msg}</p> :
        <form onSubmit={send} className="space-y-3">
          <input value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} type="email" autoCapitalize="none" placeholder="Your email" className={input} />
          <button disabled={busy || !email.trim()} className="w-full rounded-xl border border-[#D4AF37]/60 py-3 text-sm text-[#efbd63] disabled:opacity-40">{busy ? 'Sending…' : 'Email me a new code'}</button>
        </form>}
    </div>
    <Err>{err}</Err>
    {onBack && <button onClick={onBack} className="w-full text-center text-xs text-gray-500">Back</button>}
  </Card>;
}

// The link from the email: choose a PIN the first time (twice), or confirm your PIN on a new phone.
function LinkScreen({ token, kind, onDone, onBack }) {
  const [info, setInfo] = useState(null), [err, setErr] = useState(''), [pin, setPin] = useState(''), [pin2, setPin2] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { fetch(`/api/team/link?token=${encodeURIComponent(token)}`, { cache: 'no-store' }).then(r => r.json().then(b => r.ok ? setInfo(b) : setErr(b.error || 'This link has expired.'))).catch(() => setErr("Couldn't open the link. Try again shortly.")); }, [token]);
  const first = (info?.name || '').split(' ')[0];
  const submit = async e => { e.preventDefault(); if (info.needs_pin && pin !== pin2) return setErr("The two PINs don't match."); setBusy(true); setErr('');
    try { const b = await post('/api/team/link', { token, pin }); store.set(DEVICE_KEY, b.device); onDone({ token: b.token, name: b.member?.name || '' }); }
    catch (e2) { setErr(e2.message); setPin(''); setPin2(''); } finally { setBusy(false); } };
  if (!info) return <Card title="Estate Tea · Team">{err ? <><Err>{err}</Err><button onClick={() => onBack?.()} className="w-full text-center text-xs text-gray-500">Back</button></> : <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-500" />}</Card>;
  return <Card title={`Welcome${first ? `, ${first}` : ''}`} sub={info.needs_pin ? 'Choose your own 6-digit PIN. From now on, your PIN is all you need to sign in.' : 'Type your PIN to sign in on this phone.'}>
    <form onSubmit={submit} className="space-y-4">
      <input value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setErr(''); }} type="password" inputMode="numeric" autoComplete="new-password" placeholder={info.needs_pin ? 'New PIN' : 'Your PIN'} className={pinInput} />
      {info.needs_pin && <input value={pin2} onChange={e => { setPin2(e.target.value.replace(/\D/g, '').slice(0, 6)); setErr(''); }} type="password" inputMode="numeric" autoComplete="new-password" placeholder="Same PIN again" className={pinInput} />}
      {info.needs_pin && <p className="text-[11px] text-gray-500">Not 123456, 000000 or anything easy to guess. Keep it to yourself: it's your own sign-in.</p>}
      <Err>{err}</Err>
      <Gold busy={busy} disabled={pin.length !== 6 || (info.needs_pin && pin2.length !== 6)}>{info.needs_pin ? 'Save my PIN' : 'Sign in'}</Gold>
    </form>
    {kind !== 'code' && <p className="text-[11px] leading-5 text-gray-500">Want it as an app? On iPhone: Share → <b>Add to Home Screen</b>. Then open the app, tap <b>New phone? Get a link</b> and type the code from the new email. On Android it simply carries on in the app.</p>}
  </Card>;
}

// Everyday sign-in: just the PIN (on a registered phone). Whoever's PIN it is gets their own account.
function SignIn({ onDone, onCode }) {
  const [pin, setPin] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [newPhone, setNewPhone] = useState(!store.get(DEVICE_KEY));
  if (newPhone) return <NewPhone onBack={store.get(DEVICE_KEY) ? () => setNewPhone(false) : null} onCode={onCode} />;
  const submit = async e => { e.preventDefault(); if (busy) return; setBusy(true); setErr('');
    try { const b = await post('/api/team/login', { device: store.get(DEVICE_KEY), pin }); onDone({ token: b.token, name: b.member?.name || '' }); }
    catch (e2) { if (e2.body?.unregistered) { store.set(DEVICE_KEY, null); setNewPhone(true); } setErr(e2.message); setPin(''); }
    finally { setBusy(false); } };
  return <Card title="Estate Tea · Team" sub="Orders, deliveries, stock and invoices">
    <form onSubmit={submit} className="space-y-4">
      <input value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setErr(''); }} type="password" inputMode="numeric" autoComplete="current-password" autoFocus placeholder="Your PIN" className={pinInput} />
      <Err>{err}</Err>
      <Gold busy={busy} disabled={pin.length !== 6}>Sign in</Gold>
    </form>
    <div className="flex justify-between text-[11px] text-gray-500"><button onClick={() => setNewPhone(true)}>New phone? Get a link</button><span>Forgot your PIN? Ask the owner.</span></div>
  </Card>;
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
  const [link, setLink] = useState(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search), t = q.get('invite') || q.get('device');
    if (t) setLink({ token: t, kind: q.get('invite') ? 'invite' : 'device' });
    setSession(readSession());
  }, []);
  const signedIn = s => { store.set(KEY, JSON.stringify(s)); setSession(s); setLink(null); try { window.history.replaceState(null, '', '/team'); } catch { /* */ } };
  const signOut = useCallback((why) => { store.set(KEY, null); setSession(null); if (why) toast.error(why); }, []);
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
  if (link) return <LinkScreen token={link.token} kind={link.kind} onDone={signedIn} onBack={() => setLink(null)} />;
  if (!session) return <SignIn onDone={signedIn} onCode={c => setLink({ token: c, kind: 'code' })} />;
  return <div className="min-h-[100dvh] bg-[#0A0A0A] text-white">
    <header className="sticky top-0 z-20 border-b border-white/[.07] bg-[#0A0A0A]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3"><img src={LOGO} alt="" className="h-8 w-8 object-contain" />
          <div><p className="text-sm text-[#D4AF37]">Estate Tea · Team <span className="ml-1 rounded-full border border-[#D4AF37]/50 px-1.5 py-px text-[9px] tracking-[.15em]">BETA</span></p><p className="text-[11px] text-gray-500">{session.name ? `Signed in as ${session.name}` : ''}</p></div></div>
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
      {tab === 'accounts' && <AccountsPanel headers={headers} />}
      {tab === 'reports' && <ReportsPanel headers={headers} />}
      {tab === 'mail' && <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
        <h2 className="text-xl text-[#efbd63]">Invoice emails</h2>
        <p className="mt-1 text-xs text-gray-500">Every order's invoice and order emails: who they went to, when, and whether they arrived. Read-only.</p>
        <div className="mt-4"><LedgerMail headers={headers} /></div></div>}
    </main>
  </div>;
}
