import { NextResponse } from 'next/server';
import { brew, cookieOptions, LOGIN_COOKIE, WHATSAPP_NUMBER } from '@/lib/account';
import { clientKey, createLimiter } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
const limiter = createLimiter('account-login-start', { windowMs: 15 * 60 * 1000, lockMs: 15 * 60 * 1000, maxFailures: 20 });

// A fresh sign-in code for this browser. The customer sends it to us from their own WhatsApp; this browser keeps a
// secret (in a cookie only the server can read) so nobody else can collect the sign-in.
export async function POST(request) {
  const who = clientKey(request);
  const wait = limiter.lockedFor(who);
  if (wait) return NextResponse.json({ error: 'Too many sign-in attempts. Please try again in a few minutes.' }, { status: 429, headers: { 'Retry-After': String(wait) } });
  limiter.fail(who);   // every code asked for counts towards the limit
  try {
    const r = await brew('/brew/website-login/start');
    if (!r.ok || !r.data.code) return NextResponse.json({ error: 'Sign-in is not available right now. You can still order as a guest.' }, { status: 503 });
    const { login_id, secret, code, message, expires_in } = r.data;
    const res = NextResponse.json({ code, message, expires_in, whatsapp_url: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}` },
      { headers: { 'Cache-Control': 'no-store' } });
    res.cookies.set(LOGIN_COOKIE, `${login_id}.${secret}`, cookieOptions(expires_in || 600));
    return res;
  } catch { return NextResponse.json({ error: 'Sign-in is not available right now. You can still order as a guest.' }, { status: 503 }); }
}
