import { NextResponse } from 'next/server';
import { verifyStaff } from '@/lib/team-auth';
import { STEWARD_URL } from '@/lib/steward';

const OWNER_KEY = (process.env.OWNER_CONTROL_KEY || process.env.STEWARD_OWNER_CONTROL_KEY || '').trim();
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || OWNER_KEY;
const headers = { 'Content-Type': 'application/json', 'x-internal-service-key': INTERNAL_KEY };

// The owner's saved invoice items (his own titles and prices), shared with Brew's WhatsApp invoice buttons.
export async function GET(request) {
  if (!(await verifyStaff(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/saved-items`, { headers, cache: 'no-store' });
    return NextResponse.json(await r.json().catch(() => ({ items: [] })), { status: r.status, headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Could not reach Steward' }, { status: 502 }); }
}

// { title, price, gst_pct, id? } saves (same title, or the id, updates it); { delete: id } removes it.
export async function POST(request) {
  if (!(await verifyStaff(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) return NextResponse.json({ error: 'Steward owner connection is not configured' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const del = String(body.delete || '');
  if (del && !/^SI-[A-Z0-9]{4,12}$/.test(del)) return NextResponse.json({ error: 'Unknown item' }, { status: 400 });
  const id = String(body.id || '');
  if (id && !/^SI-[A-Z0-9]{4,12}$/.test(id)) return NextResponse.json({ error: 'Unknown item' }, { status: 400 });
  const price = body.price === null || body.price === undefined || body.price === '' ? null : Number(body.price);
  const gst = body.gst_pct === null || body.gst_pct === undefined || body.gst_pct === '' ? null : Number(body.gst_pct);
  if (!del && (price !== null && !(price > 0 && price <= 500000))) return NextResponse.json({ error: 'The price should be more than ₹0' }, { status: 400 });
  if (!del && gst !== null && ![0, 5, 18].includes(gst)) return NextResponse.json({ error: 'GST is 0%, 5% or 18%' }, { status: 400 });
  try {
    const url = del ? `${STEWARD_URL}/api/steward/saved-items/${encodeURIComponent(del)}/delete` : `${STEWARD_URL}/api/steward/saved-items`;
    const r = await fetch(url, { method: 'POST', headers, cache: 'no-store',
      body: JSON.stringify({ owner_key: OWNER_KEY, ...(del ? {} : { title: String(body.title || '').slice(0, 80), price, gst_pct: gst, id }) }) });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(r.ok ? data : { error: (typeof data.detail === 'string' && data.detail) || 'Steward could not save it' }, { status: r.status });
  } catch { return NextResponse.json({ error: 'Could not reach Steward' }, { status: 502 }); }
}
