import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(request){
  if(!verifyAdmin(request)) return NextResponse.json({error:'Unauthorized'},{status:401});
  const key=(process.env.ELEVENLABS_API_KEY||'').trim();
  if(!key) return NextResponse.json({error:'Realtime transcription is not configured'},{status:503});
  try{
    const r=await fetch('https://api.elevenlabs.io/v1/single-use-token/realtime_scribe',{
      method:'POST',headers:{'xi-api-key':key},cache:'no-store'
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.token) return NextResponse.json({error:data.detail?.message||data.detail||'Could not start realtime transcription'},{status:r.status||502});
    return NextResponse.json({token:data.token,model:'scribe_v2_realtime',vad_silence_threshold_secs:1.8});
  }catch{
    return NextResponse.json({error:'Could not reach ElevenLabs transcription'},{status:502});
  }
}
