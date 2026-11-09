import { NextResponse } from 'next/server';
import { STEWARD_URL } from '@/lib/steward';
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';
export const dynamic = 'force-dynamic';

// The hampers on offer (from Steward): contents, price, and whether they can be ordered today.
export async function GET() {
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/hampers`, { headers: { 'x-internal-service-key': INTERNAL_KEY }, cache: 'no-store' });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(r.ok ? data : { hampers: [] }, { status: r.ok ? 200 : 502, headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ hampers: [] }, { status: 502 }); }
}
