import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/admin-auth';

const n = v => Number(v || 0);

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const db = await getDb();
    const raw = await db.collection('orders').find({}, { projection: { _id: 0 } }).sort({ created_at: -1, timestamp: -1 }).limit(500).toArray();
    const website = [], ai = [];
    for (const o of raw) {
      const source = String(o.source || o.sales_channel || '').toLowerCase();
      const isWebsite = source === 'website' || (!source && o.id && !o.order_id);
      const row = { ...o, sales_channel: isWebsite ? 'website' : 'ai_sales' };
      (isWebsite ? website : ai).push(row);
    }
    const summarize = rows => ({
      orders: rows.length,
      paid_orders: rows.filter(x => ['paid','fulfilled','verified'].includes(String(x.status || '').toLowerCase())).length,
      revenue: rows.reduce((sum, x) => sum + n(x.total_amount || (n(x.price) * n(x.quantity || 1))), 0),
      items_or_kg: rows.reduce((sum, x) => sum + n(x.quantity_kg ?? x.quantity ?? 0), 0),
    });
    return NextResponse.json({ website: { summary: summarize(website), orders: website }, ai_sales: { summary: summarize(ai), orders: ai }, all: summarize([...website, ...ai]) });
  } catch { return NextResponse.json({ error: 'Could not load sales' }, { status: 500 }); }
}
