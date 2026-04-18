import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    const generated = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated === razorpay_signature) {
      const db = await getDb();
      await db.collection('payments').insertOne({
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        status: 'verified',
        created_at: new Date().toISOString(),
      });
      return NextResponse.json({ verified: true, payment_id: razorpay_payment_id });
    } else {
      return NextResponse.json({ verified: false, error: 'Invalid payment signature' });
    }
  } catch (error) {
    return NextResponse.json({ verified: false, error: error.message }, { status: 500 });
  }
}
