import { NextResponse } from 'next/server';
import crypto from 'crypto';

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const attempts = globalThis.__estateTeaPinAttempts || new Map();
globalThis.__estateTeaPinAttempts = attempts;

function expectedPinHash() {
  const pin = process.env.ESTATE_AI_PIN;
  if (!pin || !/^\d{6}$/.test(pin)) return null;
  return crypto.createHash('sha256').update(pin).digest();
}
function clientKey(request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}
function stateFor(key) {
  const now = Date.now();
  const old = attempts.get(key);
  if (!old || now - old.windowStarted > WINDOW_MS) {
    const fresh = { failures: 0, windowStarted: now, lockedUntil: 0 };
    attempts.set(key, fresh);
    return fresh;
  }
  return old;
}
function response(body, status, retryAfter) {
  const headers = retryAfter ? { 'Retry-After': String(retryAfter) } : undefined;
  return NextResponse.json(body, { status, headers });
}

export async function POST(request) {
  const expected = expectedPinHash();
  if (!expected) return response({ error: 'Owner PIN is not configured' }, 503);
  const key = clientKey(request), state = stateFor(key), now = Date.now();
  if (state.lockedUntil > now) {
    const seconds = Math.ceil((state.lockedUntil - now) / 1000);
    return response({ error: 'Too many incorrect attempts. Try again shortly.' }, 429, seconds);
  }
  let body;
  try { body = await request.json(); } catch { return response({ error: 'Invalid request' }, 400); }
  const pin = String(body?.pin || '');
  if (!/^\d{6}$/.test(pin)) return response({ error: 'Enter a six-digit PIN' }, 400);
  const supplied = crypto.createHash('sha256').update(pin).digest();
  if (!crypto.timingSafeEqual(expected, supplied)) {
    state.failures += 1;
    if (state.failures >= MAX_FAILURES) state.lockedUntil = now + LOCK_MS;
    attempts.set(key, state);
    const remaining = Math.max(0, MAX_FAILURES - state.failures);
    return response({ error: remaining ? `Incorrect PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : 'Too many incorrect attempts. Try again in 15 minutes.' }, remaining ? 401 : 429, remaining ? undefined : Math.ceil(LOCK_MS / 1000));
  }
  attempts.delete(key);
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return response({ error: 'Admin authentication is not configured' }, 503);
  const token = crypto.createHmac('sha256', secret).update('estate-tea-admin').digest('hex');
  return response({ token, method: 'pin' }, 200);
}
