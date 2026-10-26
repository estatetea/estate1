import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { LEDGER_URL } from '@/lib/steward';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';

// Ledger's printable bill for a paid order (HTML that opens the print dialog).
export async function GET(request, { params }) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { orderId } = await params;
  try {
    const r = await fetch(`${LEDGER_URL}/api/ledger/orders/${encodeURIComponent(orderId)}/bill`, { headers: { 'x-internal-service-key': INTERNAL_KEY }, cache: 'no-store' });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      return NextResponse.json({ error: typeof data.detail === 'string' ? data.detail : 'The bill is not ready yet' }, { status: r.status });
    }
    return new NextResponse(await r.text(), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Could not reach Ledger' }, { status: 502 }); }
}
