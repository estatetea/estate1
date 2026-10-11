import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const OWNER_KEY = (process.env.OWNER_CONTROL_KEY || process.env.STEWARD_OWNER_CONTROL_KEY || '').trim();
const STEWARD_URL = (process.env.STEWARD_URL || process.env.STEWARD_RENDER_URL || 'https://estate-tea-steward.onrender.com').replace(/\/$/, '');

export async function PATCH(request, { params }) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) {
    return NextResponse.json({ error: 'Owner-only delivery control is not configured. No status was changed.' }, { status: 503 });
  }

  try {
    const { orderId } = await params;
    const body = await request.json();
    const response = await fetch(`${STEWARD_URL}/api/steward/orders/${encodeURIComponent(orderId)}/delivery-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-owner-key': OWNER_KEY,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not save delivery status. Refresh and try again.' }, { status: 502 });
  }
}
