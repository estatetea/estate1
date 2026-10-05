import { NextResponse } from 'next/server';

const INTERNAL_KEY=process.env.INTERNAL_SERVICE_KEY||'';
const ALERT_SECRET=process.env.AEGIS_ALERT_SECRET||'';
const STEWARD_URL=(process.env.STEWARD_URL||'https://estate-tea-steward-git-main-jadenpbenjaminjb-4968s-projects.vercel.app').replace(/\/$/,'');
const LEDGER_URL=(process.env.LEDGER_URL||'https://estate-tea-ledger-git-main-jadenpbenjaminjb-4968s-projects.vercel.app').replace(/\/$/,'');

const ACTIONS={
  ledger_final_payments:{url:()=>`${LEDGER_URL}/api/ledger/handoffs/process-final-payments`},
  steward_receive_brew:{url:()=>`${STEWARD_URL}/api/steward/brew-handoffs/process`},
  steward_receive_ledger:{url:()=>`${STEWARD_URL}/api/steward/ledger-confirmations/process`},
};

export async function POST(request){
  const supplied=request.headers.get('x-aegis-alert-secret')||'';
  if(!ALERT_SECRET||supplied!==ALERT_SECRET) return NextResponse.json({error:'Unauthorized'},{status:401});
  if(!INTERNAL_KEY) return NextResponse.json({error:'Internal agent connection is not configured'},{status:503});
  const body=await request.json().catch(()=>({}));
  const action=String(body?.action||'');
  const target=ACTIONS[action];
  if(!target) return NextResponse.json({error:'Unsupported bridge action'},{status:400});
  try{
    const r=await fetch(target.url(),{method:'POST',headers:{'x-internal-service-key':INTERNAL_KEY},cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    return NextResponse.json({action,upstream_status:r.status,ok:r.ok,result:data},{status:r.ok?200:502,headers:{'Cache-Control':'no-store'}});
  }catch(error){
    return NextResponse.json({action,ok:false,error:'Agent bridge unavailable',detail:error?.message||'connection failed'},{status:502});
  }
}
