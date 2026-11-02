import { NextResponse } from 'next/server';
import { STEWARD_URL } from '@/lib/steward';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';

// For website checkout: the delivery charge for a PIN code (only what the customer needs to see).
export async function GET(request) {
  const pin = (new URL(request.url).searchParams.get('pincode') || '').replace(/\D/g, '').slice(0, 6);
  if (pin.length !== 6) return NextResponse.json({ found: false }, { status: 400 });
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/delivery/quote?pincode=${pin}`, { headers: { 'x-internal-service-key': INTERNAL_KEY }, cache: 'no-store' });
    const q = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ found: false }, { status: 200 });
    return NextResponse.json({ found: !!q.found, local: !!q.local, in_bangalore: q.in_bangalore !== false, own_delivery_fee: q.own_delivery_fee ?? null, distance_km: q.distance_km ?? null, place: q.place || null },
      { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ found: false }, { status: 200 }); }
}
