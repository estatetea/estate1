import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { STEWARD_URL } from '@/lib/steward';

const OWNER_KEY = (process.env.OWNER_CONTROL_KEY || process.env.STEWARD_OWNER_CONTROL_KEY || '').trim();
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || OWNER_KEY;

// Owner-only ₹1 live payment test: Steward gets an ET number from Ledger and a real Razorpay order.
export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) return NextResponse.json({ error: 'Steward owner connection is not configured' }, { status: 503 });
  const { email, name } = await request.json().catch(() => ({}));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))) return NextResponse.json({ error: 'Enter the email to receive the Razorpay receipt' }, { status: 400 });
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/test-orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-internal-service-key': INTERNAL_KEY },
      body: JSON.stringify({ email, name: String(name || 'Owner live test').slice(0, 120), owner_key: OWNER_KEY }), cache: 'no-store',
    });
    const body = await r.json().catch(() => ({}));
    return NextResponse.json(body, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Could not reach Steward' }, { status: 502 }); }
}
