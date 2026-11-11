import { NextResponse } from 'next/server';
import { verifyPreview } from '@/lib/admin-auth';
import { STEWARD_URL } from '@/lib/steward';

const INTERNAL_KEY = () => process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';

// A collection cart from the website: Steward checks what's left, prices it (GST included) and creates the Razorpay order.
// Before the collection is public, only the owner's preview pass can order (to test it).
export async function POST(request) {
  try {
    const b = await request.json().catch(() => ({}));
    const items = (Array.isArray(b.items) ? b.items : []).slice(0, 20)
      .map(i => ({ product_id: String(i?.product_id || '').slice(0, 60), quantity: Math.max(0, Math.min(1000, parseInt(i?.quantity, 10) || 0)) }))
      .filter(i => i.product_id && i.quantity > 0);
    if (!items.length) return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
    const body = { items, customer: b.customer || {}, preview: verifyPreview(request) };
    const r = await fetch(`${STEWARD_URL}/api/steward/collection/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-internal-service-key': INTERNAL_KEY() }, body: JSON.stringify(body), cache: 'no-store' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ error: typeof data.detail === 'string' ? data.detail : 'Could not create the order' }, { status: r.status });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: 'Could not create the order' }, { status: 502 }); }
}
