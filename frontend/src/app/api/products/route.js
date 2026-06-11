import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

const DEFAULTS = [
  { product_id: '250g', weight: '250 grams', price: 200, in_stock: true },
  { product_id: '500g', weight: '500 grams', price: 390, in_stock: true },
];

export async function GET() {
  try {
    const db = await getDb();
    let products = await db.collection('products').find({}, { projection: { _id: 0, name: 0 } }).toArray();
    if (!products.length) return NextResponse.json(DEFAULTS);
    return NextResponse.json(products);
  } catch { return NextResponse.json(DEFAULTS); }
}
