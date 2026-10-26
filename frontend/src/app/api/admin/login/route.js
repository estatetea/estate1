import { NextResponse } from 'next/server';
import { issueAdminToken, safeEqual } from '@/lib/admin-auth';
import { clientKey, createLimiter } from '@/lib/rate-limit';

const limiter = createLimiter('admin-login', { windowMs: 15 * 60 * 1000, lockMs: 15 * 60 * 1000, maxFailures: 5 });

export async function POST(request) {
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass) return NextResponse.json({ error: 'Admin authentication is not configured' }, { status: 503 });
  const key = clientKey(request);
  const locked = limiter.lockedFor(key);
  if (locked) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': String(locked) } });
  }
  const body = await request.json().catch(() => ({}));
  if (!safeEqual(body?.password, adminPass)) {
    limiter.fail(key);
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  limiter.reset(key);
  return NextResponse.json({ token: issueAdminToken() });
}
