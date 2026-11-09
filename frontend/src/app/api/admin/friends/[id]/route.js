import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const BREW_URL = (process.env.BREW_URL || process.env.BREW_API_BASE_URL || 'https://estate-tea-brew.vercel.app').replace(/\/$/, '');
const OWNER_KEY = (process.env.OWNER_CONTROL_KEY || '').trim();
export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) return NextResponse.json({ error: 'Brew owner connection is not configured' }, { status: 503 });
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(String(id || ''))) return NextResponse.json({ error: 'Unknown friend' }, { status: 400 });
  try {
    const r = await fetch(`${BREW_URL}/brew/friends/${id}`, { method: 'DELETE', headers: { 'x-owner-key': OWNER_KEY }, cache: 'no-store' });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(r.ok ? data : { error: data.detail || 'Brew could not remove them' }, { status: r.ok ? 200 : 502 });
  } catch { return NextResponse.json({ error: 'Could not reach Brew' }, { status: 502 }); }
}
