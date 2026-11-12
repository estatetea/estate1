import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { STEWARD_URL } from '@/lib/steward';

export const dynamic = 'force-dynamic';
const OWNER_KEY = () => (process.env.OWNER_CONTROL_KEY || process.env.STEWARD_OWNER_CONTROL_KEY || '').trim();

// Proof photos for a delivery (the sealed parcel at handover, the partner's "trip completed" screen). Stored by Steward,
// deleted on their own 24 hours after the order is delivered.
async function steward(orderId, init) {
  const r = await fetch(`${STEWARD_URL}/api/steward/orders/${encodeURIComponent(orderId)}/proof-photos`, { ...init, cache: 'no-store',
    headers: { 'x-owner-key': OWNER_KEY(), ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } });
  const b = await r.json().catch(() => ({}));
  return NextResponse.json(r.ok ? b : { error: typeof b.detail === 'string' ? b.detail : 'Steward did not accept that' }, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request, { params }) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { orderId } = await params;
  try { return await steward(orderId); } catch { return NextResponse.json({ error: 'Steward is not reachable right now' }, { status: 502 }); }
}

export async function POST(request, { params }) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { orderId } = await params;
  const { image, kind } = await request.json().catch(() => ({}));
  if (typeof image !== 'string' || !image.startsWith('data:image/')) return NextResponse.json({ error: 'Please choose a photo' }, { status: 400 });
  try { return await steward(orderId, { method: 'POST', body: JSON.stringify({ image, kind: kind === 'trip' ? 'trip' : 'parcel' }) }); }
  catch { return NextResponse.json({ error: 'Steward is not reachable right now' }, { status: 502 }); }
}
