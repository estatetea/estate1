import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { STEWARD_URL } from '@/lib/steward';

const OWNER_KEY = (process.env.OWNER_CONTROL_KEY || process.env.STEWARD_OWNER_CONTROL_KEY || '').trim();

export async function POST(request, { params }) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) return NextResponse.json({ error: 'Owner control is not configured. Nothing was changed.' }, { status: 503 });
  try {
    const { orderId } = await params;
    const response = await fetch(`${STEWARD_URL}/api/steward/orders/${encodeURIComponent(orderId)}/manual-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-owner-key': OWNER_KEY },
      body: JSON.stringify(await request.json()),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not record the payment. Refresh and try again.' }, { status: 502 });
  }
}
