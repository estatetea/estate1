import { NextResponse } from 'next/server';

const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
const INTERNAL_KEY=process.env.INTERNAL_SERVICE_KEY||process.env.OWNER_CONTROL_KEY||process.env.AEGIS_ALERT_SECRET||'';

export async function GET(request){
  const secret=process.env.CRON_SECRET;
  if(secret && request.headers.get('authorization')!==`Bearer ${secret}`) return NextResponse.json({error:'Unauthorized'},{status:401});
  if(!INTERNAL_KEY) return NextResponse.json({error:'Aegis trusted connection is not configured'},{status:503});
  try{
    const r=await fetch(`${AEGIS_URL}/api/aegis/orchestration/run`,{method:'POST',headers:{'x-internal-service-key':INTERNAL_KEY},cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    return NextResponse.json(data,{status:r.status,headers:{'Cache-Control':'no-store'}});
  }catch(error){
    return NextResponse.json({error:'Aegis orchestration unavailable',detail:error?.message||'connection failed'},{status:502});
  }
}
