import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download, Plus, Trash2, Camera, Check, ChevronLeft, Loader2 } from 'lucide-react';
import { ProductCosts } from './ProductCosts';

// Accounts and projects (20 Nov): profit per item, monthly profit & loss, expenses with bill photos, who owes what,
// and projects with budgets and a task board. The same panel in the owner app and the team app.
const rs = v => `${Number(v) < 0 ? '−' : ''}₹${Math.abs(Number(v || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;
const thisMonth = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 7);
const today = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
const monthName = m => new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
const shift = (m, d) => { const [y, mo] = m.split('-').map(Number); const t = new Date(y, mo - 1 + d, 1); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`; };
const input = 'w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#d7a84b]/40';
const chip = on => `rounded-xl px-3 py-2 text-sm ${on ? 'bg-[#d7a84b]/15 text-[#efbd63]' : 'text-gray-400'}`;
const Box = ({ children, className = '' }) => <div className={`rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6 ${className}`}>{children}</div>;
const Row = ({ label, value, strong, tone = '', sub }) => <div className={`flex justify-between gap-3 py-1.5 ${strong ? 'border-t border-white/[.07] pt-2.5 text-sm text-white' : 'text-xs text-gray-400'}`}>
  <span>{label}{sub && <span className="block text-[10px] text-gray-600">{sub}</span>}</span><span className={tone}>{value}</span></div>;

function useApi(headers) {
  const auth = headers?.Authorization;
  return useCallback(async (path, opts = {}) => {
    const r = await fetch(`/api/admin/accounts/${path}`, { ...opts, headers: { ...headers, 'Content-Type': 'application/json' }, cache: 'no-store' });
    const b = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(b.error || 'Something went wrong');
    return b;
  }, [auth]);
}

function MonthPicker({ month, setMonth }) {
  return <div className="flex items-center justify-between rounded-2xl border border-white/[.07] px-2 py-1.5">
    <button onClick={() => setMonth(shift(month, -1))} className="px-3 py-1 text-gray-400">‹</button>
    <span className="text-sm text-white">{monthName(month)}</span>
    <button onClick={() => setMonth(shift(month, 1))} disabled={month >= thisMonth()} className="px-3 py-1 text-gray-400 disabled:opacity-30">›</button>
  </div>;
}

