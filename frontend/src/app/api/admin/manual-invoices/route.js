import { NextResponse } from 'next/server';
import { verifyStaff } from '@/lib/team-auth';
import { STEWARD_URL } from '@/lib/steward';

const OWNER_KEY = (process.env.OWNER_CONTROL_KEY || process.env.STEWARD_OWNER_CONTROL_KEY || '').trim();
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || OWNER_KEY;
const headers = { 'Content-Type': 'application/json', 'x-internal-service-key': INTERNAL_KEY };

// Owner-issued Razorpay invoices: Steward creates the order and Razorpay invoice, Ledger numbers it.
export async function GET(request) {
  if (!(await verifyStaff(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/manual-invoices`, { headers, cache: 'no-store' });
    return NextResponse.json(await r.json().catch(() => []), { status: r.status, headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Could not reach Steward' }, { status: 502 }); }
}

export async function POST(request) {
  if (!(await verifyStaff(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) return NextResponse.json({ error: 'Steward owner connection is not configured' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const quantity = Number(body.quantity);
  const email = String(body.email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "That email address doesn't look right. Fix it, or leave it empty." }, { status: 400 });
  if (!['250g', '500g', '1kg', 'test', 'christmas-spirit', 'christmas-cookies', 'plum-cake', 'custom'].includes(body.product_id)) return NextResponse.json({ error: 'Choose an item' }, { status: 400 });
  // The owner's own item: a title, a quantity and his total (GST 0, 5 or 18% inside it). Never touches stock.
  const custom = body.product_id === 'custom';
  const customTitle = String(body.custom_title || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const customGst = Number(body.custom_gst_pct);
  if (custom && customTitle.length < 2) return NextResponse.json({ error: 'Give the item a title' }, { status: 400 });
  if (custom && ![0, 5, 18].includes(customGst)) return NextResponse.json({ error: 'Choose the GST: none, 5% or 18%' }, { status: 400 });
  if (custom && !(Number(body.owner_total) > 0)) return NextResponse.json({ error: 'Enter the amount for this item' }, { status: 400 });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) return NextResponse.json({ error: 'Enter a quantity between 1 and 500' }, { status: 400 });
  // More items on the same invoice (tea packs; with Christmas Spirit or another pack first), and the owner's own total.
  const extra = Array.isArray(body.extra_items) ? body.extra_items.slice(0, 6).map(i => ({ product_id: String(i?.product_id || ''), quantity: Number(i?.quantity) })) : [];
  if (extra.some(i => !['250g', '500g', '1kg'].includes(i.product_id) || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 500))
    return NextResponse.json({ error: 'Extra items can be our 250 g, 500 g or 1 kg tea, 1 to 500 each' }, { status: 400 });
  const ownerTotal = Math.round(Math.max(0, Number(body.owner_total) || 0) * 100) / 100;
  if (ownerTotal > 500000) return NextResponse.json({ error: 'That amount is too large' }, { status: 400 });
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/manual-invoices`, {
      method: 'POST', headers, cache: 'no-store',
      body: JSON.stringify({ owner_key: OWNER_KEY, name: String(body.name || '').slice(0, 120), email, phone: String(body.phone || '').slice(0, 20), delivery_address: String(body.delivery_address || '').slice(0, 500), pincode: String(body.pincode || '').replace(/\D/g, '').slice(0, 6), delivery_method: ['own_delivery', 'third_party_courier'].includes(body.delivery_method) ? body.delivery_method : '', courier_fee: Math.max(0, Number(body.courier_fee) || 0), customer_type: body.customer_type === 'business' ? 'business' : 'home', business_name: String(body.business_name || '').slice(0, 120), gstin: String(body.gstin || '').toUpperCase().replace(/\s/g, '').slice(0, 15), gst_enabled: body.gst_enabled !== false, product_id: body.product_id, quantity, override_stock: body.override_stock === true, ...(extra.length ? { extra_items: extra } : {}), ...(ownerTotal > 0 && body.product_id !== 'test' ? { owner_total: ownerTotal } : {}), ...(custom ? { custom_title: customTitle, custom_gst_pct: customGst, extra_items: [] } : {}) }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) return NextResponse.json(data, { status: r.status });
    // Over-stock is a warning for the owner: pass the numbers through so the form can offer "Send anyway".
    const detail = data.detail;
    if (detail && typeof detail === 'object' && detail.code === 'stock_warning') return NextResponse.json({ error: detail.message, ...detail }, { status: 409 });
    return NextResponse.json({ error: (typeof detail === 'string' && detail) || data.error || 'Steward could not send the invoice' }, { status: r.status });
  } catch { return NextResponse.json({ error: 'Could not reach Steward' }, { status: 502 }); }
}
