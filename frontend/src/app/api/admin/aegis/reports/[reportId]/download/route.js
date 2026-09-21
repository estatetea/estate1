import { verifyAdmin } from '@/lib/admin-auth';
const AEGIS_URL=(process.env.AEGIS_URL||'https://estate-tea-aegis.onrender.com').replace(/\/$/,'');
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function GET(request){
 // Backward compatibility for an already-open older owner-app tab that still
 // has the former direct download link. Do not expose a report without auth;
 // return the owner to Reports, where the authenticated POST download is used.
 const url=new URL('/ai?section=reports',request.url);
 return Response.redirect(url,303);
}
export async function POST(request,{params}){
 if(!verifyAdmin(request))return new Response('Unauthorized',{status:401});
 const {reportId}=await params;
 const r=await fetch(`${AEGIS_URL}/api/aegis/reports/daily`,{cache:'no-store'});
 const rows=await r.json().catch(()=>[]);
 const report=(Array.isArray(rows)?rows:[]).find(x=>x.report_id===reportId);
 if(!report)return new Response('Report not found',{status:404});
 const b=report.owner_brief||{},summary=report.summary||{},snap=report.snapshot||{};
 const n=b.numbers||{};
 const rawAgents=b.agent_sections?.length?b.agent_sections:(snap.agents||[]).map(a=>({agent:a.agent,focus:a.current_task||a.task,activity_count:a.daily_progress?.activity_count??report.recent_activity_by_agent?.[a.agent]??0,completed_count:a.daily_progress?.completed_count??0,work:a.daily_progress?.recent||a.recent_work||a.recent_activity||[]}));
 const sections=rawAgents;
 const approvals=n.pending_approvals??summary.pending_owner_approvals??report.approvals?.count??snap.approvals?.count??0;
 const issues=n.open_issues??summary.open_incidents??snap.attention?.open_incidents??0;
 const handoffs=n.pending_handoffs??summary.pending_handoffs??snap.attention?.pending_handoffs??0;
 const awaiting=n.awaiting_payment??summary.awaiting_payment??snap.orders?.awaiting_payment??0;
 const total=n.total_agent_activities??sections.reduce((v,a)=>v+Number(a.activity_count||0),0);
 const completed=n.completed_agent_activities??sections.reduce((v,a)=>v+Number(a.completed_count||0),0);
 const cards=[
 ['Activities',total],['Completed',completed],['Approvals',approvals],['Open issues',issues],
 ['Handoffs',handoffs],['Awaiting payment',awaiting],
 ['Samples',n.sample_requests??report.sales_columns?.samples?.count??0],['Orders',n.order_requests??report.sales_columns?.orders?.count??0]
 ];
 const fallbackNeeds=[];if(approvals)fallbackNeeds.push(`${approvals} approval(s) need your decision.`);if(issues)fallbackNeeds.push(`${issues} open issue(s) need attention.`);if(handoffs)fallbackNeeds.push(`${handoffs} handoff(s) are still pending.`);if(awaiting)fallbackNeeds.push(`${awaiting} order(s) await payment.`);
 const needs=b.what_needs_you?.length?b.what_needs_you:(fallbackNeeds.length?fallbackNeeds:['Nothing needs your immediate attention.']);
 const agents=sections.map(a=>`<section class="agent"><div class="agenthead"><h2>${esc(a.agent)}</h2><span>${esc(a.completed_count??0)} completed · ${esc(a.activity_count??0)} activities</span></div><p class="focus"><b>Focus:</b> ${esc(a.focus||'No active task')}</p><ol>${(a.work||[]).slice(0,3).length?(a.work||[]).slice(0,3).map(w=>`<li>${esc(w.summary)}${w.status?` <span class="status">· ${esc(w.status)}</span>`:''}</li>`).join(''):'<li>No recorded work today.</li>'}</ol></section>`).join('');
 const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(b.headline||'Estate Tea Aegis Report')}</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#191919;margin:0;background:#fff}header{border-bottom:3px solid #b88a34;padding-bottom:16px;margin-bottom:18px}.brand{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9a722c}h1{font-size:28px;margin:8px 0 5px}.meta{font-size:11px;color:#777}.summary{font-size:14px;line-height:1.6;background:#f8f5ee;border-left:4px solid #b88a34;padding:14px;margin:16px 0}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:16px 0}.card{border:1px solid #ddd;border-radius:8px;padding:10px}.card small{display:block;color:#777;text-transform:uppercase;font-size:9px}.card strong{font-size:21px;color:#9a722c}.needs{border:1px solid #e5d7b8;border-radius:10px;padding:14px;margin:18px 0}.needs h2,.agent h2{margin:0}.agent{break-inside:avoid;border-top:1px solid #ddd;padding:10px 0}.agenthead{display:flex;justify-content:space-between;align-items:baseline}.agenthead span{font-size:11px;color:#777}.focus{font-size:12px;color:#555}ol{padding-left:22px}li{margin:4px 0;font-size:11px;line-height:1.35}.status{color:#777;font-weight:normal}footer{margin-top:20px;border-top:1px solid #ddd;padding-top:10px;font-size:10px;color:#888}@media print{.no-print{display:none}}</style></head><body><header><div class="brand">Estate Tea · Aegis</div><h1>${esc(b.headline||'End-of-day report')}</h1><div class="meta">Report ${esc(report.report_id)} · ${esc(report.created_at)}</div></header><div class="summary">${esc(b.plain_summary||'Daily operations report.')}</div><div class="grid">${cards.map(([l,v])=>`<div class="card"><small>${esc(l)}</small><strong>${esc(v)}</strong></div>`).join('')}</div><section class="needs"><h2>Aegis assessment</h2><p>${esc(b.aegis_assessment||b.plain_summary||'Daily operations recorded.')}</p><h2>What needs you</h2><ul>${needs.slice(0,4).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><h1>Who did what</h1>${agents||'<p>No agent detail was stored in this older report.</p>'}<section class="needs"><h2>Important developments</h2><ul>${(b.important_developments||[]).slice(0,6).map(x=>`<li><b>${esc(x.agent)}:</b> ${esc(x.summary)}</li>`).join('')||'<li>No additional development needs highlighting.</li>'}</ul><h2>Problems & recovery</h2><ul>${(b.problems_and_recoveries||[]).slice(0,3).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h2>Tomorrow</h2><ul>${(b.tomorrow_priorities||[]).slice(0,4).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><footer>Generated by Aegis for Estate Tea. Use your browser’s Print / Save as PDF option if you want a PDF copy.</footer></body></html>`;
 return new Response(html,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Content-Disposition':`attachment; filename="Estate-Tea-Aegis-${reportId}.html"`,'Cache-Control':'no-store'}});
}
