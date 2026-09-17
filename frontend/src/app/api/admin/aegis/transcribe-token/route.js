import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');

export async function POST(request){
  if(!verifyAdmin(request)) return NextResponse.json({error:'Unauthorized'},{status:401});
  try{
    const r=await fetch(`${AEGIS_URL}/api/aegis/voice/transcribe-token`,{method:'POST',cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    return NextResponse.json(data,{status:r.status});
  }catch{
    return NextResponse.json({error:'Realtime transcription is unavailable'},{status:502});
  }
}
