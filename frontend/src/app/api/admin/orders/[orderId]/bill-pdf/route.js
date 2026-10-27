import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { LEDGER_URL } from '@/lib/steward';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';

// The bill as a PDF, so the phone can send it to the Brother app (no AirPrint needed).
export async function GET(request, { params }) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { orderId } = await params;
  try {
    const r = await fetch(`${LEDGER_URL}/api/ledger/orders/${encodeURIComponent(orderId)}/bill.pdf`, { headers: { 'x-internal-service-key': INTERNAL_KEY }, cache: 'no-store' });
    if (!r.ok) return NextResponse.json({ error: 'The bill is not ready yet' }, { status: r.status });
    return new NextResponse(await r.arrayBuffer(), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': r.headers.get('content-disposition') || 'inline', 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Could not reach Ledger' }, { status: 502 }); }
}
