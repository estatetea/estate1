import { NextResponse } from 'next/server';
import { verifyAdmin, issuePreviewToken } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// The owner's pass to preview the hidden collection page on the website.
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const token = issuePreviewToken();
  if (!token) return NextResponse.json({ error: 'Preview is not configured' }, { status: 503 });
  return NextResponse.json({ token }, { headers: { 'Cache-Control': 'no-store' } });
}
