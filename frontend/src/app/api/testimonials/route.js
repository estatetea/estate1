import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

async function getDb() {
  const { MongoClient } = await import('mongodb');
  const uri = process.env.MONGO_URL;
  if (!uri) throw new Error('MONGO_URL env var not set');
  const client = new MongoClient(uri);
  await client.connect();
  return client.db(process.env.DB_NAME || 'estate_tea');
}

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
    console.error('Testimonial error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
