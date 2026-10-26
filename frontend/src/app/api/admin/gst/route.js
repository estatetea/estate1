import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { LEDGER_URL } from '@/lib/steward';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';

// Monthly GST report from Ledger: JSON for the app, or ?format=csv for the accountant.
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || '';
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: 'Choose a month' }, { status: 400 });
  const csv = searchParams.get('format') === 'csv';
  try {
    const r = await fetch(`${LEDGER_URL}/api/ledger/reports/gst${csv ? '.csv' : ''}?month=${month}`, { headers: { 'x-internal-service-key': INTERNAL_KEY }, cache: 'no-store' });
    if (!r.ok) return NextResponse.json({ error: 'Ledger could not build the GST report' }, { status: r.status });
    if (csv) return new NextResponse(await r.text(), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="Estate-Tea-GST-${month}.csv"`, 'Cache-Control': 'no-store' } });
    return NextResponse.json(await r.json(), { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Could not reach Ledger' }, { status: 502 }); }
}
