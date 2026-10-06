import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const INTERNAL_KEY=process.env.AEGIS_ALERT_SECRET?.trim() || process.env.OWNER_CONTROL_KEY?.trim() || process.env.INTERNAL_SERVICE_KEY?.trim() || '';
const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
export async function POST(request){
 if(!verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const body=await request.json();
  const message=String(body?.message||'').trim();
  const attachment_ids=Array.isArray(body?.attachment_ids)?body.attachment_ids.filter(Boolean).slice(0,10):[];
  // One entry point: Aegis chat records context and delegates actions with attachments itself.\n  const endpoint=`${AEGIS_URL}/api/aegis/chat`;\n  const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-internal-service-key':INTERNAL_KEY},body:JSON.stringify({message,attachment_ids}),cache:'no-store'});
  const raw=await r.text();
  let data;try{data=raw?JSON.parse(raw):{}}catch{data={error:r.ok?'Aegis returned an unreadable response':`Aegis request failed (${r.status})`,detail:raw?.slice(0,500)}}
  if(!r.ok)return NextResponse.json({error:data?.detail||data?.error||`Aegis request failed (${r.status})`},{status:r.status});
  return NextResponse.json(data,{status:r.status});
 }catch{return NextResponse.json({error:'Aegis unavailable'},{status:502})}
}
