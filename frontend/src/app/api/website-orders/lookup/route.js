import { NextResponse } from 'next/server';
import { STEWARD_URL } from '@/lib/steward';
import { clientKey, createLimiter } from '@/lib/rate-limit';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';
// Order details are private: a few wrong tries are fine (wrong email, then the phone), guessing is not.
const limiter = createLimiter('order-lookup', { windowMs: 15 * 60 * 1000, lockMs: 15 * 60 * 1000, maxFailures: 8 });

export async function POST(request) {
  const who = clientKey(request);
  try {
    const wait = limiter.lockedFor(who);
    if (wait) return NextResponse.json({ error: `Too many tries. Please wait ${Math.ceil(wait / 60)} minutes and try again.` }, { status: 429 });
    const body = await request.json();
    const estate_order_number = String(body.estate_order_number || '').trim().toUpperCase();
    const email = String(body.email || '').trim();
    const digits = String(body.phone || '').replace(/\D/g, '').slice(-10);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!/^ET-[0-9]{4,}$/.test(estate_order_number) || (!emailOk && digits.length !== 10)) {
      return NextResponse.json({ error: 'Enter your Estate Tea order number and the email or 10-digit phone number used for the order.' }, { status: 400 });
    }
    if (!INTERNAL_KEY) {
      return NextResponse.json({ error: 'Order lookup is temporarily unavailable. Please contact Estate Tea.' }, { status: 503 });
    }
    const response = await fetch(`${STEWARD_URL}/api/steward/website/orders/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-service-key': INTERNAL_KEY },
      body: JSON.stringify({ estate_order_number, ...(emailOk ? { email } : {}), ...(digits.length === 10 ? { phone: digits } : {}) }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 404) {
        limiter.fail(who);
        return NextResponse.json({ error: 'not_matched', checked: digits.length === 10 ? 'phone' : 'email' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Order lookup is temporarily unavailable. Please try again.' }, { status: 502 });
    }
    limiter.reset(who);
    return NextResponse.json(data, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Order lookup is temporarily unavailable. Please try again.' }, { status: 502 });
  }
}
