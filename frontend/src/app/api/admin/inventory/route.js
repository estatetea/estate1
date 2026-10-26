import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { STEWARD_URL } from '@/lib/steward';

const OWNER_KEY = process.env.OWNER_CONTROL_KEY || process.env.STEWARD_OWNER_CONTROL_KEY || '';
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || OWNER_KEY;

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/inventory`, { headers: { 'x-internal-service-key': INTERNAL_KEY }, cache: 'no-store' });
    const body = await r.json();
    return NextResponse.json(body, { status: r.status });
  } catch { return NextResponse.json({ error: 'Could not reach Steward' }, { status: 502 }); }
}

export async function PUT(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) return NextResponse.json({ error: 'Steward owner connection is not configured' }, { status: 503 });
  try {
    const { physical_kg } = await request.json();
    if (!Number.isFinite(Number(physical_kg)) || Number(physical_kg) < 0) return NextResponse.json({ error: 'Invalid stock amount' }, { status: 400 });
    const r = await fetch(`${STEWARD_URL}/api/steward/inventory/set`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-internal-service-key': INTERNAL_KEY },
      body: JSON.stringify({ physical_kg: Number(physical_kg), owner_key: OWNER_KEY }), cache: 'no-store'
    });
    const body = await r.json();
    return NextResponse.json(body, { status: r.status });
  } catch { return NextResponse.json({ error: 'Could not update Steward inventory' }, { status: 502 }); }
}

// Owner stock changes from the web app: { action: 'receive' | 'remove', quantity_kg, note }.
export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!OWNER_KEY) return NextResponse.json({ error: 'Steward owner connection is not configured' }, { status: 503 });
  try {
    const { action, quantity_kg, note } = await request.json();
    const quantity = Number(quantity_kg);
    if (!['receive', 'remove'].includes(action)) return NextResponse.json({ error: 'Unknown stock action' }, { status: 400 });
    if (!Number.isFinite(quantity) || quantity <= 0) return NextResponse.json({ error: 'Enter a stock amount above zero' }, { status: 400 });
    const r = await fetch(`${STEWARD_URL}/api/steward/inventory/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-internal-service-key': INTERNAL_KEY },
      body: JSON.stringify({ quantity_kg: quantity, note: String(note || '').slice(0, 300), owner_key: OWNER_KEY }), cache: 'no-store'
    });
    const body = await r.json().catch(() => ({}));
    return NextResponse.json(body, { status: r.status });
  } catch { return NextResponse.json({ error: 'Could not update Steward inventory' }, { status: 502 }); }
}
