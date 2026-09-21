import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_URL = (process.env.AEGIS_URL || 'https://estate-tea-aegis.onrender.com').replace(/\/$/, '');

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const response = await fetch(`${AEGIS_URL}/api/aegis/dashboard`, { cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ error: 'Aegis unavailable' }, { status: 502 });
    const payload = await response.json();
    // Keep the owner UI resilient while Aegis rolls forward: never silently
    // discard per-agent operational fields returned by the supervisor.
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
