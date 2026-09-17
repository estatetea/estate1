import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_URL = (process.env.AEGIS_URL || 'https://estate-tea-aegis.onrender.com').replace(/\/$/, '');

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const response = await fetch(`${AEGIS_URL}/api/aegis/dashboard`, { cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ error: 'Aegis unavailable' }, { status: 502 });
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: 'Aegis unavailable' }, { status: 502 });
  }
}
