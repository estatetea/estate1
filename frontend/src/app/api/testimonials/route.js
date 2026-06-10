import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = await getDb();
    const testimonials = await db.collection('testimonials')
      .find({}, { projection: { _id: 0, user_email: 0 } })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();
    return NextResponse.json(testimonials);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request) {
  const token = request.cookies.get('session_token')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Sign in to leave a review' }, { status: 401 });

  try {
    const db = await getDb();
    const session = await db.collection('user_sessions').findOne({ session_token: token }, { projection: { _id: 0 } });
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    
    const user = await db.collection('users').findOne({ user_id: session.user_id }, { projection: { _id: 0 } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });

    const { text, rating } = await request.json();
    const testimonial = {
      id: uuidv4(),
      user_name: user.name,
      user_picture: user.picture || '',
      user_email: user.email,
      text: (text || '').slice(0, 500),
      rating: Math.min(5, Math.max(1, rating || 5)),
      created_at: new Date().toISOString()
    };
    await db.collection('testimonials').insertOne({ ...testimonial });
    delete testimonial.user_email;
    return NextResponse.json(testimonial);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
