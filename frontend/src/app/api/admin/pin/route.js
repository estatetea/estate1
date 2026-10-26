import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { issueAdminToken } from '@/lib/admin-auth';
import { clientKey, createLimiter } from '@/lib/rate-limit';

const limiter = createLimiter('owner-pin', { windowMs: 15 * 60 * 1000, lockMs: 15 * 60 * 1000, maxFailures: 5 });

function expectedPinHash() {
  const pin = process.env.ESTATE_AI_PIN;
  if (!pin || !/^\d{6}$/.test(pin)) return null;
  return crypto.createHash('sha256').update(pin).digest();
}
function response(body, status, retryAfter) {
  const headers = retryAfter ? { 'Retry-After': String(retryAfter) } : undefined;
  return NextResponse.json(body, { status, headers });
}

export async function POST(request) {
  const expected = expectedPinHash();
  if (!expected) return response({ error: 'Owner PIN is not configured' }, 503);
  const key = clientKey(request);
  const locked = limiter.lockedFor(key);
  if (locked) return response({ error: 'Too many incorrect attempts. Try again shortly.' }, 429, locked);
  let body;
  try { body = await request.json(); } catch { return response({ error: 'Invalid request' }, 400); }
  const pin = String(body?.pin || '');
  if (!/^\d{6}$/.test(pin)) return response({ error: 'Enter a six-digit PIN' }, 400);
  const supplied = crypto.createHash('sha256').update(pin).digest();
  if (!crypto.timingSafeEqual(expected, supplied)) {
    const remaining = limiter.fail(key);
    return response({ error: remaining ? `Incorrect PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : 'Too many incorrect attempts. Try again in 15 minutes.' }, remaining ? 401 : 429, remaining ? undefined : limiter.lockSeconds);
  }
  limiter.reset(key);
  const token = issueAdminToken();
  if (!token) return response({ error: 'Admin authentication is not configured' }, 503);
  return response({ token, method: 'pin' }, 200);
}
