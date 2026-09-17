import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/admin-auth';

const PENDING = ['pending', 'pending_owner_approval', 'awaiting_owner_approval', 'AWAITING_OWNER_APPROVAL'];

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const db = await getDb();
    const query = { status: { $in: PENDING } };
    const collection = db.collection('brew_approvals');
    const [count, rows] = await Promise.all([
      collection.countDocuments(query),
      collection.find(query).sort({ created_at: 1 }).limit(3).toArray(),
    ]);
    const items = rows.map(({ _id, ...row }) => ({ ...row, id: String(_id), approval_id: String(_id) }));
    return NextResponse.json({ count, threshold: 3, alert_owner: count >= 3, items });
  } catch {
    return NextResponse.json({ error: 'Could not load approval queue' }, { status: 500 });
  }
}
