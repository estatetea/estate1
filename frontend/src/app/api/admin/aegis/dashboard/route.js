import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_URL = (process.env.AEGIS_URL || 'https://estate-tea-aegis.onrender.com').replace(/\/$/, '');

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    // Connectivity is intentionally independent from rich work/history. Never
    // make the owner wait for task aggregation before showing agent state.
    let response = await fetch(`${AEGIS_URL}/api/aegis/dashboard/fast`, { cache: 'no-store' });
    if (response.status === 404 || response.status === 405) response = await fetch(`${AEGIS_URL}/api/aegis/dashboard`, { cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ error: 'Aegis unavailable', upstream_status: response.status }, { status: 502 });
    const payload = await response.json();
    payload.rich_loaded = !response.url?.includes('/dashboard/fast');
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch {
    return NextResponse.json({ error: 'Aegis unavailable' }, { status: 502 });
  }
}
export async function PUT(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const input = await request.json();
    const approval_id = String(input?.approval_id || '').trim();
    const action = String(input?.action || '').trim().toLowerCase();
    const { edited_subject, edited_body, owner_note } = input || {};
    if (!approval_id) return NextResponse.json({ error: 'Missing approval ID' }, { status: 400 });
    if (!['approve','reject','edit'].includes(action)) {
      return NextResponse.json({ error: `Invalid approval decision: ${action || 'missing action'}` }, { status: 400 });
    }
    const response = await fetch(`${AEGIS_URL}/api/aegis/approvals/${encodeURIComponent(approval_id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ action, edited_subject, edited_body, owner_note }),
    });
    const raw = await response.text();
    let payload = {};
    try { payload = raw ? JSON.parse(raw) : {}; } catch {
      payload = { error: response.ok ? 'Approval service returned an invalid response.' : `Approval service failed with HTTP ${response.status}.` };
    }
    if (!response.ok && !payload?.error && payload?.detail) payload.error = typeof payload.detail === 'string' ? payload.detail : 'Approval could not be completed.';
    return NextResponse.json(payload, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: `Approval service unavailable: ${error?.message || 'connection failed'}` }, { status: 502 });
  }
}

export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const input = await request.json();
    const kind=String(input?.kind||'').trim(), item_id=String(input?.item_id||'').trim(), action=String(input?.action||'').trim();
    if(!['sample','order'].includes(kind)||!item_id||action!=='mark_delivered') return NextResponse.json({error:'Invalid fulfilment action'},{status:400});
    const response=await fetch(`${AEGIS_URL}/api/aegis/fulfilment/${encodeURIComponent(kind)}/${encodeURIComponent(item_id)}`,{method:'PUT',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({action})});
    const payload=await response.json().catch(()=>({}));return NextResponse.json(payload,{status:response.status,headers:{'Cache-Control':'no-store'}});
  } catch { return NextResponse.json({error:'Fulfilment service unavailable'},{status:502}); }
}
