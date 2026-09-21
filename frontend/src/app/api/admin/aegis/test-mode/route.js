import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');

export async function GET(request){
 if(!verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const response=await fetch(`${AEGIS_URL}/api/aegis/test-mode`,{cache:'no-store'});
  const data=await response.json().catch(()=>({detail:'Aegis test mode unavailable'}));
  return NextResponse.json(response.ok?data:{error:data.detail||'Aegis test mode unavailable'},{status:response.status});
 }catch{return NextResponse.json({error:'Aegis test mode unavailable'},{status:502})}
}

export async function PUT(request){
 if(!verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const body=await request.json();
  const response=await fetch(`${AEGIS_URL}/api/aegis/test-mode`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({owner_key:String(body.owner_key||'')}),cache:'no-store'});
  const data=await response.json().catch(()=>({detail:'Aegis test mode unavailable'}));
  return NextResponse.json(response.ok?data:{error:data.detail||'Aegis test mode unavailable'},{status:response.status});
 }catch{return NextResponse.json({error:'Aegis test mode unavailable'},{status:502})}
}

export async function DELETE(request){
 if(!verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const body=await request.json();
  const response=await fetch(`${AEGIS_URL}/api/aegis/test-mode`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({owner_key:String(body.owner_key||'')}),cache:'no-store'});
  const data=await response.json().catch(()=>({detail:'Aegis test mode unavailable'}));
  return NextResponse.json(response.ok?data:{error:data.detail||'Aegis test mode unavailable'},{status:response.status});
 }catch{return NextResponse.json({error:'Aegis test mode unavailable'},{status:502})}
}
