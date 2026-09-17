import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');

export async function GET(request){
  if(!verifyAdmin(request)) return NextResponse.json({error:'Unauthorized'},{status:401});
  try{
    const r=await fetch(`${AEGIS_URL}/api/aegis/voice/status`,{cache:'no-store'});
    const data=await r.json().catch(()=>({configured:false}));
    return NextResponse.json(data,{status:r.status});
  }catch{
    return NextResponse.json({configured:false,error:'Aegis voice unavailable'},{status:502});
  }
}
