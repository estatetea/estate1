import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const { session_id } = await request.json();
    
    const resp = await fetch('https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data', {
      headers: { 'X-Session-ID': session_id }
    });
    if (!resp.ok) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    const userData = await resp.json();
    const { email, name, picture, session_token } = userData;

    try {
      const db = await getDb();
      const existing = await db.collection('users').findOne({ email }, { projection: { _id: 0 } });
      let userId;
      if (!existing) {
        userId = `user_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
        await db.collection('users').insertOne({ user_id: userId, email, name, picture, created_at: new Date().toISOString() });
      } else {
        userId = existing.user_id;
        await db.collection('users').updateOne({ email }, { $set: { name, picture } });
      }
      await db.collection('user_sessions').insertOne({
        user_id: userId, session_token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      });
    } catch {}

    const response = NextResponse.json({ name, email, picture, session_token });
    response.cookies.set('session_token', session_token, {
      httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 7 * 24 * 60 * 60
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
