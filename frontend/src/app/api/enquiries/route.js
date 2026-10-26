import { NextResponse } from 'next/server';
import { clientKey, createLimiter } from '@/lib/rate-limit';
import { forwardEnquiry } from '@/lib/enquiries';

// Public: a visitor can send a few enquiries an hour.
const limiter = createLimiter('enquiries', { windowMs: 60 * 60 * 1000, lockMs: 60 * 60 * 1000, maxFailures: 5 });

export async function POST(request) {
  const key = clientKey(request);
  if (limiter.lockedFor(key)) return NextResponse.json({ error: 'Thanks, we already have your enquiry. Please try again later.' }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim().slice(0, 120);
  const contact = String(body.contact || '').trim().slice(0, 200);
  const quantity = Number(body.quantity_kg);
  if (!name || !contact) return NextResponse.json({ error: 'Please add your name and an email or phone number.' }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity < 10) return NextResponse.json({ error: 'Bulk orders start at 10 kg.' }, { status: 400 });
  try {
    const data = await forwardEnquiry({ kind: 'bulk', name, contact, quantity_kg: quantity, message: String(body.message || '').slice(0, 2000) });
    limiter.fail(key);
    return NextResponse.json({ ok: true, enquiry_id: data.enquiry_id });
  } catch {
    return NextResponse.json({ error: 'We could not send your enquiry just now. Please try again in a minute.' }, { status: 502 });
  }
}
