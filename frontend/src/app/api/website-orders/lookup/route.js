import { NextResponse } from 'next/server';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';
const STEWARD_URL = (process.env.STEWARD_RENDER_URL || 'https://estate-tea-steward.onrender.com').replace(/\/$/, '');

export async function POST(request) {
  try {
    const body = await request.json();
    const estate_order_number = String(body.estate_order_number || '').trim().toUpperCase();
    const email = String(body.email || '').trim();
    if (!/^ET-[0-9]{4,}$/.test(estate_order_number) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid Estate Tea order number and email address.' }, { status: 400 });
    }
    if (!INTERNAL_KEY) {
      return NextResponse.json({ error: 'Order lookup is temporarily unavailable. Please contact Estate Tea.' }, { status: 503 });
    }
    const response = await fetch(`${STEWARD_URL}/api/steward/website/orders/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-service-key': INTERNAL_KEY },
      body: JSON.stringify({ estate_order_number, email }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ error: response.status === 404 ? 'Order not found. Check the order number and email address.' : 'Order lookup is temporarily unavailable. Please try again.' }, { status: response.status === 404 ? 404 : 502 });
    }
    return NextResponse.json(data, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Order lookup is temporarily unavailable. Please try again.' }, { status: 502 });
  }
}