function csv(rows) {
  return rows.map(r => r.map(v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n');
}
function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---- Profit: P&L for the month + profit per item + item costs ----
function Profit({ api, headers }) {
  const [month, setMonth] = useState(thisMonth()), [p, setP] = useState(null), [costs, setCosts] = useState(null), [editCosts, setEditCosts] = useState(false), [busy, setBusy] = useState(false);
  const load = useCallback(async () => { setP(null); try { const [a, c] = await Promise.all([api(`pnl?month=${month}`), api('costs')]); setP(a); setCosts(c); } catch (e) { toast.error(e.message); } }, [api, month]);
  useEffect(() => { load(); }, [load]);
  const exportCsv = () => {
    const rows = [[`Estate Tea · Profit & loss · ${monthName(month)}`], [], ['Sales (before GST)', p.sales.total], ['  Items', p.sales.items], ['  Delivery charged', p.sales.delivery],
      ['Cost of goods', p.cost_of_goods], ['Gross profit', p.gross_profit], [], ['Expenses (before GST)', p.expenses.total],
      ...Object.entries(p.expenses.by_category).map(([k, v]) => [`  ${k}`, v]), [], ['Profit', p.profit], [], ['GST collected', p.gst.collected], ['GST paid (credit)', p.gst.paid], ['GST to pay', p.gst.to_pay],
      [], ['Money in', p.money.in], ['Money out', p.money.out], [], ['Item', 'Units', 'kg', 'Sales (before GST)', 'Cost', 'Profit', 'Margin %'],
      ...p.items.map(r => [r.item, r.units, r.kg, r.sales, r.cost, r.profit, r.margin_pct ?? ''])];
    download(`Estate-Tea-PnL-${month}.csv`, csv(rows));
  };
  return <div className="space-y-4">
    <MonthPicker month={month} setMonth={setMonth} />
    {!p ? <Box><Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-500" /></Box> : <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Sales', p.sales.total, ''], ['Gross profit', p.gross_profit, p.gross_profit < 0 ? 'text-red-400' : 'text-emerald-300'], ['Expenses', p.expenses.total, ''], ['Profit', p.profit, p.profit < 0 ? 'text-red-400' : 'text-emerald-300']].map(([l, v, t]) =>
          <div key={l} className="rounded-2xl border border-white/[.07] p-4"><p className="text-[11px] text-gray-500">{l}</p><p className={`mt-1 text-xl ${t || 'text-white'}`}>{rs(v)}</p></div>)}
      </div>
      <Box>
        <div className="flex items-center justify-between"><h3 className="text-lg text-[#efbd63]">Profit & loss</h3>
          <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-gray-300"><Download className="h-3.5 w-3.5" />Excel (CSV)</button></div>
        <p className="mt-1 text-[11px] text-gray-500">{p.orders} paid order{p.orders === 1 ? '' : 's'}. Amounts before GST. Tea costs {rs(p.tea_cost_per_kg.per_kg)}/kg ({p.tea_cost_per_kg.source}).</p>
        <div className="mt-3">
          <Row label="Sales: items" value={rs(p.sales.items)} /><Row label="Sales: delivery charged" value={rs(p.sales.delivery)} />
          <Row label="Cost of goods" sub="tea used + the per-item costs you set" value={`− ${rs(p.cost_of_goods)}`} />
          <Row label="Gross profit" value={rs(p.gross_profit)} strong />
          {Object.entries(p.expenses.by_category).map(([k, v]) => <Row key={k} label={k} value={`− ${rs(v)}`} />)}
          <Row label="Profit" value={rs(p.profit)} strong tone={p.profit < 0 ? 'text-red-400' : 'text-emerald-300'} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/[.07] p-3"><p className="text-xs text-gray-300">GST</p>
            <Row label="Collected on sales" value={rs(p.gst.collected)} /><Row label="Paid on purchases & bills" value={`− ${rs(p.gst.paid)}`} />
            <Row label={p.gst.to_pay >= 0 ? 'To pay' : 'Credit carried forward'} value={rs(Math.abs(p.gst.to_pay))} strong /></div>
          <div className="rounded-2xl border border-white/[.07] p-3"><p className="text-xs text-gray-300">Money (what actually came in and went out)</p>
            <Row label="In (paid orders, with GST)" value={rs(p.money.in)} /><Row label="Out (tea purchases + paid bills)" value={`− ${rs(p.money.out)}`} />
            <Row label="Net" value={rs(p.money.net)} strong tone={p.money.net < 0 ? 'text-red-400' : 'text-emerald-300'} /></div>
        </div>
      </Box>
      <Box>
        <div className="flex items-center justify-between"><h3 className="text-lg text-[#efbd63]">Profit per item</h3>
          <button onClick={() => { if (editCosts) load(); setEditCosts(v => !v); }} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-gray-300">{editCosts ? 'Close' : 'Item costs'}</button></div>
        {editCosts && <div className="mt-3"><ProductCosts headers={headers} /></div>}
        {p.items.length === 0 ? <p className="mt-3 text-sm text-gray-500">No paid sales this month.</p> :
          <div className="mt-3 divide-y divide-white/[.06]">{p.items.map(r => <div key={r.key} className="py-3">
            <div className="flex justify-between text-sm"><span className="text-white">{r.item}</span><span className={r.profit < 0 ? 'text-red-400' : 'text-emerald-300'}>{rs(r.profit)}</span></div>
            <p className="mt-0.5 text-[11px] text-gray-500">{r.units} sold{r.kg ? ` · ${r.kg} kg` : ''} · sales {rs(r.sales)} · cost {rs(r.cost)}{r.margin_pct != null ? ` · ${r.margin_pct}% margin` : ''}{!r.unit_cost_set && !r.kg ? ' · no cost set yet' : ''}</p>
          </div>)}</div>}
      </Box>
    </>}
  </div>;
}

// A phone photo of the bill, shrunk so it uploads quickly.
async function shrink(file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const s = Math.min(1, 1400 / Math.max(img.width, img.height)); const c = document.createElement('canvas');
  c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.72);
}

