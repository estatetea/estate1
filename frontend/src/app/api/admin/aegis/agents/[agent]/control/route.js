import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');

export async function PUT(request,{params}){
 if(!verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const {agent}=await params;
  const body=await request.json();
  const response=await fetch(`${AEGIS_URL}/api/aegis/agents/${encodeURIComponent(agent)}/control`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
  const data=await response.json().catch(()=>({detail:'Aegis control unavailable'}));
  if(!response.ok)return NextResponse.json({error:data.detail||'Aegis control unavailable'},{status:response.status});
  return NextResponse.json(data);
 }catch{return NextResponse.json({error:'Aegis control unavailable'},{status:502})}
}
