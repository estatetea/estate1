import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const BREW_URL = (process.env.BREW_URL || 'https://estate-tea-brew.onrender.com').replace(/\/$/, '');
const OWNER_KEY = process.env.BREW_OWNER_CONTROL_KEY || process.env.OWNER_CONTROL_KEY;

export async function PUT(request, { params }) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) return NextResponse.json({ error: 'Brew owner connection is not configured' }, { status: 503 });
  try {
    const body = await request.json();
    if (!['approve', 'reject'].includes(body.decision)) return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    const { approvalId } = await params;
    const payload = {
      approved: body.decision === 'approve',
      edited_subject: body.edited_subject ?? null,
      edited_body: body.edited_body ?? null,
      owner_note: body.owner_note ?? null,
    };
    const r = await fetch(`${BREW_URL}/brew/approvals/${encodeURIComponent(approvalId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-owner-key': OWNER_KEY },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch {
    return NextResponse.json({ error: 'Could not update Brew approval' }, { status: 502 });
  }
}
