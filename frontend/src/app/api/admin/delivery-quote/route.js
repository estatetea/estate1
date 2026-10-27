import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { STEWARD_URL } from '@/lib/steward';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';

// Distance from Estate Tea to a customer's PIN, and which delivery options apply (Steward measures it).
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const pin = (new URL(request.url).searchParams.get('pincode') || '').replace(/\D/g, '').slice(0, 6);
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/delivery/quote?pincode=${pin}`, { headers: { 'x-internal-service-key': INTERNAL_KEY }, cache: 'no-store' });
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status, headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Could not reach Steward' }, { status: 502 }); }
}
