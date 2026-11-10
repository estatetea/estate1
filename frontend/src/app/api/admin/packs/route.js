import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { getDb } from '@/lib/mongodb';
import { stewardCatalog, setStewardAvailability } from '@/lib/pack-availability';

export const dynamic = 'force-dynamic';

// Packs on sale: the one switch the website, Brew and the web app share (kept by Steward).
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const live = await stewardCatalog();
  if (!live) return NextResponse.json({ error: 'Steward is not reachable right now' }, { status: 502 });
  return NextResponse.json(live, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { product_id, available } = await request.json().catch(() => ({}));
  if (!['250g', '500g', 'christmas-spirit'].includes(product_id)) return NextResponse.json({ error: 'Unknown pack' }, { status: 400 });
  try {
    const live = await setStewardAvailability(product_id, Boolean(available), 'owner (web app)');
    try {
      const db = await getDb();
      await db.collection('products').updateOne({ product_id }, { $set: { in_stock: Boolean(available), steward_synced: true } });
    } catch { /* the website copy is only a mirror */ }
    return NextResponse.json(live);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 502 }); }
}
