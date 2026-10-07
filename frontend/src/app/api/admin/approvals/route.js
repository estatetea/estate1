import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_TRUST_KEY = process.env.AEGIS_ALERT_SECRET?.trim() || process.env.OWNER_CONTROL_KEY?.trim() || process.env.INTERNAL_SERVICE_KEY?.trim() || '';
const AEGIS_URL = (process.env.AEGIS_URL || 'https://estate-tea-aegis.onrender.com').replace(/\/$/, '');

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    // One source of truth: Aegis and the owner UI must read the exact same Brew
    // approval queue. A second direct-Mongo query can silently diverge by DB/env.
    const response = await fetch(`${AEGIS_URL}/api/aegis/approvals`, {
      headers: { 'x-internal-service-key': AEGIS_TRUST_KEY },
      cache: 'no-store',
    });
    if (!response.ok) {
      return NextResponse.json({ error: 'Approval queue unavailable', upstream_status: response.status }, { status: 502 });
    }
    const payload = await response.json();
    const pending = payload?.pending || { count: 0, items: [] };
    return NextResponse.json(pending, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error) {
    return NextResponse.json({ error: `Approval queue unavailable: ${error?.message || 'connection failed'}` }, { status: 502 });
  }
}
