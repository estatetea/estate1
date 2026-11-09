import { NextResponse } from 'next/server';
import { STEWARD_URL } from '@/lib/steward';
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';

// A hamper bought on the website: Steward checks the date window, prices it and creates the Razorpay order.
export async function POST(request) {
  try {
    const b = await request.json().catch(() => ({}));
    const body = { product_id: String(b.product_id || '').slice(0, 40), quantity: Math.max(1, Math.min(20, parseInt(b.quantity, 10) || 1)),
      delivery_date: String(b.delivery_date || '').slice(0, 10), message: String(b.message || '').slice(0, 300), customer: b.customer || {} };
    const r = await fetch(`${STEWARD_URL}/api/steward/hampers/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-internal-service-key': INTERNAL_KEY }, body: JSON.stringify(body), cache: 'no-store' });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch { return NextResponse.json({ error: 'Could not create the hamper order' }, { status: 502 }); }
}
