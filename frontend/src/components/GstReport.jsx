import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

const rupees = v => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const thisMonth = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 7);

// Ledger's monthly GST summary, with a CSV for the accountant.
export function GstReport({ headers }) {
  const [month, setMonth] = useState(thisMonth());
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const auth = headers?.Authorization;
  useEffect(() => {
    let alive = true;
    setReport(null); setError('');
    fetch(`/api/admin/gst?month=${month}`, { headers: { Authorization: auth }, cache: 'no-store' })
      .then(async r => { const b = await r.json().catch(() => ({})); if (!r.ok) throw new Error(b.error || 'GST report unavailable'); return b; })
      .then(b => { if (alive) setReport(b); }).catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [month, auth]);

  const download = async () => {
    const r = await fetch(`/api/admin/gst?month=${month}&format=csv`, { headers: { Authorization: auth } });
    if (!r.ok) return setError('Download failed');
    const url = URL.createObjectURL(await r.blob());
    const a = document.createElement('a'); a.href = url; a.download = `Estate-Tea-GST-${month}.csv`; document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 30000);
  };

  const s = report?.summary;
  const tile = (label, value) => <div className="rounded-xl border border-white/[.06] bg-black/20 p-3"><p className="text-[9px] uppercase tracking-wider text-gray-600">{label}</p><p className="mt-1 text-lg text-[#efbd63]">{value}</p></div>;
  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-xl text-[#efbd63]">GST report</h2><p className="mt-1 text-xs text-gray-500">From Ledger's invoices · HSN 0902 · 5% (CGST + SGST in Tamil Nadu, IGST outside)</p></div>
      <div className="flex items-center gap-2">
        <input type="month" value={month} max={thisMonth()} onChange={e => e.target.value && setMonth(e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
        <button onClick={download} disabled={!report?.invoices} className="flex items-center gap-1.5 rounded-xl bg-[#efbd63] px-3 py-2 text-xs font-medium text-black disabled:opacity-40"><Download className="h-3.5 w-3.5" />CSV</button>
      </div>
    </div>
    {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    {!report && !error && <p className="mt-4 text-sm text-gray-500">Loading…</p>}
    {report && <>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tile('Invoices', report.invoices)}{tile('Taxable value', rupees(s.taxable_value))}{tile('GST', rupees(s.total_gst))}{tile('Invoice total', rupees(s.invoice_total))}
      </div>
      <p className="mt-3 text-xs text-gray-400">CGST {rupees(s.cgst)} · SGST {rupees(s.sgst)} · IGST {rupees(s.igst)}</p>
      {report.needs_review?.length > 0 && <div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.05] p-3">
        <p className="text-xs text-amber-300">{report.needs_review.length} invoice{report.needs_review.length === 1 ? '' : 's'} to double-check</p>
        {report.needs_review.slice(0, 6).map(r => <p key={r.invoice_no} className="mt-1 text-[11px] text-gray-400">{r.invoice_no}: {r.note}</p>)}
      </div>}
    </>}
  </div>;
}
