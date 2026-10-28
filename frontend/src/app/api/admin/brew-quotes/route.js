import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const BREW_URL = (process.env.BREW_URL || process.env.BREW_API_BASE_URL || 'https://estate-tea-brew.vercel.app').replace(/\/$/, '');
const OWNER_KEY = (process.env.OWNER_CONTROL_KEY || '').trim();
const DECISIONS = ['go_ahead', 'maybe_later', 'offer_options'];

// The owner's answer to a quote Brew prepared (a customer asked for an amount of tea).
export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) return NextResponse.json({ error: 'Brew owner connection is not configured' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const id = String(body.relationship_id || '');
  if (!/^[a-f0-9]{24}$/i.test(id)) return NextResponse.json({ error: 'Missing customer reference' }, { status: 400 });
  if (!DECISIONS.includes(body.decision)) return NextResponse.json({ error: 'Choose go ahead, offer options or maybe later' }, { status: 400 });
  try {
    const r = await fetch(`${BREW_URL}/brew/relationships/${id}/quote-decision`, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'x-owner-key': OWNER_KEY },
      body: JSON.stringify({ decision: body.decision }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ error: data.detail || data.error || 'Brew could not act on the quote' }, { status: r.status });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: 'Could not reach Brew' }, { status: 502 }); }
}
