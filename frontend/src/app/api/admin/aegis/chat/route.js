import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
export async function POST(request){
 if(!verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const body=await request.json();
  const message=String(body?.message||'').trim();
  if(!message)return NextResponse.json({error:'Message is required'},{status:400});
  const actionableEmail=/\b(?:email|send|write|message|reply|respond|contact)\b/i.test(message)&&/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(message);\n  const endpoint=actionableEmail?`${AEGIS_URL}/api/aegis/commands`:`${AEGIS_URL}/api/aegis/chat`;\n  const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message}),cache:'no-store'});
  const data=await r.json().catch(()=>({error:'Invalid Aegis response'}));
  return NextResponse.json(data,{status:r.status});
 }catch{return NextResponse.json({error:'Aegis unavailable'},{status:502})}
}
