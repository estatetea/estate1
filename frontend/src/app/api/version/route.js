import { NextResponse } from 'next/server';

// Which build is live, so open tabs can tell when a newer version has been published.
export const dynamic = 'force-dynamic';
export function GET() {
  return NextResponse.json({ version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || 'dev' }, { headers: { 'Cache-Control': 'no-store' } });
}
