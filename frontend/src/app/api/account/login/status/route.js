import { NextResponse } from 'next/server';
import { brew, cookieOptions, LOGIN_COOKIE, SESSION_COOKIE } from '@/lib/account';

export const dynamic = 'force-dynamic';

// Has this browser's code come in on WhatsApp yet? When it has: signed in (a 90-day cookie only the server can read).
export async function GET(request) {
  const raw = request.cookies.get(LOGIN_COOKIE)?.value || '';
  const dot = raw.indexOf('.');
  if (dot < 1) return NextResponse.json({ status: 'expired' });
  try {
    const r = await brew('/brew/website-login/status', { login_id: raw.slice(0, dot), secret: raw.slice(dot + 1) });
    const s = r.data || {};
    if (s.status === 'signed_in' && s.token) {
      const res = NextResponse.json({ status: 'signed_in', profile: s.profile }, { headers: { 'Cache-Control': 'no-store' } });
      res.cookies.set(SESSION_COOKIE, s.token, cookieOptions(s.expires_in || 90 * 86400));
      res.cookies.set(LOGIN_COOKIE, '', cookieOptions(0));
      return res;
    }
    return NextResponse.json({ status: s.status === 'waiting' ? 'waiting' : 'expired' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ status: 'waiting' }); }
}
