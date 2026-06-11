import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/admin-auth';

export async function DELETE(request, { params }) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const db = await getDb();
    await db.collection('testimonials').deleteOne({ id });
    return NextResponse.json({ deleted: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
