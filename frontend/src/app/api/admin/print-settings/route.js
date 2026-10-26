import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { STEWARD_URL } from '@/lib/steward';
import { stewardHeaders } from '@/lib/enquiries';

async function steward(init) {
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/print-settings`, { ...init, headers: stewardHeaders(), cache: 'no-store' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ error: typeof data.detail === 'string' ? data.detail : 'Could not save printer settings' }, { status: r.status });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: 'Could not reach Steward' }, { status: 502 }); }
}

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return steward({});
}

export async function PUT(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { enabled, printer_email } = await request.json().catch(() => ({}));
  return steward({ method: 'PUT', body: JSON.stringify({ enabled: Boolean(enabled), printer_email: String(printer_email || '').slice(0, 254) }) });
}
