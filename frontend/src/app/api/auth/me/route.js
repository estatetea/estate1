import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(request) {
  const token = request.cookies.get('session_token')?.value 
    || request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const db = await getDb();
    const session = await db.collection('user_sessions').findOne({ session_token: token }, { projection: { _id: 0 } });
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    
    const user = await db.collection('users').findOne({ user_id: session.user_id }, { projection: { _id: 0 } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });
    
    return NextResponse.json({ name: user.name, email: user.email, picture: user.picture });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
