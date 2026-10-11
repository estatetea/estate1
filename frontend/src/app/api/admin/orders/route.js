import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/admin-auth';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';
const STEWARD_URL = (process.env.STEWARD_URL || process.env.STEWARD_RENDER_URL || 'https://estate-tea-steward.onrender.com').replace(/\/$/, '');

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const db = await getDb();
    const localOrders = await db.collection('orders').find({}, { projection: { _id: 0 } }).sort({ timestamp: -1 }).limit(50).toArray();
    let stewardOrders = [];
    if (INTERNAL_KEY) {
      try {
        const response = await fetch(`${STEWARD_URL}/api/steward/orders`, {
          headers: { 'x-internal-service-key': INTERNAL_KEY },
          cache: 'no-store',
        });
        if (response.ok) {
          const rows = await response.json();
          if (Array.isArray(rows)) stewardOrders = rows.map(order => ({
            ...order,
            id: order.order_id,
            internal_order_id: order.order_id,
            display_order_number: order.estate_order_number || order.order_id,
            source: 'steward',
            timestamp: order.created_at || order.timestamp,
            payment_status: order.payment_status || order.status,
            delivery_status: order.delivery_status || null,
          }));
        }
      } catch {
        // Keep legacy orders visible, but do not fabricate or cache Steward order state.
      }
    }
    const combined = [...stewardOrders, ...localOrders.map(order => ({ ...order, source: order.source || 'legacy' }))];
    combined.sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
    return NextResponse.json(combined.slice(0, 100), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not load orders.' }, { status: 502 });
  }
}
