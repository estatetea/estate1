import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/admin-auth';

const n = v => Number(v || 0);
const paidState = value => ['paid','fulfilled','verified'].includes(String(value || '').toLowerCase());

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const db = await getDb();
    const [raw, paymentRows] = await Promise.all([
      db.collection('orders').find({}, { projection: { _id: 0 } }).sort({ created_at: -1, timestamp: -1 }).limit(500).toArray(),
      db.collection('payments').find({}, { projection: { _id: 0, order_id: 1, payment_verified: 1, status: 1 } }).toArray(),
    ]);
    const paymentByOrder = new Map(paymentRows.filter(p => p.order_id).map(p => [String(p.order_id), p]));
    const website = [], ai = [];
    for (const o of raw) {
      const source = String(o.source || o.sales_channel || '').toLowerCase();
      const isWebsite = source === 'website' || (!source && o.id && !o.order_id);
      const payment = o.order_id ? paymentByOrder.get(String(o.order_id)) : null;
      const paymentVerified = Boolean(payment?.payment_verified) || paidState(payment?.status) || paidState(o.status);
      const row = { ...o, payment_verified: paymentVerified, payment_status: payment?.status || null, sales_channel: isWebsite ? 'website' : 'ai_sales' };
      (isWebsite ? website : ai).push(row);
    }
    const summarize = rows => {
      const paid = rows.filter(x => x.payment_verified);
      return {
        orders: rows.length,
        paid_orders: paid.length,
        revenue: Math.round(paid.reduce((sum, x) => sum + n(x.total_amount || (n(x.price) * n(x.quantity || 1))), 0) * 100) / 100,
        booked_value: Math.round(rows.reduce((sum, x) => sum + n(x.total_amount || (n(x.price) * n(x.quantity || 1))), 0) * 100) / 100,
        items_or_kg: rows.reduce((sum, x) => sum + n(x.quantity_kg ?? x.quantity ?? 0), 0),
      };
    };
    return NextResponse.json({ website: { summary: summarize(website), orders: website }, ai_sales: { summary: summarize(ai), orders: ai }, all: summarize([...website, ...ai]) });
  } catch { return NextResponse.json({ error: 'Could not load sales' }, { status: 500 }); }
}
