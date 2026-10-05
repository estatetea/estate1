import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const INTERNAL_KEY=process.env.INTERNAL_SERVICE_KEY||process.env.OWNER_CONTROL_KEY||'';
const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
export async function GET(request){
 if(!verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const r=await fetch(`${AEGIS_URL}/api/aegis/mail`,{headers:{'x-internal-service-key':INTERNAL_KEY},cache:'no-store'});
  const payload=await r.json().catch(()=>({}));
  if(!r.ok)return NextResponse.json({error:payload.detail||payload.error||'Mail trail unavailable',upstream_status:r.status},{status:502});
  return NextResponse.json(payload,{headers:{'Cache-Control':'no-store, no-cache, must-revalidate'}});
 }catch{return NextResponse.json({error:'Mail trail unavailable'},{status:502})}
}
