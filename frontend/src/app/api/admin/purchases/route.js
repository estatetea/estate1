import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { LEDGER_URL } from '@/lib/steward';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';
const headers = { 'Content-Type': 'application/json', 'x-internal-service-key': INTERNAL_KEY };

async function ledger(path, init = {}) {
  try {
    const r = await fetch(`${LEDGER_URL}/api/ledger${path}`, { ...init, headers, cache: 'no-store' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ error: typeof data.detail === 'string' ? data.detail : 'Ledger could not do that' }, { status: r.status });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Could not reach Ledger' }, { status: 502 }); }
}

// Tea purchases recorded for the GST credit: ?defaults=1 for the usual terms, ?month=YYYY-MM for the list.
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const q = new URL(request.url).searchParams;
  if (q.get('defaults')) return ledger('/purchases/defaults');
  const month = q.get('month') || '';
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: 'Choose a month' }, { status: 400 });
  return ledger(`/purchases?month=${month}`);
}

export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return ledger('/purchases', { method: 'POST', body: JSON.stringify(await request.json().catch(() => ({}))) });
}

export async function PUT(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return ledger('/purchases/defaults', { method: 'PUT', body: JSON.stringify(await request.json().catch(() => ({}))) });
}

export async function DELETE(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^PUR-[A-F0-9]{8}$/.test(id)) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  return ledger(`/purchases/${id}`, { method: 'DELETE' });
}
