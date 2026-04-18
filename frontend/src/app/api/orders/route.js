import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const body = await request.json();
    const order = {
      id: uuidv4(),
      customer_name: body.customer_name,
      customer_age: body.customer_age || 0,
      customer_place: body.customer_place,
      product_name: body.product_name,
      variant: body.variant,
      price: body.price,
      quantity: body.quantity || 1,
      timestamp: new Date().toISOString(),
    };

    const db = await getDb();
    await db.collection('orders').insertOne({ ...order });

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const db = await getDb();
    const orders = await db.collection('orders').find({}, { projection: { _id: 0 } }).skip(skip).limit(limit).toArray();
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
