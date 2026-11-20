import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, ChevronDown } from 'lucide-react';

// What each item costs to make, and the profit on it (the owner's sheet, 20 Nov): cost lines (packet, label, bottle…),
// the tea in it, its selling price, then total cost, profit per piece, margin and markup. Accounts uses the same costs.
const rs = v => `${Number(v) < 0 ? '−' : ''}₹${Math.abs(Number(v || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const input = 'w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#d7a84b]/40';
const num = v => String(v ?? '').replace(/[^\d.]/g, '');
const keyOf = name => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

function Line({ label, value, strong, tone }) {
  return <div className={`flex justify-between py-1.5 ${strong ? 'text-sm text-white' : 'text-xs text-gray-400'}`}><span>{label}</span><span className={tone}>{value}</span></div>;
}

export function ProductCosts({ headers }) {
  const auth = headers?.Authorization;
  const [data, setData] = useState(null), [items, setItems] = useState({}), [tea, setTea] = useState(''), [open, setOpen] = useState('250g'), [busy, setBusy] = useState(false), [newName, setNewName] = useState('');
  const call = useCallback(async (opts = {}) => {
    const r = await fetch('/api/admin/accounts/costs', { ...opts, headers: { ...headers, 'Content-Type': 'application/json' }, cache: 'no-store' });
    const b = await r.json().catch(() => ({})); if (!r.ok) throw new Error(b.error || 'Could not load costs'); return b;
  }, [auth]);
  const load = useCallback(async () => { try { const b = await call(); setData(b); setItems(b.items || {}); setTea(b.tea_cost_per_kg ?? ''); } catch (e) { toast.error(e.message); } }, [call]);
  useEffect(() => { load(); }, [load]);
  const teaPerKg = Number(tea) > 0 ? Number(tea) : (data?.tea?.per_kg || 0);
  const calc = it => {
    const other = (it.components || []).reduce((s, c) => s + (Number(c.cost) || 0), 0);
    const teaCost = (Number(it.tea_grams) || 0) / 1000 * teaPerKg, total = other + teaCost, price = Number(it.price_ex_gst) || 0, gst = Number(it.gst_pct ?? 5);
    const profit = price - total;
    return { other, teaCost, total, price, gst, incl: price * (1 + gst / 100), profit, margin: price ? profit / price * 100 : null, markup: total ? profit / total * 100 : null };
  };
  const setItem = (k, f) => setItems(x => ({ ...x, [k]: f(x[k]) }));
  const save = async () => {
    setBusy(true);
    try {
      const clean = Object.fromEntries(Object.entries(items).map(([k, it]) => [k, { ...it, components: (it.components || []).filter(c => String(c.name || '').trim()).map(c => ({ name: c.name.trim(), cost: Number(c.cost) || 0 })),
        tea_grams: Number(it.tea_grams) || 0, price_ex_gst: it.price_ex_gst === '' || it.price_ex_gst == null ? null : Number(it.price_ex_gst), gst_pct: Number(it.gst_pct ?? 5) }]));
      const b = await call({ method: 'PUT', body: JSON.stringify({ tea_cost_per_kg: tea === '' ? null : Number(tea), unit_costs: {}, items: clean }) });
      setData(b); setItems(b.items || {}); toast.success('Costs saved. Accounts uses them from now on.');
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const add = () => {
    const name = newName.trim(); const k = keyOf(name);
    if (name.length < 2 || !k) return toast.error('Give the item a name');
    if (items[k]) return toast.error('That item is already here');
    setItems(x => ({ ...x, [k]: { label: name, components: [{ name: 'Packaging', cost: '' }], tea_grams: 0, price_ex_gst: '', gst_pct: 5 } })); setOpen(k); setNewName('');
  };
  if (!data) return <div className="rounded-[28px] border border-white/[.07] p-6"><Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-500" /></div>;
  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <h2 className="text-xl text-[#efbd63]">Products & costs</h2>
    <p className="mt-1 text-xs text-gray-500">What each item costs to make, and the profit on it. Accounts uses these costs for profit per item and the monthly profit & loss.</p>
    <label className="mt-4 block text-xs text-gray-400">Tea cost per kg (before GST)
      <input value={tea} onChange={e => setTea(num(e.target.value))} inputMode="decimal" placeholder={`From tea purchases: ${rs(data.tea?.per_kg)}`} className={`${input} mt-1`} />
      <span className="mt-1 block text-[10px] text-gray-600">{Number(tea) > 0 ? `₹${tea}/kg = ${rs(Number(tea) / 4)} of tea in a 250 g pack. Clear it to use the average of your tea purchases instead.` : `Using the average of your tea purchases (${data.tea?.source}).`}</span></label>
    <div className="mt-4 space-y-3">
      {Object.entries(items).map(([k, it]) => {
        const c = calc(it), isOpen = open === k;
        return <div key={k} className="rounded-2xl border border-white/[.08]">
          <button onClick={() => setOpen(isOpen ? null : k)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
            <span><span className="block text-sm text-white">{it.label || k}</span>
              <span className="text-[11px] text-gray-500">{!(it.components || []).length && !Number(it.tea_grams) ? 'Costs not added yet: tap to add them' : <>Cost {rs(c.total)}{c.price ? ` · sells ${rs(c.price)} · profit ${rs(c.profit)} (${c.margin.toFixed(2)}%)` : ' · no selling price yet'}</>}</span>
              {!(it.components || []).length && Number(it.tea_grams) > 0 && <span className="block text-[11px] text-amber-300/80">Only the tea is counted: add its packet, label and other costs</span>}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {isOpen && <div className="space-y-3 border-t border-white/[.06] p-4">
            <input value={it.label || ''} onChange={e => setItem(k, x => ({ ...x, label: e.target.value }))} placeholder="Item name" className={input} />
            <p className="text-[11px] uppercase tracking-[.14em] text-gray-500">Cost lines (per piece, before GST)</p>
            {(it.components || []).map((cl, i) => <div key={i} className="grid grid-cols-[1fr_7rem_2.5rem] gap-2">
              <input value={cl.name} onChange={e => setItem(k, x => ({ ...x, components: x.components.map((y, j) => j === i ? { ...y, name: e.target.value } : y) }))} placeholder="e.g. Label" className={input} />
              <input value={cl.cost} onChange={e => setItem(k, x => ({ ...x, components: x.components.map((y, j) => j === i ? { ...y, cost: num(e.target.value) } : y) }))} inputMode="decimal" placeholder="₹" className={input} />
              <button onClick={() => setItem(k, x => ({ ...x, components: x.components.filter((_, j) => j !== i) }))} className="rounded-xl border border-white/10 text-gray-500"><Trash2 className="mx-auto h-3.5 w-3.5" /></button>
            </div>)}
            <button onClick={() => setItem(k, x => ({ ...x, components: [...(x.components || []), { name: '', cost: '' }] }))} className="rounded-xl border border-dashed border-[#D4AF37]/40 px-3 py-2 text-xs text-[#f1dc9c]"><Plus className="mr-1 inline h-3 w-3" />Add a cost line</button>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-[11px] text-gray-400">Tea in it (g)<input value={it.tea_grams ?? ''} onChange={e => setItem(k, x => ({ ...x, tea_grams: num(e.target.value) }))} inputMode="decimal" className={`${input} mt-1`} /></label>
              <label className="text-[11px] text-gray-400">Price before GST<input value={it.price_ex_gst ?? ''} onChange={e => setItem(k, x => ({ ...x, price_ex_gst: num(e.target.value) }))} inputMode="decimal" className={`${input} mt-1`} /></label>
              <label className="text-[11px] text-gray-400">GST %<select value={String(it.gst_pct ?? 5)} onChange={e => setItem(k, x => ({ ...x, gst_pct: Number(e.target.value) }))} className={`${input} mt-1`}>{[0, 5, 12, 18].map(g => <option key={g} value={g} className="bg-[#111]">{g}%</option>)}</select></label>
            </div>
            <div className="rounded-2xl border border-white/[.07] p-3">
              {(it.components || []).filter(x => x.name).map((x, i) => <Line key={i} label={x.name} value={rs(x.cost)} />)}
              {Number(it.tea_grams) > 0 && <Line label={`Tea (${it.tea_grams} g at ${rs(teaPerKg)}/kg)`} value={rs(c.teaCost)} />}
              <Line label="Total cost" value={rs(c.total)} strong />
              {c.price > 0 && <>
                <Line label={`Selling price (incl. ${c.gst}% GST)`} value={rs(c.incl)} />
                <Line label="Selling price (excl. GST)" value={rs(c.price)} />
                <Line label="GST collected per piece" value={rs(c.incl - c.price)} />
                <Line label="Gross profit per piece" value={rs(c.profit)} strong tone={c.profit < 0 ? 'text-red-400' : 'text-emerald-300'} />
                <Line label="Gross margin" value={`${c.margin.toFixed(2)}%`} strong />
                {c.markup != null && <Line label="Markup on cost" value={`${c.markup.toFixed(2)}%`} />}
              </>}
            </div>
            <button onClick={() => window.confirm(`Remove ${it.label || k} from Products & costs?`) && setItems(x => { const y = { ...x }; delete y[k]; return y; })} className="text-xs text-red-300/80">Remove this item</button>
          </div>}
        </div>;
      })}
    </div>
    <div className="mt-3 flex gap-2">
      <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Add an item (e.g. Gift box, 1 kg pack, Cookies)" className={input} />
      <button onClick={add} className="shrink-0 rounded-xl border border-[#D4AF37]/50 px-3 text-xs text-[#f1dc9c]"><Plus className="h-4 w-4" /></button>
    </div>
    <button onClick={save} disabled={busy} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#c9983c] to-[#efc66d] py-3 text-sm font-medium text-black disabled:opacity-50">{busy ? 'Saving…' : 'Save costs'}</button>
    <p className="mt-2 text-[10px] text-gray-600">For a custom item (e.g. "Gift box") use the same name as on its invoice, so Accounts matches its sales. Count packets and labels here per piece, or as Packaging expenses, not both.</p>
  </div>;
}
