import { verifyStaff } from '@/lib/team-auth';
import { reportPdf } from '@/lib/report-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const AEGIS_URL = (process.env.AEGIS_URL || 'https://estate-tea-aegis.onrender.com').replace(/\/$/, '');
const INTERNAL_KEY = process.env.AEGIS_ALERT_SECRET?.trim() || process.env.OWNER_CONTROL_KEY?.trim() || process.env.INTERNAL_SERVICE_KEY?.trim() || '';

// One Aegis report as a real PDF file (the owner app downloads or shares it; phones can't print the HTML version).
export async function POST(request, { params }) {
  if (!(await verifyStaff(request))) return new Response('Unauthorized', { status: 401 });
  const { reportId } = await params;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(reportId)) return new Response('Invalid report ID', { status: 400 });
  if (!INTERNAL_KEY) return new Response('Report service authentication is not configured', { status: 503 });
  let r;
  try {
    r = await fetch(`${AEGIS_URL}/api/aegis/reports/daily/${encodeURIComponent(reportId)}`, { headers: { 'x-internal-service-key': INTERNAL_KEY }, cache: 'no-store' });
  } catch { return new Response('Aegis report service is unavailable', { status: 502 }); }
  if (!r.ok) return new Response(r.status === 404 ? 'Report not found in Aegis' : `Aegis report request failed (${r.status})`, { status: r.status === 404 ? 404 : 502 });
  const report = await r.json().catch(() => null);
  if (!report || typeof report !== 'object' || Array.isArray(report)) return new Response('Invalid report data from Aegis', { status: 502 });
  let pdf;
  try { pdf = reportPdf(report); } catch (e) { return new Response(`The PDF couldn't be made: ${e.message}`.slice(0, 200), { status: 500 }); }
  const day = (report.created_at || '').slice(0, 10) || 'report';
  const kind = report.type === 'weekly_sales' ? 'Sales' : report.type === 'end_of_day' ? 'End-of-day' : 'Daily';
  return new Response(pdf, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="Estate-Tea-${kind}-${day}-${reportId}.pdf"`, 'Cache-Control': 'no-store' } });
}
