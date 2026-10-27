import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { printHelperSetupCmd } from '@/lib/print-helper-script';

// One double-click setup file for the Windows laptop print helper (carries the helper's narrow key).
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const key = (process.env.PRINT_HELPER_KEY || '').trim();
  if (!key) return NextResponse.json({ error: 'Laptop printing is not configured yet' }, { status: 503 });
  return new NextResponse(printHelperSetupCmd(key), {
    headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="EstateTeaPrintSetup.cmd"', 'Cache-Control': 'no-store' },
  });
}
