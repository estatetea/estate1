import { NextResponse } from 'next/server';
const INTERNAL_KEY=process.env.INTERNAL_SERVICE_KEY||process.env.OWNER_CONTROL_KEY||'';
const STEWARD_URL=(process.env.STEWARD_URL||'https://estate-tea-steward-git-main-jadenpbenjaminjb-4968s-projects.vercel.app').replace(/\/$/,'');
export async function GET(_request,{params}){
  try{const {orderId}=await params;const r=await fetch(`${STEWARD_URL}/api/steward/orders/${encodeURIComponent(orderId)}/payment-status`,{headers:{'x-internal-service-key':INTERNAL_KEY},cache:'no-store'});const data=await r.json().catch(()=>({}));return NextResponse.json(data,{status:r.status});}
  catch{return NextResponse.json({error:'Could not load order status'},{status:502});}
}
