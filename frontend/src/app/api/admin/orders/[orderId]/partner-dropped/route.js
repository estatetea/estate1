import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { STEWARD_URL } from '@/lib/steward';

export const dynamic = 'force-dynamic';
const OWNER_KEY = () => (process.env.OWNER_CONTROL_KEY || process.env.STEWARD_OWNER_CONTROL_KEY || '').trim();

// "Porter says delivered": Brew then asks the customer whether it arrived; 24 hours with no problem closes it as delivered.
export async function POST(request, { params }) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { orderId } = await params;
  const { note } = await request.json().catch(() => ({}));
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/orders/${encodeURIComponent(orderId)}/partner-dropped`, { method: 'POST', cache: 'no-store',
      headers: { 'x-owner-key': OWNER_KEY(), 'Content-Type': 'application/json' }, body: JSON.stringify({ note: String(note || '').slice(0, 300) }) });
    const b = await r.json().catch(() => ({}));
    return NextResponse.json(r.ok ? b : { error: typeof b.detail === 'string' ? b.detail : 'Steward did not accept that' }, { status: r.status });
  } catch { return NextResponse.json({ error: 'Steward is not reachable right now' }, { status: 502 }); }
}
