import { NextResponse } from 'next/server';
import { brew, cookieOptions, SESSION_COOKIE } from '@/lib/account';

export const dynamic = 'force-dynamic';
const token = request => request.cookies.get(SESSION_COOKIE)?.value || '';
const signedOut = () => { const res = NextResponse.json({ signed_in: false }); res.cookies.set(SESSION_COOKIE, '', cookieOptions(0)); return res; };

// Their details, from the same record Brew uses on WhatsApp.
export async function GET(request) {
  if (!token(request)) return NextResponse.json({ signed_in: false });
  try {
    const r = await brew('/brew/website-account', { token: token(request) });
    if (r.status === 401) return signedOut();
    if (!r.ok) return NextResponse.json({ signed_in: false, unavailable: true });
    return NextResponse.json({ signed_in: true, profile: r.data.profile }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ signed_in: false, unavailable: true }); }
}

// They changed their details on the website: Brew's record (and so WhatsApp) changes too.
export async function PUT(request) {
  if (!token(request)) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  const details = await request.json().catch(() => ({}));
  try {
    const r = await brew('/brew/website-account', { token: token(request), details });
    if (r.status === 401) return signedOut();
    if (!r.ok) return NextResponse.json({ error: typeof r.data.detail === 'string' ? r.data.detail : 'Could not save your details' }, { status: r.status });
    return NextResponse.json({ signed_in: true, profile: r.data.profile });
  } catch { return NextResponse.json({ error: 'Could not save your details' }, { status: 502 }); }
}

export async function DELETE(request) {
  const everywhere = new URL(request.url).searchParams.get('everywhere') === '1';
  try { if (token(request)) await brew('/brew/website-account', { token: token(request), sign_out: true, everywhere }); } catch {}
  return signedOut();
}
