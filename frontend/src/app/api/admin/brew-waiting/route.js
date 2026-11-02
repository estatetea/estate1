import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const BREW_URL = (process.env.BREW_URL || process.env.BREW_API_BASE_URL || 'https://estate-tea-brew.vercel.app').replace(/\/$/, '');
const OWNER_KEY = (process.env.OWNER_CONTROL_KEY || '').trim();

// The owner's answer to a customer Brew told he was checking with the team (or "done").
export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) return NextResponse.json({ error: 'Brew owner connection is not configured' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const id = String(body.relationship_id || '');
  if (!/^[a-f0-9]{24}$/i.test(id)) return NextResponse.json({ error: 'Missing customer reference' }, { status: 400 });
  if (!['reply', 'done'].includes(body.action)) return NextResponse.json({ error: 'Choose reply or done' }, { status: 400 });
  try {
    const r = await fetch(`${BREW_URL}/brew/relationships/${id}/waiting`, {
      method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'x-owner-key': OWNER_KEY },
      body: JSON.stringify({ action: body.action, text: String(body.text || '').slice(0, 2000) }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ error: data.detail || data.error || 'Brew could not send it' }, { status: r.status });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: 'Could not reach Brew' }, { status: 502 }); }
}
