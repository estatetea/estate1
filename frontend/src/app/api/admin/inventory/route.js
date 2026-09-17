import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const STEWARD_URL = (process.env.STEWARD_URL || 'https://estate-tea-steward.onrender.com').replace(/\/$/, '');

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/inventory`, { cache: 'no-store' });
    const body = await r.json();
    return NextResponse.json(body, { status: r.status });
  } catch { return NextResponse.json({ error: 'Could not reach Steward' }, { status: 502 }); }
}

export async function PUT(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { physical_kg } = await request.json();
    if (!Number.isFinite(Number(physical_kg)) || Number(physical_kg) < 0) return NextResponse.json({ error: 'Invalid stock amount' }, { status: 400 });
    const r = await fetch(`${STEWARD_URL}/api/steward/inventory/set`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ physical_kg: Number(physical_kg) }), cache: 'no-store'
    });
    const body = await r.json();
    return NextResponse.json(body, { status: r.status });
  } catch { return NextResponse.json({ error: 'Could not update Steward inventory' }, { status: 502 }); }
}
