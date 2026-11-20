import { NextResponse } from 'next/server';
import { verifyStaff, teamMembers } from '@/lib/team-auth';
import { LEDGER_URL } from '@/lib/steward';

// Accounts and projects (Ledger), for the owner and the team. Who did what goes along as the actor's name.
const KEY = (process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '').trim();
const ALLOWED = [/^items$/, /^pnl$/, /^owed$/, /^costs$/, /^expenses$/, /^expenses\/EXP-[A-Z0-9]{8}$/, /^expenses\/EXP-[A-Z0-9]{8}\/bill$/,
  /^projects$/, /^projects\/PRJ-[A-Z0-9]{6}$/, /^tasks$/, /^tasks\/TSK-[A-Z0-9]{6}$/];

async function handle(request, { params }) {
  const who = await verifyStaff(request);
  if (!who) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const path = ((await params).path || []).join('/');
  if (path === 'people') {   // who tasks can be given to
    try {
      const team = await (await teamMembers()).find({ deleted: { $ne: true }, active: { $ne: false } }).toArray();
      return NextResponse.json({ people: ['Owner', ...team.map(m => m.name)] });
    } catch { return NextResponse.json({ people: ['Owner'] }); }
  }
  if (!ALLOWED.some(rx => rx.test(path))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!KEY) return NextResponse.json({ error: 'Ledger connection is not configured' }, { status: 503 });
  const qs = new URL(request.url).search;
  const init = { method: request.method, cache: 'no-store', headers: { 'x-internal-service-key': KEY, 'x-actor': encodeURIComponent(who.name || 'Owner').slice(0, 120), 'Content-Type': 'application/json' } };
  if (!['GET', 'DELETE'].includes(request.method)) init.body = await request.text();
  try {
    const r = await fetch(`${LEDGER_URL}/api/ledger/accounts/${path}${qs}`, init);
    const data = await r.json().catch(() => ({}));
    if (r.ok) return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
    const d = data.detail;
    return NextResponse.json({ error: typeof d === 'string' ? d : Array.isArray(d) ? (d[0]?.msg || 'Please check the details') : 'Ledger could not do that' }, { status: r.status });
  } catch { return NextResponse.json({ error: 'Could not reach Ledger' }, { status: 502 }); }
}
export const GET = handle, POST = handle, PUT = handle, PATCH = handle, DELETE = handle;
