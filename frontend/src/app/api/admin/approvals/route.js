import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const db = await getDb();
    const rows = await db.collection('brew_approvals').find({
      $or: [
        { status: { $in: ['pending', 'awaiting_owner_approval', 'AWAITING_OWNER_APPROVAL'] } },
        { decision: { $in: [null, 'pending'] } },
      ],
    }, { projection: { _id: 0 } }).sort({ created_at: 1 }).limit(50).toArray();
    return NextResponse.json({ count: rows.length, threshold: 3, alert_owner: rows.length >= 3, items: rows });
  } catch {
    return NextResponse.json({ error: 'Could not load approval queue' }, { status: 500 });
  }
}
