import { NextResponse } from 'next/server';
const INTERNAL_KEY=process.env.INTERNAL_SERVICE_KEY||process.env.OWNER_CONTROL_KEY||process.env.AEGIS_ALERT_SECRET||'';
const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
export async function GET(request){
 const secret=process.env.CRON_SECRET;
 if(secret && request.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Unauthorized'},{status:401});
 const r=await fetch(`${AEGIS_URL}/api/aegis/reports/daily?report_kind=ongoing`,{method:'POST',headers:{'x-internal-service-key':INTERNAL_KEY},cache:'no-store'});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)return NextResponse.json({...data,notification:{sent:0,error:'report_generation_failed'}},{status:r.status});
 let notification={sent:0};
 if(r.ok&&data?.report_id&&process.env.AEGIS_ALERT_SECRET){
   try{
     const configuredOrigin=(process.env.PUBLIC_APP_URL||process.env.NEXT_PUBLIC_SITE_URL||'https://estatetea.in').replace(/\/$/,'');
     const push=await fetch(`${configuredOrigin}/api/admin/aegis/notifications/send`,{method:'POST',headers:{'Content-Type':'application/json','x-aegis-alert-secret':process.env.AEGIS_ALERT_SECRET},body:JSON.stringify({severity:'critical',title:'Aegis — Noon report ready',body:'Your Estate Tea noon operational report is ready to review.',tag:`aegis-report-noon-${new Date().toISOString().slice(0,10)}`,url:'/ai?section=reports'})});
     notification=await push.json().catch(()=>({sent:0}));
   }catch{notification={sent:0,error:'notification_failed'}}
 }
 if(!notification?.sent){console.error('AEGIS_REPORT_PUSH_FAILED',{report_id:data?.report_id,notification});return NextResponse.json({...data,notification,error:'report_created_but_realtime_notification_not_confirmed'},{status:503});}
 return NextResponse.json({...data,notification},{status:r.status});
}
