import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { TeaPurchases } from './TeaPurchases';

const rupees = v => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const thisMonth = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 7);

// Ledger's monthly GST summary, with a CSV for the accountant.
export function GstReport({ headers }) {
  const [month, setMonth] = useState(thisMonth());
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const auth = headers?.Authorization;
  useEffect(() => {
    let alive = true;
    setReport(null); setError('');
    fetch(`/api/admin/gst?month=${month}`, { headers: { Authorization: auth }, cache: 'no-store' })
      .then(async r => { const b = await r.json().catch(() => ({})); if (!r.ok) throw new Error(b.error || 'GST report unavailable'); return b; })
      .then(b => { if (alive) setReport(b); }).catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [month, auth, refresh]);

  const download = async () => {
    const r = await fetch(`/api/admin/gst?month=${month}&format=csv`, { headers: { Authorization: auth } });
    if (!r.ok) return setError('Download failed');
    const url = URL.createObjectURL(await r.blob());
    const a = document.createElement('a'); a.href = url; a.download = `Estate-Tea-GST-${month}.csv`; document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 30000);
  };

  // A readable page for the phone, with Save as PDF (the spreadsheet stays for the accountant).
  const viewPdf = () => {
    if (!report) return;
    const r = report, s = r.summary || {}, esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const label = new Date(`${month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const row = (k, v, strong) => `<tr${strong ? ' class="b"' : ''}><td>${esc(k)}</td><td class="r">${esc(v)}</td></tr>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Estate Tea GST ${esc(label)}</title><style>body{font-family:Arial,sans-serif;color:#191919;max-width:760px;margin:0 auto;padding:18px}h1{font-size:22px;margin:4px 0}.m{color:#777;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}td,th{padding:7px 6px;border-bottom:1px solid #e5e0d6;text-align:left}.r{text-align:right}.b td{font-weight:700;border-top:2px solid #191919}th{font-size:11px;color:#777;text-transform:uppercase}.pdf{margin:10px 0;padding:10px 16px;border:0;border-radius:8px;background:#b88a34;color:#fff;font-weight:600;font-size:14px}@media print{.pdf{display:none}}</style></head><body>
<div class="m">ESTATE TEA · GST REPORT</div><h1>${esc(label)}</h1><div class="m">${r.final ? 'Final (month closed)' : 'Month in progress, not final yet'} · HSN 0902 · 5%</div>
<button class="pdf" onclick="window.print()">Save as PDF</button>
<table>${row('Invoices', r.invoices)}${row('Taxable value', rupees(s.taxable_value))}${row('CGST', rupees(s.cgst))}${row('SGST', rupees(s.sgst))}${row('IGST', rupees(s.igst))}${row('GST on sales', rupees(s.total_gst), true)}
${'net_gst_payable' in s ? row('Less: GST already paid on purchases', '− ' + rupees(s.gst_credit_from_purchases)) + row('Net GST to pay', rupees(s.net_gst_payable), true) : ''}${row('Invoice total', rupees(s.invoice_total))}</table>
<table><tr><th>Invoice</th><th>Date</th><th>Customer</th><th class="r">Taxable</th><th class="r">GST</th><th class="r">Total</th></tr>${(r.rows || []).map(x => `<tr><td>${esc(x.invoice_no)}</td><td>${esc(String(x.invoice_date || '').slice(0, 10))}</td><td>${esc(x.customer)}</td><td class="r">${rupees(x.taxable_value)}</td><td class="r">${rupees(Number(x.cgst || 0) + Number(x.sgst || 0) + Number(x.igst || 0))}</td><td class="r">${rupees(x.invoice_total)}</td></tr>`).join('')}</table>
${r.needs_review?.length ? `<p class="m" style="margin-top:14px">To double-check: ${r.needs_review.map(x => esc(x.invoice_no + ': ' + x.note)).join(' · ')}</p>` : ''}</body></html>`;
    const w = window.open('', '_blank');
    if (!w) return setError('Allow pop-ups to open the report');
    w.document.open(); w.document.write(html); w.document.close();
  };

  const s = report?.summary;
  const tile = (label, value) => <div className="rounded-xl border border-white/[.06] bg-black/20 p-3"><p className="text-[9px] uppercase tracking-wider text-gray-600">{label}</p><p className="mt-1 text-lg text-[#efbd63]">{value}</p></div>;
  return <div className="space-y-4"><div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-xl text-[#efbd63]">Monthly GST report</h2><p className="mt-1 text-xs text-gray-500">Closed and sent to you on the 1st of every month. From Ledger's invoices · HSN 0902 · 5% (CGST + SGST in Tamil Nadu, IGST outside). Ledger only records it; no money is moved.</p>
        {report && <p className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${report.final ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/5 text-gray-400'}`}>{report.final ? `Final · closed ${new Date(report.closed_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })}` : 'Running total · closes on the 1st'}</p>}</div>
      <div className="flex items-center gap-2">
        <input type="month" value={month} max={thisMonth()} onChange={e => e.target.value && setMonth(e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
        <button onClick={viewPdf} disabled={!report} className="flex items-center gap-1.5 rounded-xl bg-[#efbd63] px-3 py-2 text-xs font-medium text-black disabled:opacity-40"><Download className="h-3.5 w-3.5" />View / Save as PDF</button>
        <button onClick={download} disabled={!report?.invoices} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-gray-400 disabled:opacity-40">Spreadsheet</button>
      </div>
    </div>
    {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    {!report && !error && <p className="mt-4 text-sm text-gray-500">Loading…</p>}
    {report && <>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tile('Invoices', report.invoices)}{tile('Taxable value', rupees(s.taxable_value))}{tile('GST on sales', rupees(s.total_gst))}{tile('Invoice total', rupees(s.invoice_total))}
      </div>
      <p className="mt-3 text-xs text-gray-400">CGST {rupees(s.cgst)} · SGST {rupees(s.sgst)} · IGST {rupees(s.igst)}</p>
      {'net_gst_payable' in s && <div className="mt-3 space-y-1 rounded-xl border border-white/[.06] p-3 text-sm">
        <div className="flex justify-between text-gray-400"><span>GST on sales</span><span>{rupees(s.total_gst)}</span></div>
        <div className="flex justify-between text-gray-400"><span>Less: GST already paid on purchases</span><span>− {rupees(s.gst_credit_from_purchases)}</span></div>
        <div className="flex justify-between border-t border-white/[.06] pt-1 text-white"><span>Net GST to pay</span><span className="text-[#efbd63]">{rupees(s.net_gst_payable)}</span></div>
        {s.credit_carried_forward > 0 && <p className="text-[11px] text-emerald-300">{rupees(s.credit_carried_forward)} extra credit carries forward to next month.</p>}
      </div>}
      {report.needs_review?.length > 0 && <div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.05] p-3">
        <p className="text-xs text-amber-300">{report.needs_review.length} invoice{report.needs_review.length === 1 ? '' : 's'} to double-check</p>
        {report.needs_review.slice(0, 6).map(r => <p key={r.invoice_no} className="mt-1 text-[11px] text-gray-400">{r.invoice_no}: {r.note}</p>)}
      </div>}
    </>}
  </div>
  <TeaPurchases headers={headers} month={month} onChange={() => setRefresh(n => n + 1)} /></div>;
}
