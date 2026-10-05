import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const INTERNAL_KEY=process.env.AEGIS_ALERT_SECRET?.trim()||process.env.OWNER_CONTROL_KEY?.trim()||process.env.INTERNAL_SERVICE_KEY?.trim()||'';
const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');

export async function POST(request){
  if(!verifyAdmin(request)) return NextResponse.json({error:'Unauthorized'},{status:401});
  try{
    const r=await fetch(`${AEGIS_URL}/api/aegis/voice/transcribe-token`,{method:'POST',headers:{'x-internal-service-key':INTERNAL_KEY},cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    return NextResponse.json(data,{status:r.status});
  }catch{
    return NextResponse.json({error:'Realtime transcription is unavailable'},{status:502});
  }
}
