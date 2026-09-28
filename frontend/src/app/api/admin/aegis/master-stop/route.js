import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
const INTERNAL_KEY=process.env.INTERNAL_SERVICE_KEY||process.env.OWNER_CONTROL_KEY||'';
const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
export async function PUT(request){
 if(!verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{const body=await request.json();const response=await fetch(`${AEGIS_URL}/api/aegis/master-stop`,{method:'PUT',headers:{'Content-Type':'application/json','x-internal-service-key':INTERNAL_KEY},body:JSON.stringify(body),cache:'no-store'});const data=await response.json().catch(()=>({detail:'Aegis master control unavailable'}));if(!response.ok)return NextResponse.json({error:data.detail||'Aegis master control unavailable'},{status:response.status});return NextResponse.json(data)}catch{return NextResponse.json({error:'Aegis master control unavailable'},{status:502})}
}
