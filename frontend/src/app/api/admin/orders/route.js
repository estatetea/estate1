import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const db = await getDb();
    const orders = await db.collection('orders').find({}, { projection: { _id: 0 } }).sort({ timestamp: -1 }).limit(50).toArray();
    return NextResponse.json(orders);
  } catch { return NextResponse.json([]); }
}
