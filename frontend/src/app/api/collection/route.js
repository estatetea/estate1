import { NextResponse } from 'next/server';
import { verifyPreview } from '@/lib/admin-auth';
import { STEWARD_URL } from '@/lib/steward';

export const dynamic = 'force-dynamic';
const INTERNAL_KEY = () => process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';

// The collection page: empty ("coming soon") until the owner makes it public. Only his preview pass shows it before then.
export async function GET(request) {
  const preview = verifyPreview(request);
  try {
    const r = await fetch(`${STEWARD_URL}/api/steward/collection${preview ? '?preview=true' : ''}`, { headers: { 'x-internal-service-key': INTERNAL_KEY() }, cache: 'no-store' });
    const b = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ items: [], error: 'unavailable' }, { status: 200 });
    return NextResponse.json(b, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ items: [], error: 'unavailable' }); }
}
