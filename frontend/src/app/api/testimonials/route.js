import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/mongodb';
import { clientKey, createLimiter } from '@/lib/rate-limit';
import { forwardEnquiry } from '@/lib/enquiries';

// Reviews are public and unauthenticated; cap how many one visitor can post.
const limiter = createLimiter('testimonials', { windowMs: 60 * 60 * 1000, lockMs: 60 * 60 * 1000, maxFailures: 3 });

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
    const key = clientKey(request);
    const locked = limiter.lockedFor(key);
    if (locked) {
      return NextResponse.json({ error: 'Thanks! You have already shared a few reviews. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(locked) } });
    }
    const { name, text, rating } = await request.json();
    const userName = String(name || '').trim();
    const reviewText = String(text || '').trim();
    if (!userName || !reviewText) {
      return NextResponse.json({ error: 'Name and review are required' }, { status: 400 });
    }
    const stars = Math.round(Number(rating));

    const db = await getDb();
    const testimonial = {
      id: uuidv4(),
      user_name: userName.slice(0, 50),
      text: reviewText.slice(0, 500),
      rating: Number.isFinite(stars) ? Math.min(5, Math.max(1, stars)) : 5,
      created_at: new Date().toISOString()
    };
    await db.collection('testimonials').insertOne({ ...testimonial });
    limiter.fail(key);
    // Let the owner know a new review went up (Aegis announces it; it also shows in Inbox → Enquiries).
    await forwardEnquiry({ kind: 'review', name: testimonial.user_name, message: testimonial.text, rating: testimonial.rating }).catch(() => {});
    return NextResponse.json(testimonial);
  } catch (error) {
    console.error('Testimonial error:', error);
    return NextResponse.json({ error: 'Could not save your review. Please try again.' }, { status: 500 });
  }
}
