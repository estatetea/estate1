import { NextResponse } from 'next/server';
const INTERNAL_KEY=process.env.AEGIS_ALERT_SECRET?.trim()||process.env.OWNER_CONTROL_KEY?.trim()||process.env.INTERNAL_SERVICE_KEY?.trim()||'';
const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
export async function GET(request){
 const secret=process.env.CRON_SECRET;
 if(secret && request.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!INTERNAL_KEY)return NextResponse.json({error:'Aegis trusted connection is not configured'},{status:503});
 try{
  const r=await fetch(`${AEGIS_URL}/api/aegis/reports/daily?report_kind=end_of_day`,{method:'POST',headers:{'x-internal-service-key':INTERNAL_KEY},cache:'no-store'});
  const data=await r.json().catch(()=>({}));
  return NextResponse.json(data,{status:r.status,headers:{'Cache-Control':'no-store'}});
 }catch(error){return NextResponse.json({error:'Aegis report trigger unavailable',detail:error?.message||'connection failed'},{status:502});}
}
