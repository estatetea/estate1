import { NextResponse } from 'next/server';
const STEWARD_URL=(process.env.STEWARD_URL||'https://estate-tea-steward.onrender.com').replace(/\/$/,'');
export async function GET(_request,{params}){
  try{const {orderId}=await params;const r=await fetch(`${STEWARD_URL}/api/steward/orders/${encodeURIComponent(orderId)}/payment-status`,{cache:'no-store'});const data=await r.json().catch(()=>({}));return NextResponse.json(data,{status:r.status});}
  catch{return NextResponse.json({error:'Could not load order status'},{status:502});}
}
