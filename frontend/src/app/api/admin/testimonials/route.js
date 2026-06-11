import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const db = await getDb();
    const testimonials = await db.collection('testimonials').find({}, { projection: { _id: 0 } }).sort({ created_at: -1 }).limit(50).toArray();
    return NextResponse.json(testimonials);
  } catch { return NextResponse.json([]); }
}
