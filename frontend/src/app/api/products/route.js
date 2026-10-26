import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { STEWARD_URL } from '@/lib/steward';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';
const DEFAULTS = [
  { product_id: '250g', weight: '250 grams', price: 180, in_stock: true },
  { product_id: '500g', weight: '500 grams', price: 360, in_stock: true },
];

// A pack is sellable only when the owner has it switched on here AND Steward has enough
// sellable tea for it, so the shop stops selling a size by itself when stock runs short.
async function stewardAvailability() {
  if (!INTERNAL_KEY) return null;
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/catalog`, { headers: { 'x-internal-service-key': INTERNAL_KEY }, cache: 'no-store' });
    if (!r.ok) return null;
    const body = await r.json();
    return new Map((body.products || []).map(p => [p.product_id, p]));
  } catch { return null; }
}

export async function GET() {
  let products = DEFAULTS;
  try {
    const db = await getDb();
    const stored = await db.collection('products').find({}, { projection: { _id: 0, name: 0 } }).toArray();
    if (stored.length) products = stored.map(product => ({ ...product, price: product.product_id === '250g' ? 180 : product.product_id === '500g' ? 360 : product.price }));
  } catch { /* fall back to defaults */ }
  const live = await stewardAvailability();
  if (live) products = products.map(p => ({ ...p, in_stock: Boolean(p.in_stock) && Boolean(live.get(p.product_id)?.in_stock ?? true) }));
  return NextResponse.json(products, { headers: { 'Cache-Control': 'no-store' } });
}
