import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const INTERNAL_KEY=process.env.AEGIS_ALERT_SECRET?.trim() || process.env.OWNER_CONTROL_KEY?.trim() || process.env.INTERNAL_SERVICE_KEY?.trim() || '';
const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
export const dynamic='force-dynamic';
export async function GET(request){
 if(!verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 const q=new URL(request.url).searchParams.get('q')||'';
 try{
  const r=await fetch(`${AEGIS_URL}/api/aegis/whatsapp-chats?q=${encodeURIComponent(q)}`,{headers:{'x-internal-service-key':INTERNAL_KEY},cache:'no-store'});
  const payload=await r.json().catch(()=>({}));
  if(!r.ok)return NextResponse.json({error:payload.detail||payload.error||'WhatsApp chats unavailable'},{status:502});
  return NextResponse.json(payload,{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'WhatsApp chats unavailable'},{status:502})}
}
