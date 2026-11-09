import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const BREW_URL = (process.env.BREW_URL || process.env.BREW_API_BASE_URL || 'https://estate-tea-brew.vercel.app').replace(/\/$/, '');
const OWNER_KEY = (process.env.OWNER_CONTROL_KEY || '').trim();
export const dynamic = 'force-dynamic';

// The boss's friends list (kept by Brew): GST absorbed and free delivery on their home orders.
async function brew(path, init = {}) {
  const r = await fetch(`${BREW_URL}${path}`, { ...init, headers: { 'x-owner-key': OWNER_KEY, 'Content-Type': 'application/json', ...(init.headers || {}) }, cache: 'no-store' });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(r.ok ? data : { error: typeof data.detail === 'string' ? data.detail : 'Brew could not do that' }, { status: r.ok ? 200 : r.status === 400 || r.status === 404 ? r.status : 502, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) return NextResponse.json({ error: 'Brew owner connection is not configured' }, { status: 503 });
  try { return await brew('/brew/friends'); } catch { return NextResponse.json({ error: 'Could not reach Brew' }, { status: 502 }); }
}

export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) return NextResponse.json({ error: 'Brew owner connection is not configured' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const clean = { name: String(body.name || '').slice(0, 80), phone: String(body.phone || '').slice(0, 20), email: String(body.email || '').slice(0, 254) };
  try { return await brew('/brew/friends', { method: 'POST', body: JSON.stringify(clean) }); } catch { return NextResponse.json({ error: 'Could not reach Brew' }, { status: 502 }); }
}
