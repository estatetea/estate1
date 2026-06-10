import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    mongo_url_set: !!process.env.MONGO_URL,
    db_name: process.env.DB_NAME || '(not set, using default)',
    razorpay_key_set: !!process.env.RAZORPAY_KEY_ID,
  });
}
