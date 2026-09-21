import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
export async function GET(request){
 if(!verifyAdmin(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 const r=await fetch(`${AEGIS_URL}/api/aegis/reports/daily`,{cache:'no-store'});
 const data=await r.json().catch(()=>[]);
 return NextResponse.json(data,{status:r.status,headers:{'Cache-Control':'no-store'}});
}
