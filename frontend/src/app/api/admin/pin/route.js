import { NextResponse } from 'next/server';
import crypto from 'crypto';

function expectedPinHash() {
  const pin = process.env.ESTATE_AI_PIN;
  if (!pin || !/^\d{6}$/.test(pin)) return null;
  return crypto.createHash('sha256').update(pin).digest();
}

export async function POST(request) {
  const expected = expectedPinHash();
  if (!expected) return NextResponse.json({ error: 'Owner PIN is not configured' }, { status: 503 });
  const { pin } = await request.json();
  if (!/^\d{6}$/.test(String(pin || ''))) return NextResponse.json({ error: 'Enter a six-digit PIN' }, { status: 400 });
  const supplied = crypto.createHash('sha256').update(String(pin)).digest();
  if (!crypto.timingSafeEqual(expected, supplied)) return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });

  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return NextResponse.json({ error: 'Admin authentication is not configured' }, { status: 503 });
  const token = crypto.createHmac('sha256', secret).update('estate-tea-admin').digest('hex');
  return NextResponse.json({ token, method: 'pin' });
}
