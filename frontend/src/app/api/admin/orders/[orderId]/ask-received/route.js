import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { BREW_URL } from '@/lib/account';

export const dynamic = 'force-dynamic';

// "Ask if received": Brew sends the customer [Yes, I've received] [There's a problem] on WhatsApp now (or emails them).
export async function POST(request, { params }) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { orderId } = await params;
  try {
    const r = await fetch(`${BREW_URL}/brew/orders/${encodeURIComponent(orderId)}/ask-received`, { method: 'POST', cache: 'no-store',
      headers: { 'x-internal-service-key': process.env.INTERNAL_SERVICE_KEY || '' } });
    const b = await r.json().catch(() => ({}));
    return NextResponse.json(r.ok ? b : { error: typeof b.detail === 'string' ? b.detail : 'Brew could not send it' }, { status: r.ok ? 200 : r.status });
  } catch { return NextResponse.json({ error: 'Brew is not reachable right now' }, { status: 502 }); }
}
