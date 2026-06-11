import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { addToken } from '@/lib/admin-auth';

export async function POST(request) {
  const { password } = await request.json();
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass || password !== adminPass) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
  const token = crypto.randomBytes(32).toString('hex');
  addToken(token);
  return NextResponse.json({ token });
}
