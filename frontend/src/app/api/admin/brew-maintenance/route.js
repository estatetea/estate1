import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

// Owner only: Brew under maintenance (one fixed reply to customers, no chatting), and who wrote in meanwhile.
const BREW_URL = (process.env.BREW_URL || process.env.BREW_API_BASE_URL || 'https://estate-tea-brew.vercel.app').replace(/\/$/, '');
const OWNER_KEY = (process.env.OWNER_CONTROL_KEY || '').trim();
async function call(method, body) {
  const r = await fetch(`${BREW_URL}/brew/maintenance`, { method, cache: 'no-store', headers: { 'Content-Type': 'application/json', 'x-owner-key': OWNER_KEY }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(r.ok ? data : { error: data.detail || 'Brew could not change it' }, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
}
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { return await call('GET'); } catch { return NextResponse.json({ error: 'Could not reach Brew' }, { status: 502 }); }
}
export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  try { return await call('POST', { on: b.on === true, message: String(b.message || '').slice(0, 900) }); } catch { return NextResponse.json({ error: 'Could not reach Brew' }, { status: 502 }); }
}
