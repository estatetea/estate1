import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const BREW_URL = (process.env.BREW_URL || process.env.BREW_API_BASE_URL || 'https://estate-tea-brew.vercel.app').replace(/\/$/, '');
const OWNER_KEY = (process.env.OWNER_CONTROL_KEY || '').trim();
const headers = { 'Content-Type': 'application/json', 'x-owner-key': OWNER_KEY };

// Whether Brew's WhatsApp and email replies wait for the owner's approval or go out by themselves.
async function call(method, body) {
  const r = await fetch(`${BREW_URL}/brew/settings/approvals`, { method, headers, cache: 'no-store', ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(r.ok ? data : { error: data.detail || 'Brew could not change the setting' }, { status: r.status });
}

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { return await call('GET'); } catch { return NextResponse.json({ error: 'Could not reach Brew' }, { status: 502 }); }
}

export async function PUT(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (!['whatsapp', 'email', 'whatsapp_orders'].includes(body.channel) || !['auto', 'approval'].includes(body.mode)) return NextResponse.json({ error: 'Choose a channel and a mode' }, { status: 400 });
  try { return await call('PUT', { channel: body.channel, mode: body.mode }); } catch { return NextResponse.json({ error: 'Could not reach Brew' }, { status: 502 }); }
}
