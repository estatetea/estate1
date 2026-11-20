import { NextResponse } from 'next/server';
import { teamLogin } from '@/lib/team-auth';
import { clientKey, createLimiter } from '@/lib/rate-limit';

// Team sign-in on a registered phone: just the person's own 6-digit PIN.
const limiter = createLimiter('team-pin', { windowMs: 15 * 60 * 1000, lockMs: 15 * 60 * 1000, maxFailures: 10 });

export async function POST(request) {
  const key = clientKey(request);
  const locked = limiter.lockedFor(key);
  if (locked) return NextResponse.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429, headers: { 'Retry-After': String(locked) } });
  const body = await request.json().catch(() => ({}));
  try {
    const out = await teamLogin(String(body.device || '').slice(0, 200), String(body.pin || ''));
    if (out.error) { if (out.status === 401 || out.status === 403) limiter.fail(key); return NextResponse.json({ error: out.error, unregistered: !!out.unregistered }, { status: out.status }); }
    limiter.reset(key);
    return NextResponse.json(out);
  } catch { return NextResponse.json({ error: "Sign-in isn't available right now. Try again shortly." }, { status: 503 }); }
}
