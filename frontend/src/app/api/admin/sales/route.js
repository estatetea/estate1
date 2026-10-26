import { NextResponse, after } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { STEWARD_URL } from '@/lib/steward';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || process.env.OWNER_CONTROL_KEY || process.env.STEWARD_OWNER_CONTROL_KEY || '';
const n = v => Number(v || 0);
// Totals cover every order; only the most recent rows are sent, to keep mobile data low.
const LIST_LIMIT = 150;
const PAID = new Set(['PAID', 'FULFILLED', 'DELIVERED', 'PAYMENT_VERIFIED']);

// Steward owns every real order: website checkouts (source "website") and agent/B2B sales
// that Brew hands over (source "ai_sales"). The local `orders` collection only holds old
// add-to-cart records, so it is deliberately not counted as sales.
export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!INTERNAL_KEY) return NextResponse.json({ error: 'Steward connection is not configured' }, { status: 503 });
  try {
    const headers = { 'x-internal-service-key': INTERNAL_KEY };
    const [r, rulesRes] = await Promise.all([
      fetch(`${STEWARD_URL}/api/steward/orders?limit=1000`, { headers, cache: 'no-store' }),
      fetch(`${STEWARD_URL}/api/steward/sales-rules`, { headers, cache: 'no-store' }).catch(() => null),
    ]);
    const rows = await r.json().catch(() => null);
    // Owner rules set through Aegis, e.g. "count my manual invoices as agent sales".
    const rules = rulesRes?.ok ? await rulesRes.json().catch(() => ({})) : {};
    if (!r.ok || !Array.isArray(rows)) return NextResponse.json({ error: 'Could not load sales from Steward' }, { status: 502 });
    // Paid orders whose confirmation email hasn't gone out get retried after this response.
    if (rows.some(o => o.payment_verified && o.confirmation_email?.status !== 'sent')) {
      after(() => fetch(`${STEWARD_URL}/api/steward/confirmations/process`, { method: 'POST', headers: { 'x-internal-service-key': INTERNAL_KEY }, cache: 'no-store' }).catch(() => {}));
    }
    const website = [], ai = [], manual = [];
    for (const o of rows) {
      if (String(o.source || '').toLowerCase() === 'owner_test') continue; // ₹1 live payment tests are not sales
      const source = String(o.source || '').toLowerCase();
      const channel = source === 'website' ? 'website' : source === 'manual' && !rules.manual_as_agent_sales ? 'manual' : 'ai_sales';
      const paid = Boolean(o.payment_verified) || PAID.has(String(o.payment_status || '').toUpperCase()) || PAID.has(String(o.status || '').toUpperCase());
      const row = {
        order_id: o.order_id,
        display_order_number: o.display_order_number || o.estate_order_number || o.order_id,
        sales_channel: channel,
        manual_invoice: source === 'manual',
        customer: o.business_name || o.customer_name || o.contact_name || null,
        email: o.email || null,
        quantity_kg: n(o.quantity_kg),
        total_amount: n(o.total_amount),
        status: o.status || null,
        payment_verified: paid,
        delivery_status: o.delivery_status || null,
        created_at: o.created_at || null,
        confirmation_email: o.confirmation_email?.status || null,
      };
      (channel === 'website' ? website : channel === 'manual' ? manual : ai).push(row);
    }
    const summarize = list => {
      const paid = list.filter(x => x.payment_verified);
      const round = v => Math.round(v * 100) / 100;
      return {
        orders: list.length,
        paid_orders: paid.length,
        revenue: round(paid.reduce((sum, x) => sum + x.total_amount, 0)),
        booked_value: round(list.reduce((sum, x) => sum + x.total_amount, 0)),
        items_or_kg: round(list.reduce((sum, x) => sum + x.quantity_kg, 0)),
      };
    };
    return NextResponse.json(
      { website: { summary: summarize(website), orders: website.slice(0, LIST_LIMIT) }, ai_sales: { summary: summarize(ai), orders: ai.slice(0, LIST_LIMIT) }, manual: { summary: summarize(manual), orders: manual.slice(0, LIST_LIMIT) }, all: summarize([...website, ...ai, ...manual]), rules: { manual_as_agent_sales: Boolean(rules.manual_as_agent_sales) }, generated_at: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Could not reach Steward' }, { status: 502 });
  }
}
