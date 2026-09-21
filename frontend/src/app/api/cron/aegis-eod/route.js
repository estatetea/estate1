import { NextResponse } from 'next/server';
const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
export async function GET(request){
 const secret=process.env.CRON_SECRET;
 if(secret && request.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Unauthorized'},{status:401});
 const r=await fetch(`${AEGIS_URL}/api/aegis/reports/daily?report_kind=end_of_day`,{method:'POST',cache:'no-store'});
 const data=await r.json().catch(()=>({}));
 return NextResponse.json(data,{status:r.status});
}
