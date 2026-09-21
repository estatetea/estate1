import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_URL = (process.env.AEGIS_URL || 'https://estate-tea-aegis.onrender.com').replace(/\/$/, '');

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const response = await fetch(`${AEGIS_URL}/api/aegis/dashboard`, { cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ error: 'Aegis unavailable' }, { status: 502 });
    const payload = await response.json();
    const snap = payload?.snapshot || {};
    if (Array.isArray(snap.agents)) {
      snap.agents = snap.agents.map(agent => ({
        ...agent,
        recent_work: Array.isArray(agent.recent_work) ? agent.recent_work : [],
        recent_activity: Array.isArray(agent.recent_activity) ? agent.recent_activity : [],
        task_history: Array.isArray(agent.task_history) ? agent.task_history : [],
        daily_progress: agent.daily_progress || { activity_count: 0, completed_count: 0, recent: [] },
      }));
    }
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
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Approval service unavailable' }, { status: 502 });
  }
}
