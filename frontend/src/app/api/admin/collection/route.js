import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { STEWARD_URL } from '@/lib/steward';

export const dynamic = 'force-dynamic';

// The seasonal collection (Christmas now): its name, whether it's public, its items, prices and how many are left.
// Kept by Steward, so the website, Brew and manual invoices all sell from the same count.
const OWNER_KEY = () => process.env.OWNER_CONTROL_KEY || process.env.STEWARD_OWNER_CONTROL_KEY || '';
const INTERNAL_KEY = () => process.env.INTERNAL_SERVICE_KEY || OWNER_KEY();

async function steward(path, method = 'GET', body) {
  const r = await fetch(`${STEWARD_URL}/api/steward/collection${path}`, {
    method, cache: 'no-store',
    headers: { 'x-internal-service-key': INTERNAL_KEY(), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify({ ...body, owner_key: OWNER_KEY() }) } : {}),
  });
  const b = await r.json().catch(() => ({}));
  return NextResponse.json(r.ok ? b : { error: typeof b.detail === 'string' ? b.detail : 'Steward did not accept the change' }, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { return await steward('/admin'); } catch { return NextResponse.json({ error: 'Steward is not reachable right now' }, { status: 502 }); }
}

// { settings: {...} } | { item: {...}, product_id? }  (no product_id = a new item)
export async function PUT(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY()) return NextResponse.json({ error: 'Steward owner connection is not configured' }, { status: 503 });
  const { settings, item, product_id } = await request.json().catch(() => ({}));
  try {
    if (settings) return await steward('/settings', 'PUT', settings);
    if (item && product_id) return await steward(`/items/${encodeURIComponent(product_id)}`, 'PUT', item);
    if (item) return await steward('/items', 'POST', item);
    return NextResponse.json({ error: 'Nothing to change' }, { status: 400 });
  } catch { return NextResponse.json({ error: 'Steward is not reachable right now' }, { status: 502 }); }
}
