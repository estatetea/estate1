import { NextResponse } from 'next/server';
import { linkInfo, acceptLink } from '@/lib/team-auth';
import { clientKey, createLimiter } from '@/lib/rate-limit';

// The one-time link from the email: who it's for (GET), then register this phone (and choose the PIN the first time) (POST).
const limiter = createLimiter('team-link', { windowMs: 15 * 60 * 1000, lockMs: 15 * 60 * 1000, maxFailures: 10 });

export async function GET(request) {
  const key = clientKey(request);
  if (limiter.lockedFor(key)) return NextResponse.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429 });
  const token = new URL(request.url).searchParams.get('token') || '';
  try {
    const info = await linkInfo(token);
    if (!info) limiter.fail(key);
    return info ? NextResponse.json(info) : NextResponse.json({ error: 'That code or link has expired or was already used. Tap "New phone? Get a link" for a new one.' }, { status: 410 });
  } catch { return NextResponse.json({ error: "This isn't available right now. Try again shortly." }, { status: 503 }); }
}

export async function POST(request) {
  const key = clientKey(request);
  if (limiter.lockedFor(key)) return NextResponse.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  try {
    const out = await acceptLink(String(body.token || ''), body.pin ? String(body.pin) : '');
    if (out.error) { if (out.status === 401 || out.status === 410) limiter.fail(key); return NextResponse.json({ error: out.error }, { status: out.status }); }
    return NextResponse.json(out);
  } catch { return NextResponse.json({ error: "This isn't available right now. Try again shortly." }, { status: 503 }); }
}
