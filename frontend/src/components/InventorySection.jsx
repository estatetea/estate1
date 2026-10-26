import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const kg = v => (v == null ? '—' : `${Math.round(Number(v) * 1000) / 1000} kg`);

function Tile({ label, value, tone }) {
  return <div className="rounded-2xl border border-white/[.07] bg-gradient-to-b from-[#101010] to-[#0a0a0a] p-4"><p className="text-[9px] uppercase tracking-[.16em] text-gray-600">{label}</p><div className={`text-2xl font-light mt-2 ${tone || 'text-[#efbd63]'}`}>{value}</div></div>;
}

// Shared live stock for Steward, Brew and Aegis. Every change goes to Steward, so Brew's
// stock checks and Aegis see it on their next read.
export function InventorySection({ inventory, headers, onChange }) {
  const inv = inventory?.inventory || inventory || {};
  const [total, setTotal] = useState('');
  const [editingTotal, setEditingTotal] = useState(false);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(null);

  // Follow live stock, but never overwrite a number the owner is typing.
  useEffect(() => { if (!editingTotal && inv.physical_kg != null) setTotal(String(inv.physical_kg)); }, [inv.physical_kg, editingTotal]);

  const send = async (label, request) => {
    setBusy(label);
    try {
      const r = await fetch('/api/admin/inventory', { ...request, headers });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || b.detail || 'Inventory update failed');
      onChange(b);
      return b;
    } catch (e) { toast.error(e.message); return null; } finally { setBusy(null); }
  };

  const setStock = async () => {
    const physical_kg = Number(total);
    if (!Number.isFinite(physical_kg) || physical_kg < 0) return toast.error('Enter a valid stock amount');
    if (await send('set', { method: 'PUT', body: JSON.stringify({ physical_kg }) })) { setEditingTotal(false); toast.success(`Stock set to ${physical_kg} kg`); }
  };
  const change = async action => {
    const quantity_kg = Number(amount);
    if (!Number.isFinite(quantity_kg) || quantity_kg <= 0) return toast.error('Enter how many kg');
    if (await send(action, { method: 'POST', body: JSON.stringify({ action, quantity_kg }) })) {
      setAmount('');
      toast.success(action === 'receive' ? `Added ${quantity_kg} kg to stock` : `Removed ${quantity_kg} kg from stock`);
    }
  };

  const input = 'min-w-0 flex-1 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#d7a84b]/40';
  const primary = 'rounded-2xl bg-gradient-to-r from-[#c9983c] to-[#efc66d] text-black px-5 text-xs font-medium disabled:opacity-50';
  const secondary = 'rounded-2xl border border-white/15 text-gray-300 px-4 text-xs disabled:opacity-50';
  const low = inv.at_protected_floor || inv.inventory_integrity_ok === false;

  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,.3)]">
    <h2 className="text-xl text-[#efbd63]">Inventory</h2>
    <p className="text-xs text-gray-500 mt-1">Shared live stock for Steward, Brew and Aegis. Changes apply everywhere immediately.</p>
    <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Tile label="On hand" value={kg(inv.physical_kg)} />
      <Tile label="Reserved for orders" value={kg(inv.committed_kg)} />
      <Tile label="Protected reserve" value={kg(inv.protected_reserve_kg)} />
      <Tile label="Available to sell" value={kg(inv.sellable_kg)} tone={low ? 'text-red-400' : inv.reorder_warning ? 'text-amber-400' : undefined} />
    </div>
    {low && <p className="mt-3 text-xs text-red-400">Stock is at or below the protected reserve. Restock before taking new orders.</p>}
    {!low && inv.reorder_warning && <p className="mt-3 text-xs text-amber-400">Stock is at the reorder warning level.</p>}
    <p className="mt-6 text-xs uppercase tracking-[.14em] text-gray-500">Received or used tea</p>
    <div className="mt-2 flex gap-2">
      <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" className={input} placeholder="Kg, e.g. 10" />
      <button onClick={() => change('receive')} disabled={!!busy} className={primary}>{busy === 'receive' ? 'Adding…' : 'Add'}</button>
      <button onClick={() => change('remove')} disabled={!!busy} className={secondary}>{busy === 'remove' ? 'Removing…' : 'Remove'}</button>
    </div>
    <p className="mt-6 text-xs uppercase tracking-[.14em] text-gray-500">Stock count (sets the total on hand)</p>
    <div className="mt-2 flex gap-2">
      <input value={total} onFocus={() => setEditingTotal(true)} onChange={e => { setEditingTotal(true); setTotal(e.target.value); }} inputMode="decimal" className={input} placeholder="Total kg on hand" />
      <button onClick={setStock} disabled={!!busy} className={primary}>{busy === 'set' ? 'Saving…' : 'Save'}</button>
      {editingTotal && <button onClick={() => setEditingTotal(false)} className={secondary}>Cancel</button>}
    </div>
    {inv.updated_at && <p className="mt-4 text-[11px] text-gray-600">Last changed {new Date(inv.updated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</p>}
  </div>;
}
