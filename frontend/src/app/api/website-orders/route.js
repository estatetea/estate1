import { NextResponse } from 'next/server';
import { LEDGER_URL, STEWARD_URL } from '@/lib/steward';
const INTERNAL_KEY=process.env.INTERNAL_SERVICE_KEY||process.env.OWNER_CONTROL_KEY||'';
export async function POST(request){
  try{
    const body=await request.json();
    const r=await fetch(`${STEWARD_URL}/api/steward/website/orders`,{method:'POST',headers:{'Content-Type':'application/json','x-internal-service-key':INTERNAL_KEY},body:JSON.stringify(body),cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    if (!r.ok) return NextResponse.json(data,{status:r.status});
    // Steward now gets the ET number from Ledger before creating the Razorpay order.
    const existing = data.estate_order_number || data.customer_order_number;
    if (existing) return NextResponse.json({ ...data, estate_order_number: existing, customer_order_number: existing }, { status: r.status });
    // Fallback for an older Steward: reserve the permanent ET number before checkout can launch payment.
    const ledgerKey = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || '';
    if (!ledgerKey || !data.order_id) {
      return NextResponse.json({error:'Your order was created, but its confirmation number could not be secured yet. Please contact Estate Tea before attempting payment.'},{status:503});
    }
    const numbered = await fetch(`${LEDGER_URL}/api/ledger/orders/${encodeURIComponent(data.order_id)}/reserve-number`, {
      method:'POST',
      headers:{'x-internal-service-key':ledgerKey},
      cache:'no-store',
    });
    const numberData = await numbered.json().catch(()=>({}));
    if (!numbered.ok || !numberData.customer_order_number) {
      return NextResponse.json({error:'Your order was created, but its confirmation number could not be secured yet. Please contact Estate Tea before attempting payment.'},{status:503});
    }
    return NextResponse.json({...data, estate_order_number:numberData.customer_order_number, customer_order_number:numberData.customer_order_number},{status:r.status});
  }catch{return NextResponse.json({error:'Could not create website order'},{status:502});}
}
