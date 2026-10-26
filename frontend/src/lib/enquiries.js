import { STEWARD_URL } from '@/lib/steward';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';

// Hands a website enquiry (bulk order, review, question) to Steward so the owner sees it.
export async function forwardEnquiry(enquiry) {
  if (!INTERNAL_KEY) throw new Error('not configured');
  const r = await fetch(`${STEWARD_URL}/api/steward/website/enquiries`, {
    method: 'POST', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', 'x-internal-service-key': INTERNAL_KEY },
    body: JSON.stringify(enquiry),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Could not send your enquiry');
  return data;
}

export const stewardHeaders = () => ({ 'Content-Type': 'application/json', 'x-internal-service-key': INTERNAL_KEY });
