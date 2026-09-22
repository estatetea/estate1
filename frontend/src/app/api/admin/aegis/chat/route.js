import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
export async function POST(request){
 if(!verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const body=await request.json();
  const message=String(body?.message||'').trim();
  if(!message)return NextResponse.json({error:'Message is required'},{status:400});
  const actionableEmail=/\b(?:email|send|write|message|reply|respond|contact)\b/i.test(message)&&/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(message);
  const endpoint=actionableEmail?`${AEGIS_URL}/api/aegis/commands`:`${AEGIS_URL}/api/aegis/chat`;
  const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message}),cache:'no-store'});
  const raw=await r.text();
  let data;try{data=raw?JSON.parse(raw):{}}catch{data={error:r.ok?'Aegis returned an unreadable response':`Aegis request failed (${r.status})`,detail:raw?.slice(0,500)}}
  if(actionableEmail&&r.ok){const result=data?.result||data;const approval=result?.draft?.approval||result?.draft?.draft?.approval;const suffix=approval?` Approval ${approval._id||''} is waiting for you.`:'';const response=(result?.message||'Brew prepared the owner-directed email.')+suffix;return NextResponse.json({...data,response,reply:response},{status:r.status});}
  if(!r.ok)return NextResponse.json({error:data?.detail||data?.error||`Aegis request failed (${r.status})`},{status:r.status});
  return NextResponse.json(data,{status:r.status});
 }catch{return NextResponse.json({error:'Aegis unavailable'},{status:502})}
}
