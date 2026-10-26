import { NextResponse } from 'next/server';
import { safeEqual } from '@/lib/admin-auth';
import { LEDGER_URL } from '@/lib/steward';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';
const inr = v => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// 1st of every month: Ledger closes last month's GST report and the owner gets the totals.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !safeEqual(request.headers.get('authorization'), `Bearer ${secret}`)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ist = new Date(Date.now() + 5.5 * 3600 * 1000);
  const prev = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() - 1, 1));
  const month = prev.toISOString().slice(0, 7);
  try {
    const r = await fetch(`${LEDGER_URL}/api/ledger/reports/gst/close?month=${month}`, { method: 'POST', headers: { 'x-internal-service-key': INTERNAL_KEY }, cache: 'no-store' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ error: 'Ledger could not close the month', detail: data.detail }, { status: 502 });
    const report = data.report || {};
    const s = report.summary || {};
    const label = prev.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const review = report.needs_review?.length ? ` ${report.needs_review.length} invoice(s) to double-check.` : '';
    await fetch(new URL('/api/admin/aegis/notifications/send', request.url), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-aegis-alert-secret': process.env.AEGIS_ALERT_SECRET || '' },
      body: JSON.stringify({ title: `Estate Tea: GST report for ${label}`, body: `${report.invoices || 0} invoices · GST to pay ${inr(s.total_gst)} (CGST ${inr(s.cgst)}, SGST ${inr(s.sgst)}, IGST ${inr(s.igst)}) on sales of ${inr(s.taxable_value)}.${review} Download it from Team → Reports.`, severity: 'info', tag: `gst-${month}`, url: '/ai' }),
    }).catch(() => {});
    return NextResponse.json({ ok: true, month, summary: s });
  } catch { return NextResponse.json({ error: 'Could not reach Ledger' }, { status: 502 }); }
}
