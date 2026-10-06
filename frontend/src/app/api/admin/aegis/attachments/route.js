import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
const INTERNAL_KEY=process.env.AEGIS_ALERT_SECRET?.trim()||process.env.OWNER_CONTROL_KEY?.trim()||process.env.INTERNAL_SERVICE_KEY?.trim()||'';
const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
export async function POST(request){
 if(!verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const form=await request.formData();
  const r=await fetch(`${AEGIS_URL}/api/aegis/attachments`,{method:'POST',headers:{'x-internal-service-key':INTERNAL_KEY},body:form,cache:'no-store'});
  const data=await r.json().catch(()=>({detail:'Attachment upload failed'}));
  return NextResponse.json(r.ok?data:{error:data.detail||'Attachment upload failed'},{status:r.status});
 }catch{return NextResponse.json({error:'Attachment upload failed'},{status:502})}
}
