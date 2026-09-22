import { NextResponse } from 'next/server';
const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
export async function GET(request){
 const secret=process.env.CRON_SECRET;
 if(secret && request.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Unauthorized'},{status:401});
 const r=await fetch(`${AEGIS_URL}/api/aegis/reports/daily?report_kind=ongoing`,{method:'POST',cache:'no-store'});
 const data=await r.json().catch(()=>({}));
 let notification={sent:0};
 if(r.ok&&data?.report_id&&process.env.AEGIS_ALERT_SECRET){
   try{
     const origin=new URL(request.url).origin;
     const push=await fetch(`${origin}/api/admin/aegis/notifications/send`,{method:'POST',headers:{'Content-Type':'application/json','x-aegis-alert-secret':process.env.AEGIS_ALERT_SECRET},body:JSON.stringify({severity:'info',title:'Aegis — Noon report ready',body:'Your Estate Tea noon operational report is ready to review.',tag:`aegis-report-${data.report_id}`,url:'/ai?section=reports'})});
     notification=await push.json().catch(()=>({sent:0}));
   }catch{notification={sent:0,error:'notification_failed'}}
 }
 return NextResponse.json({...data,notification},{status:r.status});
}
