import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const BREW_URL = (process.env.BREW_URL || process.env.BREW_API_BASE_URL || 'https://estate-tea-brew.vercel.app').replace(/\/$/, '');
const OWNER_KEY = (process.env.OWNER_CONTROL_KEY || '').trim();
export const dynamic = 'force-dynamic';

// Everything still unfinished with customers, from Brew (oldest first).
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) return NextResponse.json({ error: 'Brew owner connection is not configured' }, { status: 503 });
  try {
    const r = await fetch(`${BREW_URL}/brew/open-loops`, { headers: { 'x-owner-key': OWNER_KEY }, cache: 'no-store' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ error: data.detail || 'Brew could not list them' }, { status: 502 });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Could not reach Brew' }, { status: 502 }); }
}
