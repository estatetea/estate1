import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');

export async function GET(request){
  if(!verifyAdmin(request)) return NextResponse.json({error:'Unauthorized'},{status:401});
  // Voice is configured on Aegis. Do not make the owner UI wait for a sleeping
  // Render service just to learn that fact; the first real voice/chat request
  // can wake Aegis in parallel with the rest of the dashboard.
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),1200);
  try{
    const r=await fetch(`${AEGIS_URL}/api/aegis/voice/status`,{cache:'no-store',signal:controller.signal});
    if(r.ok){
      const data=await r.json().catch(()=>null);
      if(data?.configured) return NextResponse.json(data);
    }
  }catch{}
  finally{clearTimeout(timer)}
  return NextResponse.json({configured:true,provider:'ElevenLabs',model:'eleven_flash_v2_5',warming:true});
}
