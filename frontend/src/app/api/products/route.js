import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { stewardCatalog, carryOverWebsiteSwitches } from '@/lib/pack-availability';

const DEFAULTS = [
  { product_id: '250g', weight: '250 grams', price: 180, in_stock: true },
  { product_id: '500g', weight: '500 grams', price: 360, in_stock: true },
];

// A pack is sellable only when the owner has it switched on (Steward's switch, shared with Brew and the web app) AND
// Steward has enough sellable tea for it, so the shop stops selling a size by itself when stock runs short.
export async function GET() {
  let products = DEFAULTS, db = null, stored = [];
  try {
    db = await getDb();
    stored = await db.collection('products').find({}, { projection: { _id: 0, name: 0 } }).toArray();
    // Christmas items (e.g. Christmas Spirit) are sold through Brew and manual invoices only, never in the website shop.
    stored = stored.filter(p => !['christmas-spirit', 'hamper-noel'].includes(p.product_id));
    if (stored.length) products = stored.map(product => ({ ...product, price: product.product_id === '250g' ? 180 : product.product_id === '500g' ? 360 : product.price }));
  } catch { /* fall back to defaults */ }
  let live = await stewardCatalog();
  if (live && db && stored.some(p => !p.steward_synced)) {
    await carryOverWebsiteSwitches(db, stored, live);
    live = await stewardCatalog() || live;
  }
  const byId = new Map((live?.products || []).map(p => [p.product_id, p]));
  products = products.map(({ steward_synced, ...p }) => {
    const there = byId.get(p.product_id);
    return there ? { ...p, in_stock: Boolean(there.in_stock), unavailable_reason: there.reason || null } : p;
  });
  return NextResponse.json(products, { headers: { 'Cache-Control': 'no-store' } });
}
