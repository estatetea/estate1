import { NextResponse } from 'next/server';
const INTERNAL_KEY=process.env.INTERNAL_SERVICE_KEY||process.env.OWNER_CONTROL_KEY||'';
const STEWARD_URL=(process.env.STEWARD_URL||'https://estate-tea-steward.onrender.com').replace(/\/$/,'');
export async function POST(request){
  try{
    const body=await request.json();
    const r=await fetch(`${STEWARD_URL}/api/steward/website/orders`,{method:'POST',headers:{'Content-Type':'application/json','x-internal-service-key':INTERNAL_KEY},body:JSON.stringify(body),cache:'no-store'});
    const data=await r.json(); return NextResponse.json(data,{status:r.status});
  }catch{return NextResponse.json({error:'Could not create website order'},{status:502});}
}
