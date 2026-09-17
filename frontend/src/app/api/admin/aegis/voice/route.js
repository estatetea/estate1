import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
export async function POST(request){
 if(!verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const body=await request.json();
  const text=String(body?.text||'').trim();
  if(!text)return NextResponse.json({error:'Text is required'},{status:400});
  const r=await fetch(`${AEGIS_URL}/api/aegis/voice/speak`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text}),cache:'no-store'});
  if(!r.ok){const data=await r.json().catch(()=>({detail:'Aegis voice unavailable'}));return NextResponse.json({error:data.detail||'Aegis voice unavailable'},{status:r.status})}
  const audio=await r.arrayBuffer();
  return new NextResponse(audio,{status:200,headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Aegis voice unavailable'},{status:502})}
}
