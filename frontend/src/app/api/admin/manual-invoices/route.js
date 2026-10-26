import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { STEWARD_URL } from '@/lib/steward';

const OWNER_KEY = (process.env.OWNER_CONTROL_KEY || process.env.STEWARD_OWNER_CONTROL_KEY || '').trim();
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || OWNER_KEY;
const headers = { 'Content-Type': 'application/json', 'x-internal-service-key': INTERNAL_KEY };

// Owner-issued Razorpay invoices: Steward creates the order and Razorpay invoice, Ledger numbers it.
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/manual-invoices`, { headers, cache: 'no-store' });
    return NextResponse.json(await r.json().catch(() => []), { status: r.status, headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Could not reach Steward' }, { status: 502 }); }
}

export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) return NextResponse.json({ error: 'Steward owner connection is not configured' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const quantity = Number(body.quantity);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email || ''))) return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  if (!['250g', '500g', '1kg', 'test'].includes(body.product_id)) return NextResponse.json({ error: 'Choose a packet size' }, { status: 400 });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) return NextResponse.json({ error: 'Enter a quantity between 1 and 500' }, { status: 400 });
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/manual-invoices`, {
      method: 'POST', headers, cache: 'no-store',
      body: JSON.stringify({ owner_key: OWNER_KEY, name: String(body.name || '').slice(0, 120), email: body.email, phone: String(body.phone || '').slice(0, 20), delivery_address: String(body.delivery_address || '').slice(0, 500), product_id: body.product_id, quantity, override_stock: body.override_stock === true }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) return NextResponse.json(data, { status: r.status });
    // Over-stock is a warning for the owner: pass the numbers through so the form can offer "Send anyway".
    const detail = data.detail;
    if (detail && typeof detail === 'object' && detail.code === 'stock_warning') return NextResponse.json({ error: detail.message, ...detail }, { status: 409 });
    return NextResponse.json({ error: (typeof detail === 'string' && detail) || data.error || 'Steward could not send the invoice' }, { status: r.status });
  } catch { return NextResponse.json({ error: 'Could not reach Steward' }, { status: 502 }); }
}
