import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/admin-auth';

const DEFAULTS = [
  { product_id: '250g', name: 'Estate Premium Tea', weight: '250 grams', price: 200, in_stock: true },
  { product_id: '500g', name: 'Estate Premium Tea', weight: '500 grams', price: 390, in_stock: true },
];

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const db = await getDb();
    let products = await db.collection('products').find({}, { projection: { _id: 0 } }).toArray();
    if (!products.length) {
      await db.collection('products').insertMany(DEFAULTS.map(p => ({ ...p })));
      products = DEFAULTS;
    }
    return NextResponse.json(products);
  } catch { return NextResponse.json(DEFAULTS); }
}

export async function PUT(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { product_id, price, in_stock } = await request.json();
    const db = await getDb();
    if (typeof product_id !== 'string' || !product_id) return NextResponse.json({ error: 'Unknown product' }, { status: 400 });
    const update = {};
    if (price !== undefined) {
      const value = Number(price);
      if (!Number.isFinite(value) || value <= 0 || value > 100000) return NextResponse.json({ error: 'Enter a valid price' }, { status: 400 });
      update.price = value;
    }
    if (in_stock !== undefined) update.in_stock = Boolean(in_stock);
    if (!Object.keys(update).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    await db.collection('products').updateOne({ product_id }, { $set: update });
    const product = await db.collection('products').findOne({ product_id }, { projection: { _id: 0 } });
    return NextResponse.json(product);
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
