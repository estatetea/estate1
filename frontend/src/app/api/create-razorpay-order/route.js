import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request) {
  try {
    const { amount, customer_name, variant } = await request.json();

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await instance.orders.create({
      amount: amount * 100,
      currency: 'INR',
      payment_capture: 1,
      notes: { customer_name, variant },
    });

    return NextResponse.json({
      order_id: order.id,
      amount,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return NextResponse.json({ error: `Failed to create payment order: ${error.message}` }, { status: 500 });
  }
}
