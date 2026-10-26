import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { STEWARD_URL } from '@/lib/steward';
import { stewardHeaders } from '@/lib/enquiries';

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/website/enquiries?limit=100`, { headers: stewardHeaders(), cache: 'no-store' });
    return NextResponse.json(await r.json().catch(() => []), { status: r.status, headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Could not reach Steward' }, { status: 502 }); }
}

export async function PATCH(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { enquiry_id, status } = await request.json().catch(() => ({}));
  if (!/^ENQ-[A-F0-9]{8}$/.test(String(enquiry_id)) || !['new', 'handled'].includes(status)) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/website/enquiries/${enquiry_id}`, { method: 'PATCH', headers: stewardHeaders(), body: JSON.stringify({ status }), cache: 'no-store' });
    return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
  } catch { return NextResponse.json({ error: 'Could not reach Steward' }, { status: 502 }); }
}
