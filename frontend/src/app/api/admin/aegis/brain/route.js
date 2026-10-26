import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const INTERNAL_KEY = process.env.AEGIS_ALERT_SECRET?.trim() || process.env.OWNER_CONTROL_KEY?.trim() || process.env.INTERNAL_SERVICE_KEY?.trim() || '';
const AEGIS_URL = (process.env.AEGIS_URL || 'https://estate-tea-aegis.onrender.com').replace(/\/$/, '');

// Which reasoning models Aegis has connected (no keys are ever returned).
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const response = await fetch(`${AEGIS_URL}/api/aegis/intelligence/status`, { headers: { 'x-internal-service-key': INTERNAL_KEY }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: 'Could not read Aegis status' }, { status: response.status });
    const { brain_provider, model, groq_configured, gemini_configured, groq_daily_usage, groq_last_error } = data;
    return NextResponse.json({ brain_provider, model, groq_configured, gemini_configured, groq_daily_usage, groq_last_error }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Aegis unavailable' }, { status: 502 });
  }
}
