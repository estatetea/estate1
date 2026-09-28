import { NextResponse } from 'next/server';
const INTERNAL_KEY=process.env.INTERNAL_SERVICE_KEY||process.env.OWNER_CONTROL_KEY||'';
const STEWARD_URL=(process.env.STEWARD_URL||'https://estate-tea-steward.onrender.com').replace(/\/$/,'');
export async function POST(request,{params}){
  try{
    const {orderId}=await params;const body=await request.json();
    if(!body.razorpay_payment_id)return NextResponse.json({error:'Missing payment id'},{status:400});
    const r=await fetch(`${STEWARD_URL}/api/steward/orders/${encodeURIComponent(orderId)}/razorpay-verify`,{method:'POST',headers:{'Content-Type':'application/json','x-internal-service-key':INTERNAL_KEY},body:JSON.stringify({razorpay_payment_id:body.razorpay_payment_id}),cache:'no-store'});
    const data=await r.json().catch(()=>({}));return NextResponse.json(data,{status:r.status});
  }catch{return NextResponse.json({error:'Could not verify website payment'},{status:502});}
}
