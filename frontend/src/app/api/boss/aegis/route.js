import { NextResponse } from 'next/server';
import { ownerFromSession } from '@/lib/account';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const KEY = () => process.env.AEGIS_ALERT_SECRET?.trim() || process.env.OWNER_CONTROL_KEY?.trim() || process.env.INTERNAL_SERVICE_KEY?.trim() || '';
const AEGIS_URL = () => (process.env.AEGIS_URL || 'https://estate-tea-aegis.onrender.com').replace(/\/$/, '');
const notBoss = () => NextResponse.json({ error: 'Only the owner can talk to Aegis.' }, { status: 401 });

// Aegis on the website, for the boss only: signed in with his own WhatsApp number (checked on the server from the
// httpOnly session cookie). The same Aegis as the web app: same memory, same chat history, same powers.
export async function POST(request) {
  if (!(await ownerFromSession(request))) return notBoss();
  const b = await request.json().catch(() => ({}));
  const message = String(b?.message || '').trim().slice(0, 4000);
  if (!message) return NextResponse.json({ error: 'Type a message for Aegis.' }, { status: 400 });
  try {
    const r = await fetch(`${AEGIS_URL()}/api/aegis/chat`, { method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'x-internal-service-key': KEY() }, body: JSON.stringify({ message, channel: 'website' }) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ error: typeof data.detail === 'string' ? data.detail : 'Aegis could not answer just now.' }, { status: r.status === 409 ? 409 : 502 });
    return NextResponse.json({ answer: String(data.response || '').trim(), brain: data.brain || '' });
  } catch { return NextResponse.json({ error: 'Aegis is unreachable just now. Please try again in a moment.' }, { status: 502 }); }
}

export async function GET(request) {
  if (!(await ownerFromSession(request))) return notBoss();
  try {
    const r = await fetch(`${AEGIS_URL()}/api/aegis/chat/history`, { cache: 'no-store', headers: { 'x-internal-service-key': KEY() } });
    const rows = r.ok ? await r.json().catch(() => []) : [];
    const msgs = (Array.isArray(rows) ? rows : []).slice(0, 12).reverse()
      .map(m => ({ role: m.role === 'user' ? 'you' : 'aegis', text: String(m.content || '') })).filter(m => m.text);
    return NextResponse.json({ messages: msgs });
  } catch { return NextResponse.json({ messages: [] }); }
}
