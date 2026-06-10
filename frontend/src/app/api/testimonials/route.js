import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = await getDb();
    const testimonials = await db.collection('testimonials')
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();
    return NextResponse.json(testimonials);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request) {
  try {
    const { name, text, rating } = await request.json();
    if (!name || !text) {
      return NextResponse.json({ error: 'Name and review are required' }, { status: 400 });
    }
    const db = await getDb();
    const testimonial = {
      id: uuidv4(),
      user_name: (name || '').slice(0, 50),
      text: (text || '').slice(0, 500),
      rating: Math.min(5, Math.max(1, rating || 5)),
      created_at: new Date().toISOString()
    };
    await db.collection('testimonials').insertOne({ ...testimonial });
    return NextResponse.json(testimonial);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
