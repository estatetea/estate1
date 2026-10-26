import { NextResponse } from 'next/server';
import { STEWARD_URL } from '@/lib/steward';
const INTERNAL_KEY=process.env.INTERNAL_SERVICE_KEY||process.env.OWNER_CONTROL_KEY||'';
export async function GET(_request,{params}){
  try{const {orderId}=await params;const r=await fetch(`${STEWARD_URL}/api/steward/orders/${encodeURIComponent(orderId)}/payment-status`,{headers:{'x-internal-service-key':INTERNAL_KEY},cache:'no-store'});const data=await r.json().catch(()=>({}));return NextResponse.json(data,{status:r.status});}
  catch{return NextResponse.json({error:'Could not load order status'},{status:502});}
}
