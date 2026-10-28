import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_URL = (process.env.AEGIS_URL || 'https://estate-tea-aegis.vercel.app').replace(/\/$/, '');
const KEY = process.env.INTERNAL_SERVICE_KEY?.trim() || process.env.OWNER_CONTROL_KEY?.trim() || '';

// The Estate Tea Agent Policy, read from Aegis so the owner sees exactly what the agents follow.
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const r = await fetch(`${AEGIS_URL}/api/aegis/policy`, { headers: { 'x-internal-service-key': KEY }, cache: 'no-store' });
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
  } catch { return NextResponse.json({ error: 'Could not reach Aegis' }, { status: 502 }); }
}
