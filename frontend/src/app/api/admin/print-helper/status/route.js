import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { LEDGER_URL } from '@/lib/steward';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';

// When the laptop print helper last checked in with Ledger.
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const r = await fetch(`${LEDGER_URL}/api/ledger/print-helper/status`, { headers: { 'x-internal-service-key': INTERNAL_KEY }, cache: 'no-store' });
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.ok ? 200 : r.status });
  } catch { return NextResponse.json({ error: 'Could not reach Ledger' }, { status: 502 }); }
}
