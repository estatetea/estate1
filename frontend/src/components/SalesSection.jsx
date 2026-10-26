import { useMemo, useState } from 'react';

const CHANNELS = [['all', 'All sales'], ['website', 'Website'], ['ai_sales', 'Agent sales'], ['manual', 'Manual invoices']];
const PERIODS = [['today', 'Today'], ['week', '7 days'], ['month', '30 days'], ['all', 'All time']];
const rupees = v => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function startOf(period) {
  if (period === 'all') return null;
  // Day boundaries follow India time so "today" matches the owner's day.
  const ist = new Date(Date.now() + 5.5 * 3600 * 1000);
  ist.setUTCHours(0, 0, 0, 0);
  const days = period === 'week' ? 6 : period === 'month' ? 29 : 0;
  return new Date(ist.getTime() - days * 86400 * 1000 - 5.5 * 3600 * 1000);
}

function summarize(rows) {
  const paid = rows.filter(r => r.payment_verified);
  return {
    orders: rows.length,
    paid: paid.length,
    revenue: paid.reduce((s, r) => s + Number(r.total_amount || 0), 0),
    booked: rows.reduce((s, r) => s + Number(r.total_amount || 0), 0),
    kg: rows.reduce((s, r) => s + Number(r.quantity_kg || 0), 0),
  };
}

function Tile({ label, value }) {
  return <div className="rounded-2xl border border-white/[.07] bg-gradient-to-b from-[#101010] to-[#0a0a0a] p-4"><p className="text-[9px] uppercase tracking-[.16em] text-gray-600">{label}</p><div className="text-2xl font-light text-[#efbd63] mt-2">{value}</div></div>;
}

function Chips({ options, value, onChange }) {
  return <div className="flex flex-wrap gap-2">{options.map(([id, label]) => <button key={id} onClick={() => onChange(id)} className={`rounded-full px-4 py-2 text-xs border transition-colors ${value === id ? 'bg-[#efbd63] text-black border-[#efbd63]' : 'border-white/10 text-gray-400 hover:text-white'}`}>{label}</button>)}</div>;
}

// Website and agent sales straight from Steward's order records; refreshed by the panel's live poll.
export function SalesSection({ sales, loading }) {
  const [channel, setChannel] = useState('all');
  const [period, setPeriod] = useState('today');

  const rows = useMemo(() => {
    const all = [...(sales?.website?.orders || []), ...(sales?.ai_sales?.orders || []), ...(sales?.manual?.orders || [])];
    const since = startOf(period);
    return all
      .filter(r => channel === 'all' || r.sales_channel === channel)
      .filter(r => !since || (r.created_at && new Date(r.created_at) >= since))
      .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  }, [sales, channel, period]);
  const totals = summarize(rows);

  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,.3)]">
    <h2 className="text-xl text-[#efbd63]">Sales</h2>
    <p className="text-xs text-gray-500 mt-1">Website checkouts and agent sales, updated automatically from Steward.</p>
    <div className="mt-5 space-y-3"><Chips options={CHANNELS} value={channel} onChange={setChannel} /><Chips options={PERIODS} value={period} onChange={setPeriod} /></div>
    {sales?.error && <p className="mt-4 text-xs text-red-400">{sales.error}</p>}
    {loading && !sales ? <p className="mt-6 text-sm text-gray-500">Loading sales…</p> : <>
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Orders" value={totals.orders} />
        <Tile label="Paid revenue" value={rupees(totals.revenue)} />
        <Tile label="Booked value" value={rupees(totals.booked)} />
        <Tile label="Tea sold" value={`${Math.round(totals.kg * 1000) / 1000} kg`} />
      </div>
      <div className="mt-5 divide-y divide-white/[.06] rounded-2xl border border-white/[.07]">
        {rows.length === 0 && <p className="p-4 text-sm text-gray-500">No orders in this view yet.</p>}
        {rows.slice(0, 50).map(r => <div key={r.order_id} className="p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-white truncate">{r.customer || 'Customer'} <span className="text-gray-500">· {r.display_order_number}</span></p>
            <p className="text-xs text-gray-500 mt-1">{r.sales_channel === 'website' ? 'Website' : r.sales_channel === 'manual' ? 'Manual invoice' : 'Agent sale'} · {Number(r.quantity_kg || 0)} kg · {r.created_at ? new Date(r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'time not recorded'}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm text-[#efbd63]">{rupees(r.total_amount)}</p>
            <p className={`text-[10px] uppercase tracking-wider mt-1 ${r.payment_verified ? 'text-emerald-400' : 'text-amber-400'}`}>{r.payment_verified ? 'Paid' : 'Awaiting payment'}</p>{r.payment_verified && <p className={`text-[10px] mt-0.5 ${r.confirmation_email === 'sent' ? 'text-gray-500' : 'text-amber-400'}`}>{r.confirmation_email === 'sent' ? 'Confirmation emailed' : 'Confirmation pending'}</p>}
          </div>
        </div>)}
      </div>
    </>}
  </div>;
}