// ---- Expenses ----
function Expenses({ api, projects }) {
  const [month, setMonth] = useState(thisMonth()), [data, setData] = useState(null), [adding, setAdding] = useState(false), [busy, setBusy] = useState(false);
  const blank = { expense_date: today(), category: '', description: '', payee: '', amount: '', gst_amount: '', paid: true, due_date: '', project_id: '', bill_photo: '' };
  const [f, setF] = useState(blank);
  const load = useCallback(async () => { try { setData(await api(`expenses?month=${month}`)); } catch (e) { toast.error(e.message); } }, [api, month]);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    if (!f.category) return toast.error('Choose a category'); if (!(Number(f.amount) > 0)) return toast.error('Enter the amount');
    setBusy(true);
    try { await api('expenses', { method: 'POST', body: JSON.stringify({ ...f, amount: Number(f.amount), gst_amount: Number(f.gst_amount || 0) }) });
      toast.success('Expense saved'); setF(blank); setAdding(false); if (f.expense_date.slice(0, 7) !== month) setMonth(f.expense_date.slice(0, 7)); else load(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const act = async (e, body, ok) => { try { await api(`expenses/${e.expense_id}`, body); toast.success(ok); load(); } catch (x) { toast.error(x.message); } };
  const showBill = async e => { try { const b = await api(`expenses/${e.expense_id}/bill`); if (!/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(b.data || '')) throw new Error("Couldn't open the bill"); const w = window.open(); if (w) { const img = w.document.createElement('img'); img.src = b.data; img.style.maxWidth = '100%'; w.document.body.appendChild(img); } } catch (x) { toast.error(x.message); } };
  return <div className="space-y-4">
    <MonthPicker month={month} setMonth={setMonth} />
    <Box>
      <div className="flex items-center justify-between"><h3 className="text-lg text-[#efbd63]">Expenses</h3>
        <button onClick={() => setAdding(v => !v)} className="flex items-center gap-1.5 rounded-xl bg-[#d7a84b] px-3 py-1.5 text-xs text-black"><Plus className="h-3.5 w-3.5" />{adding ? 'Close' : 'Add expense'}</button></div>
      {adding && <div className="mt-3 space-y-2 rounded-2xl border border-[#d7a84b]/20 p-4">
        <div className="grid grid-cols-2 gap-2"><input type="date" value={f.expense_date} onChange={e => setF(x => ({ ...x, expense_date: e.target.value }))} className={input} />
          <select value={f.category} onChange={e => setF(x => ({ ...x, category: e.target.value }))} className={input}><option value="" className="bg-[#111]">Category…</option>{(data?.categories || []).map(c => <option key={c} className="bg-[#111]">{c}</option>)}</select></div>
        <input value={f.description} onChange={e => setF(x => ({ ...x, description: e.target.value }))} placeholder="What for (e.g. 500 pouches)" className={input} />
        <input value={f.payee} onChange={e => setF(x => ({ ...x, payee: e.target.value }))} placeholder="Paid to (shop / person)" className={input} />
        <div className="grid grid-cols-2 gap-2"><input value={f.amount} onChange={e => setF(x => ({ ...x, amount: e.target.value.replace(/[^\d.]/g, '') }))} inputMode="decimal" placeholder="Total ₹ (with GST)" className={input} />
          <input value={f.gst_amount} onChange={e => setF(x => ({ ...x, gst_amount: e.target.value.replace(/[^\d.]/g, '') }))} inputMode="decimal" placeholder="GST on the bill ₹ (if any)" className={input} /></div>
        <div className="grid grid-cols-2 gap-2">{[[true, 'Paid'], [false, 'Still to pay']].map(([v, l]) => <button key={l} onClick={() => setF(x => ({ ...x, paid: v }))} className={`rounded-2xl border py-2.5 text-xs ${f.paid === v ? 'border-[#D4AF37]/70 bg-[#D4AF37]/10 text-[#f1dc9c]' : 'border-white/10 text-gray-400'}`}>{l}</button>)}</div>
        {!f.paid && <label className="block text-xs text-gray-400">Pay by<input type="date" value={f.due_date} onChange={e => setF(x => ({ ...x, due_date: e.target.value }))} className={`${input} mt-1`} /></label>}
        {projects.length > 0 && <select value={f.project_id} onChange={e => setF(x => ({ ...x, project_id: e.target.value }))} className={input}><option value="" className="bg-[#111]">Not for a project</option>{projects.map(pr => <option key={pr.project_id} value={pr.project_id} className="bg-[#111]">Project: {pr.name}</option>)}</select>}
        <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-white/15 px-4 py-3 text-xs text-gray-300"><Camera className="h-4 w-4" />{f.bill_photo ? 'Bill photo added ✓ (tap to change)' : 'Add a photo of the bill (optional)'}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async e => { const file = e.target.files?.[0]; if (file) { try { setF(x => ({ ...x, bill_photo: '' })); const d = await shrink(file); setF(x => ({ ...x, bill_photo: d })); } catch { toast.error("Couldn't read that photo"); } } }} /></label>
        <button onClick={save} disabled={busy} className="w-full rounded-2xl bg-gradient-to-r from-[#c9983c] to-[#efc66d] py-3 text-sm font-medium text-black disabled:opacity-50">{busy ? 'Saving…' : 'Save expense'}</button>
      </div>}
      {!data ? <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-gray-500" /> : data.expenses.length === 0 ? <p className="mt-3 text-sm text-gray-500">No expenses in {monthName(month)}.</p> : <>
        <div className="mt-3 flex flex-wrap gap-2">{Object.entries(data.by_category).map(([k, v]) => <span key={k} className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-gray-300">{k}: {rs(v)}</span>)}</div>
        <div className="mt-3 divide-y divide-white/[.06]">{data.expenses.map(e => <div key={e.expense_id} className="py-3">
          <div className="flex justify-between gap-3 text-sm"><span className="text-white">{e.description || e.category}</span><span className="text-white">{rs(e.amount)}</span></div>
          <p className="mt-0.5 text-[11px] text-gray-500">{e.expense_date} · {e.category}{e.payee ? ` · ${e.payee}` : ''}{e.gst_amount ? ` · GST ${rs(e.gst_amount)}` : ''} · by {e.created_by}</p>
          <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
            {e.paid ? <span className="text-emerald-300">Paid</span> : <button onClick={() => act(e, { method: 'PATCH', body: JSON.stringify({ paid: true }) }, 'Marked paid')} className="rounded-lg border border-amber-400/30 px-2 py-1 text-amber-300">Still to pay{e.due_date ? ` (by ${e.due_date})` : ''} · mark paid</button>}
            {e.has_bill && <button onClick={() => showBill(e)} className="rounded-lg border border-white/10 px-2 py-1 text-gray-300">View bill</button>}
            <button onClick={() => window.confirm('Delete this expense?') && act(e, { method: 'DELETE' }, 'Deleted')} className="rounded-lg border border-red-400/20 px-2 py-1 text-red-300"><Trash2 className="inline h-3 w-3" /></button>
          </div></div>)}</div>
        <div className="mt-2 flex justify-between border-t border-white/[.07] pt-3 text-sm"><span className="text-gray-300">Total</span><span className="text-[#efbd63]">{rs(data.total)}</span></div>
      </>}
    </Box>
  </div>;
}

// ---- Owed ----
function Owed({ api }) {
  const [d, setD] = useState(null);
  useEffect(() => { api('owed').then(setD).catch(e => toast.error(e.message)); }, [api]);
  if (!d) return <Box><Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-500" /></Box>;
  return <div className="space-y-4">
    <Box><div className="flex justify-between"><h3 className="text-lg text-[#efbd63]">Customers owe us</h3><span className="text-lg text-white">{rs(d.customers_owe.total)}</span></div>
      <p className="mt-1 text-[11px] text-gray-500">Invoices sent but not paid yet. Old ones can be cancelled from Send invoice.</p>
      {d.customers_owe.invoices.length === 0 ? <p className="mt-3 text-sm text-gray-500">Nothing outstanding.</p> :
        <div className="mt-3 divide-y divide-white/[.06]">{d.customers_owe.invoices.map(r => <div key={r.estate_order_number} className="flex justify-between gap-3 py-2.5 text-sm">
          <span className="min-w-0"><span className="text-white">{r.name || 'Customer'}</span> <span className="font-mono text-xs text-gray-500">{r.estate_order_number}</span>
            <span className={`block text-[11px] ${r.days > 7 ? 'text-amber-300' : 'text-gray-500'}`}>{r.days != null ? `${r.days} day${r.days === 1 ? '' : 's'} ago` : ''}{r.invoice_url && <> · <a href={r.invoice_url} target="_blank" rel="noreferrer" className="text-[#d7a84b]">invoice</a></>}</span></span>
          <span className="shrink-0 text-white">{rs(r.amount)}</span></div>)}</div>}</Box>
    <Box><div className="flex justify-between"><h3 className="text-lg text-[#efbd63]">We owe</h3><span className="text-lg text-white">{rs(d.we_owe.total)}</span></div>
      <p className="mt-1 text-[11px] text-gray-500">Bills saved as "still to pay" in Expenses.</p>
      {d.we_owe.bills.length === 0 ? <p className="mt-3 text-sm text-gray-500">All bills are paid.</p> :
        <div className="mt-3 divide-y divide-white/[.06]">{d.we_owe.bills.map(e => <div key={e.expense_id} className="flex justify-between gap-3 py-2.5 text-sm">
          <span><span className="text-white">{e.payee || e.description || e.category}</span><span className={`block text-[11px] ${e.overdue ? 'text-red-400' : 'text-gray-500'}`}>{e.category}{e.due_date ? ` · ${e.overdue ? 'overdue since' : 'pay by'} ${e.due_date}` : ''}</span></span>
          <span className="shrink-0 text-white">{rs(e.amount)}</span></div>)}</div>}</Box>
  </div>;
}

// ---- Projects + task board ----
const COLS = [['todo', 'To do'], ['doing', 'Doing'], ['done', 'Done']];
function TaskBoard({ api, projectId, people }) {
  const [list, setList] = useState(null), [title, setTitle] = useState(''), [who, setWho] = useState(''), [due, setDue] = useState('');
  const load = useCallback(() => api(`tasks?project_id=${projectId || ''}`).then(b => setList(b.tasks.filter(t => (t.project_id || '') === (projectId || '')))).catch(e => toast.error(e.message)), [api, projectId]);
  useEffect(() => { load(); }, [load]);
  const add = async () => { if (title.trim().length < 2) return;
    try { await api('tasks', { method: 'POST', body: JSON.stringify({ project_id: projectId || '', title: title.trim(), assignee: who, due_date: due }) }); setTitle(''); setDue(''); load(); } catch (e) { toast.error(e.message); } };
  const move = async (t, status) => { try { await api(`tasks/${t.task_id}`, { method: 'PUT', body: JSON.stringify({ project_id: t.project_id || '', title: t.title, assignee: t.assignee || '', due_date: t.due_date || '', note: t.note || '', status }) }); load(); } catch (e) { toast.error(e.message); } };
  const del = async t => { if (!window.confirm('Delete this task?')) return; try { await api(`tasks/${t.task_id}`, { method: 'DELETE' }); load(); } catch (e) { toast.error(e.message); } };
  return <div className="space-y-3">
    <div className="grid gap-2 sm:grid-cols-[1fr_9rem_9rem_auto]">
      <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="New task…" className={input} />
      <select value={who} onChange={e => setWho(e.target.value)} className={input}><option value="" className="bg-[#111]">Anyone</option>{people.map(p => <option key={p} className="bg-[#111]">{p}</option>)}</select>
      <input type="date" value={due} onChange={e => setDue(e.target.value)} className={input} />
      <button onClick={add} className="rounded-2xl bg-[#d7a84b] px-4 py-3 text-sm text-black"><Plus className="h-4 w-4" /></button>
    </div>
    {!list ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-500" /> : <div className="grid gap-3 lg:grid-cols-3">
      {COLS.map(([s, label]) => <div key={s} className="rounded-2xl border border-white/[.07] p-3">
        <p className="text-xs uppercase tracking-[.14em] text-gray-500">{label} · {list.filter(t => t.status === s).length}</p>
        <div className="mt-2 space-y-2">{list.filter(t => t.status === s).map(t => {
          const late = t.due_date && t.status !== 'done' && t.due_date < today();
          return <div key={t.task_id} className="rounded-xl border border-white/[.08] bg-black/30 p-3">
            <p className={`text-sm ${s === 'done' ? 'text-gray-500 line-through' : 'text-white'}`}>{t.title}</p>
            <p className={`mt-0.5 text-[11px] ${late ? 'text-red-400' : 'text-gray-500'}`}>{t.assignee || 'Anyone'}{t.due_date ? ` · ${late ? 'overdue ' : 'due '}${t.due_date}` : ''}</p>
            <div className="mt-2 flex gap-1.5">{COLS.filter(([x]) => x !== s).map(([x, l]) => <button key={x} onClick={() => move(t, x)} className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-gray-300">{x === 'done' ? <><Check className="inline h-3 w-3" /> Done</> : `→ ${l}`}</button>)}
              <button onClick={() => del(t)} className="ml-auto rounded-lg px-1.5 text-red-300/70"><Trash2 className="h-3.5 w-3.5" /></button></div>
          </div>; })}</div>
      </div>)}
    </div>}
  </div>;
}

function Projects({ api, people, onProjects }) {
  const [list, setList] = useState(null), [open, setOpen] = useState(null), [form, setForm] = useState(null), [busy, setBusy] = useState(false);
  const load = useCallback(() => api('projects').then(b => { setList(b.projects); onProjects?.(b.projects); }).catch(e => toast.error(e.message)), [api]);
  useEffect(() => { load(); }, [load]);
  const blank = { name: '', description: '', budget: '', start_date: today(), end_date: '', product_ids: '', status: 'active' };
  const save = async () => {
    setBusy(true);
    try {
      const body = { ...form, budget: Number(form.budget || 0), product_ids: String(form.product_ids || '').split(',').map(s => s.trim()).filter(Boolean) };
      await api(form.project_id ? `projects/${form.project_id}` : 'projects', { method: form.project_id ? 'PUT' : 'POST', body: JSON.stringify(body) });
      toast.success('Project saved'); setForm(null); load();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const pr = list?.find(x => x.project_id === open);
  if (form) return <Box className="space-y-2">
    <button onClick={() => setForm(null)} className="flex items-center gap-1 text-xs text-gray-400"><ChevronLeft className="h-3.5 w-3.5" />Back</button>
    <h3 className="text-lg text-[#efbd63]">{form.project_id ? 'Edit project' : 'New project'}</h3>
    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name (e.g. Christmas collection)" className={input} />
    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="What it's about (optional)" className={`${input} resize-none`} />
    <input value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value.replace(/[^\d.]/g, '') }))} inputMode="decimal" placeholder="Budget ₹ (optional)" className={input} />
    <div className="grid grid-cols-2 gap-2"><label className="text-xs text-gray-400">Starts<input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={`${input} mt-1`} /></label>
      <label className="text-xs text-gray-400">Ends (optional)<input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={`${input} mt-1`} /></label></div>
    <label className="block text-xs text-gray-400">Items whose sales count for this project (optional, comma-separated, e.g. christmas-spirit, 250g)
      <input value={form.product_ids} onChange={e => setForm(f => ({ ...f, product_ids: e.target.value }))} placeholder="christmas-spirit" className={`${input} mt-1`} /></label>
    {form.project_id && <div className="grid grid-cols-2 gap-2">{[['active', 'Active'], ['done', 'Finished']].map(([v, l]) => <button key={v} onClick={() => setForm(f => ({ ...f, status: v }))} className={`rounded-2xl border py-2.5 text-xs ${form.status === v ? 'border-[#D4AF37]/70 bg-[#D4AF37]/10 text-[#f1dc9c]' : 'border-white/10 text-gray-400'}`}>{l}</button>)}</div>}
    <button onClick={save} disabled={busy || form.name.trim().length < 2} className="w-full rounded-2xl bg-gradient-to-r from-[#c9983c] to-[#efc66d] py-3 text-sm font-medium text-black disabled:opacity-50">Save project</button>
  </Box>;
  if (pr) return <div className="space-y-4">
    <button onClick={() => setOpen(null)} className="flex items-center gap-1 text-xs text-gray-400"><ChevronLeft className="h-3.5 w-3.5" />All projects</button>
    <Box>
      <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg text-[#efbd63]">{pr.name}</h3>{pr.description && <p className="mt-1 text-xs text-gray-400">{pr.description}</p>}</div>
        <button onClick={() => setForm({ ...pr, budget: pr.budget || '', product_ids: (pr.product_ids || []).join(', ') })} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-gray-300">Edit</button></div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Budget', pr.budget ? rs(pr.budget) : '—'], ['Spent', rs(pr.spent)], ['Sales', pr.product_ids?.length ? rs(pr.sales.total) : '—'], ['Profit', pr.product_ids?.length ? rs(pr.profit) : '—', pr.product_ids?.length ? (pr.profit < 0 ? 'text-red-400' : 'text-emerald-300') : '']].map(([l, v, t]) =>
          <div key={l} className="rounded-2xl border border-white/[.07] p-3"><p className="text-[11px] text-gray-500">{l}</p><p className={`mt-1 ${t || 'text-white'}`}>{v}</p></div>)}
      </div>
      {pr.budget > 0 && <div className="mt-3"><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full ${pr.budget_used_pct > 100 ? 'bg-red-400' : 'bg-[#d7a84b]'}`} style={{ width: `${Math.min(100, pr.budget_used_pct)}%` }} /></div>
        <p className="mt-1 text-[11px] text-gray-500">{pr.budget_used_pct}% of the budget used · {rs(pr.budget_left)} left. Spend = expenses tagged to this project.</p></div>}
    </Box>
    <Box><h3 className="mb-3 text-lg text-[#efbd63]">Tasks</h3><TaskBoard api={api} projectId={pr.project_id} people={people} /></Box>
    <div className="text-right"><button onClick={async () => { if (window.confirm(`Delete the project "${pr.name}"? Its expenses stay in Expenses.`)) { try { await api(`projects/${pr.project_id}`, { method: 'DELETE' }); setOpen(null); load(); } catch (e) { toast.error(e.message); } } }} className="text-xs text-red-300/80">Delete project</button></div>
  </div>;
  return <div className="space-y-4">
    <Box>
      <div className="flex items-center justify-between"><h3 className="text-lg text-[#efbd63]">Projects</h3>
        <button onClick={() => setForm(blank)} className="flex items-center gap-1.5 rounded-xl bg-[#d7a84b] px-3 py-1.5 text-xs text-black"><Plus className="h-3.5 w-3.5" />New project</button></div>
      {!list ? <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-gray-500" /> : list.length === 0 ? <p className="mt-3 text-sm text-gray-500">No projects yet. A project has a budget, its own expenses and sales, and a task board.</p> :
        <div className="mt-3 grid gap-3 sm:grid-cols-2">{list.map(x => <button key={x.project_id} onClick={() => setOpen(x.project_id)} className="rounded-2xl border border-white/[.08] p-4 text-left hover:border-[#d7a84b]/30">
          <div className="flex justify-between"><span className="text-white">{x.name}</span>{x.status === 'done' && <span className="text-[10px] text-gray-500">FINISHED</span>}</div>
          <p className="mt-1 text-[11px] text-gray-500">Spent {rs(x.spent)}{x.budget ? ` of ${rs(x.budget)}` : ''}{x.product_ids?.length ? ` · sales ${rs(x.sales.total)}` : ''}</p>
          <p className="mt-1 text-[11px] text-gray-500">Tasks: {x.tasks.todo} to do · {x.tasks.doing} doing · {x.tasks.done} done</p>
          {x.budget > 0 && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full ${x.budget_used_pct > 100 ? 'bg-red-400' : 'bg-[#d7a84b]'}`} style={{ width: `${Math.min(100, x.budget_used_pct)}%` }} /></div>}
        </button>)}</div>}
    </Box>
    <Box><h3 className="mb-1 text-lg text-[#efbd63]">Team to-dos</h3><p className="mb-3 text-[11px] text-gray-500">Everyday tasks that aren't part of a project.</p><TaskBoard api={api} projectId="" people={people} /></Box>
  </div>;
}

export function AccountsPanel({ headers, initial = 'profit' }) {
  const api = useApi(headers);
  const [tab, setTab] = useState(initial), [people, setPeople] = useState(['Owner']), [projects, setProjects] = useState([]);
  useEffect(() => { api('people').then(b => setPeople(b.people || ['Owner'])).catch(() => {}); api('projects').then(b => setProjects(b.projects || [])).catch(() => {}); }, [api]);
  const tabs = useMemo(() => [['profit', 'Profit'], ['expenses', 'Expenses'], ['owed', 'Owed'], ['projects', 'Projects']], []);
  return <div className="space-y-4">
    <div className="grid grid-cols-4 gap-1 rounded-2xl border border-white/[.07] p-1">{tabs.map(([id, l]) => <button key={id} onClick={() => setTab(id)} className={chip(tab === id)}>{l}</button>)}</div>
    {tab === 'profit' && <Profit api={api} headers={headers} />}
    {tab === 'expenses' && <Expenses api={api} projects={projects} />}
    {tab === 'owed' && <Owed api={api} />}
    {tab === 'projects' && <Projects api={api} people={people} onProjects={setProjects} />}
  </div>;
}
