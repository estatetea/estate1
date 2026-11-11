'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const box = 'w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-100 outline-none focus:border-[#d7a84b]/60';
const btn = 'rounded-xl bg-[#d7a84b] px-4 py-2 text-sm font-medium text-black disabled:opacity-50';
const ghost = 'rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 disabled:opacity-50';

function Switch({ on, onClick, busy, label }) {
  return <button disabled={busy} onClick={onClick} aria-label={label}
    className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-[#d7a84b]' : 'bg-white/15'} disabled:opacity-50`}>
    <span className={`absolute top-1 h-5 w-5 rounded-full bg-black transition-all ${on ? 'left-6' : 'left-1'}`} />
  </button>;
}

const blank = { name: '', size: '', price: '', gst_rate: 18, quantity: '', uncounted: false, description: '', image: '' };

function ItemForm({ start, onSave, onCancel, busy }) {
  const [f, setF] = useState(start);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const save = () => {
    if (!String(f.name).trim()) return toast.error('Give the item a name');
    if (!(Number(f.price) > 0)) return toast.error('Enter the price in rupees, GST included');
    if (!f.uncounted && (f.quantity === '' || !(Number(f.quantity) >= 0))) return toast.error('Enter how many are available, or tick "Not counted yet"');
    onSave({ name: f.name.trim(), size: f.size.trim(), price: Number(f.price), gst_rate: Number(f.gst_rate), description: f.description.trim(), image: f.image.trim(),
      ...(f.uncounted ? { uncounted: true } : { quantity: Math.floor(Number(f.quantity)) }) });
  };
  return <div className="mt-3 space-y-2 rounded-2xl border border-white/[.08] bg-black/30 p-3">
    <div className="grid grid-cols-2 gap-2">
      <input className={box} value={f.name} onChange={e => set('name', e.target.value)} placeholder="Name, e.g. Plum Cake" />
      <input className={box} value={f.size} onChange={e => set('size', e.target.value)} placeholder="Size, e.g. 500 g" />
      <input className={box} value={f.price} onChange={e => set('price', e.target.value)} inputMode="decimal" placeholder="Price ₹ (GST incl.)" />
      <select className={box} value={f.gst_rate} onChange={e => set('gst_rate', e.target.value)}>{[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>GST {g}%</option>)}</select>
      <input className={box} value={f.uncounted ? '' : f.quantity} disabled={f.uncounted} onChange={e => set('quantity', e.target.value)} inputMode="numeric" placeholder="How many available" />
      <label className="flex items-center gap-2 text-xs text-gray-400"><input type="checkbox" checked={f.uncounted} onChange={e => set('uncounted', e.target.checked)} />Not counted yet (no limit)</label>
    </div>
    <textarea className={box} rows={2} value={f.description} onChange={e => set('description', e.target.value)} placeholder="Description for the website" />
    <input className={box} value={f.image} onChange={e => set('image', e.target.value)} placeholder="Image path, e.g. /images/collection/plum-cake.png" />
    <div className="flex gap-2"><button className={btn} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button><button className={ghost} onClick={onCancel}>Cancel</button></div>
  </div>;
}

// The seasonal collection: rename it when Christmas is over, open it to the public when ready, and keep each item's
// count right. Website checkouts, Brew and manual invoices all sell from these numbers.
export function CollectionSettings({ headers }) {
  const [data, setData] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(null);
  const [editing, setEditing] = useState(null), [counts, setCounts] = useState({}), [meta, setMeta] = useState(null);
  const load = async () => {
    try {
      const r = await fetch('/api/admin/collection', { headers, cache: 'no-store' }), b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Collection unavailable'); setData(b); setError('');
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);
  const put = async (key, body, ok) => {
    setBusy(key);
    try {
      const r = await fetch('/api/admin/collection', { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Could not save it');
      setData(b); if (ok) toast.success(ok); return true;
    } catch (e) { toast.error(e.message); return false; } finally { setBusy(null); }
  };
  const s = data?.settings || {};
  const togglePublic = () => {
    if (!s.public && !window.confirm(`Open "${s.name}" to everyone on the website? Customers will be able to order straight away.`)) return;
    put('public', { settings: { public: !s.public } }, s.public ? 'Collection hidden: the website shows "coming soon"' : 'Collection is now live on the website');
  };
  // Opens the website's collection page in a new tab with a 6-hour preview pass (only the preview: no admin access).
  const preview = async () => {
    const tab = window.open('', '_blank');
    setBusy('preview');
    try {
      const r = await fetch('/api/admin/collection/preview', { headers, cache: 'no-store' }), b = await r.json().catch(() => ({}));
      if (!r.ok || !b.token) throw new Error(b.error || 'Could not open the preview');
      const url = `${window.location.origin}/#collection-preview=${encodeURIComponent(b.token)}`;
      if (tab) tab.location.href = url; else window.location.href = url;
    } catch (e) { if (tab) tab.close(); toast.error(e.message); } finally { setBusy(null); }
  };
  const saveCount = it => {
    const v = counts[it.product_id];
    if (v === undefined || v === '' || !(Number(v) >= 0)) return toast.error('Enter how many are available (0 or more)');
    put(it.product_id, { product_id: it.product_id, item: { quantity: Math.floor(Number(v)) } }, `${it.name}: ${Math.floor(Number(v))} available`)
      .then(ok => ok && setCounts(c => { const n = { ...c }; delete n[it.product_id]; return n; }));
  };

  return <div className="rounded-[24px] border border-white/[.07] bg-white/[.02] p-4">
    <div className="flex items-baseline justify-between"><p className="text-[10px] uppercase tracking-[.2em] text-gray-500">Collection</p><p className="text-[10px] text-gray-600">Website · Brew · invoices</p></div>
    {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
    {data && <>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0"><p className="text-[15px] text-gray-100">{s.name}</p>
          <p className={`text-[11px] ${s.public ? 'text-emerald-400' : 'text-amber-300'}`}>{s.public ? 'Public: customers can order on the website' : 'Hidden: the website shows "coming soon" (you can preview it)'}</p></div>
        <Switch on={!!s.public} busy={busy === 'public'} onClick={togglePublic} label={s.public ? 'Hide the collection' : 'Make the collection public'} />
      </div>
      <button className="mt-2 mr-4 text-xs text-[#d7a84b]" disabled={busy === 'preview'} onClick={preview}>{busy === 'preview' ? 'Opening…' : s.public ? 'Open the page on the website' : 'Preview the page on the website'}</button>
      {meta ? <div className="mt-3 space-y-2 rounded-2xl border border-white/[.08] bg-black/30 p-3">
        <input className={box} value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))} placeholder="Collection name, e.g. The Easter Collection" />
        <input className={box} value={meta.tagline} onChange={e => setMeta(m => ({ ...m, tagline: e.target.value }))} placeholder="One line under the name" />
        <label className="block text-xs text-gray-400">Free delivery until (leave empty for none)
          <input type="date" className={`${box} mt-1`} value={meta.free_delivery_until} onChange={e => setMeta(m => ({ ...m, free_delivery_until: e.target.value }))} /></label>
        <div className="flex gap-2">
          <button className={btn} disabled={busy === 'meta'} onClick={() => { if (!meta.name.trim()) return toast.error('The collection needs a name');
            put('meta', { settings: { name: meta.name.trim(), tagline: meta.tagline.trim(), free_delivery_until: meta.free_delivery_until } }, 'Collection saved').then(ok => ok && setMeta(null)); }}>{busy === 'meta' ? 'Saving…' : 'Save'}</button>
          <button className={ghost} onClick={() => setMeta(null)}>Cancel</button></div>
      </div> : <button className="mt-2 text-xs text-[#d7a84b]" onClick={() => setMeta({ name: s.name || '', tagline: s.tagline || '', free_delivery_until: s.free_delivery_until || '' })}>
        Rename / change offer{s.free_delivery_until ? ` · free delivery until ${new Date(s.free_delivery_until + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</button>}

      <div className="mt-3 divide-y divide-white/[.05] border-t border-white/[.06]">
        {(data.items || []).map(it => <div key={it.product_id} className="py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0"><p className="text-[15px] text-gray-100">{it.name}{it.size ? `, ${it.size}` : ''} · ₹{it.price}</p>
              <p className={`text-[11px] ${!it.active ? 'text-gray-500' : it.available > 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                {!it.active ? 'Switched off' : !it.counted ? 'On sale · not counted yet (no limit)' : it.available > 0 ? `On sale · ${it.available} left` : 'Sold out'}
                {it.held > 0 ? ` · ${it.held} held by unpaid orders` : ''}{it.sold > 0 ? ` · ${it.sold} sold` : ''}</p></div>
            <Switch on={!!it.active} busy={busy === it.product_id} label={`${it.active ? 'Switch off' : 'Switch on'} ${it.name}`}
              onClick={() => put(it.product_id, { product_id: it.product_id, item: { active: !it.active } }, `${it.name} ${it.active ? 'switched off' : 'on sale'}`)} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input className={`${box} max-w-[9rem]`} inputMode="numeric" placeholder={it.counted ? `Available: ${it.quantity}` : 'How many?'}
              value={counts[it.product_id] ?? ''} onChange={e => setCounts(c => ({ ...c, [it.product_id]: e.target.value }))} />
            <button className={ghost} disabled={busy === it.product_id} onClick={() => saveCount(it)}>Set count</button>
            <button className="text-xs text-[#d7a84b]" onClick={() => setEditing(it.product_id)}>Edit</button>
          </div>
          {editing === it.product_id && <ItemForm busy={busy === it.product_id}
            start={{ ...blank, name: it.name, size: it.size || '', price: it.price, gst_rate: Math.round((it.gst_rate ?? 0.18) * 100), quantity: it.quantity ?? '', uncounted: !it.counted, description: it.description || '', image: it.image || '' }}
            onCancel={() => setEditing(null)} onSave={item => put(it.product_id, { product_id: it.product_id, item }, `${item.name} saved`).then(ok => ok && setEditing(null))} />}
        </div>)}
      </div>
      {editing === 'new' ? <ItemForm start={blank} busy={busy === 'new'} onCancel={() => setEditing(null)}
        onSave={item => put('new', { item }, `${item.name} added (switched off until you turn it on)`).then(ok => ok && setEditing(null))} />
        : <button className={`${ghost} mt-2 w-full`} onClick={() => setEditing('new')}>+ Add an item</button>}
      <p className="mt-2 text-[10px] leading-4 text-gray-600">The count is how many you have right now. Unpaid orders hold items (website 30 min, invoices 48 h); paid orders take them off the count. When Christmas is over, rename the collection and switch its items off.</p>
    </>}
  </div>;
}
