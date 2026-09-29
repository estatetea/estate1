import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';
const AEGIS_URL = (process.env.AEGIS_URL || 'https://estate-tea-aegis.onrender.com').replace(/\/$/, '');

// Restore the owner's persisted Aegis conversation without exposing the
// backend history endpoint directly to the browser.
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const response = await fetch(`${AEGIS_URL}/api/aegis/chat/history`, {
      headers: { 'x-internal-service-key': INTERNAL_KEY },
      cache: 'no-store',
    });
    const raw = await response.text();
    let data;
    try { data = raw ? JSON.parse(raw) : []; } catch { data = []; }
    if (!response.ok) return NextResponse.json({ error: 'Could not load chat history' }, { status: response.status });
    return NextResponse.json(
      { messages: Array.isArray(data) ? data : [] },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  } catch {
    return NextResponse.json({ error: 'Aegis unavailable' }, { status: 502 });
  }
}
