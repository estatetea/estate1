import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const INTERNAL_KEY=process.env.AEGIS_ALERT_SECRET?.trim() || process.env.OWNER_CONTROL_KEY?.trim() || process.env.INTERNAL_SERVICE_KEY?.trim() || '';
const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
export const dynamic='force-dynamic';
export async function GET(request,{params}){
 if(!verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 const {id}=await params;
 if(!/^[a-f0-9]{24}$/i.test(id||''))return NextResponse.json({error:'Unknown chat'},{status:400});
 try{
  const r=await fetch(`${AEGIS_URL}/api/aegis/whatsapp-chats/${id}`,{headers:{'x-internal-service-key':INTERNAL_KEY},cache:'no-store'});
  const payload=await r.json().catch(()=>({}));
  if(!r.ok)return NextResponse.json({error:payload.detail||payload.error||'Chat unavailable'},{status:r.status===404?404:502});
  return NextResponse.json(payload,{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Chat unavailable'},{status:502})}
}
