import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_URL = (process.env.AEGIS_URL || 'https://estate-tea-aegis.onrender.com').replace(/\/$/, '');

export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const response = await fetch(`${AEGIS_URL}/api/aegis/commands`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store',
    });
    const data = await response.json().catch(() => ({ error: 'Invalid Aegis response' }));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Aegis unavailable' }, { status: 502 });
  }
}
