import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  const { password } = await request.json();
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass || password !== adminPass) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  // Create a signed token: hash of password + secret
  const token = crypto.createHmac('sha256', adminPass).update('estate-tea-admin').digest('hex');
  return NextResponse.json({ token });
}
