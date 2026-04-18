import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    email_configured: false,
    sms_configured: false,
    email_provider: null,
    sms_provider: null,
  });
}
