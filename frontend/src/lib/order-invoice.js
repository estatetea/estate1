// A printable Estate Tea invoice for any order (website, WhatsApp or manual), built from Steward's order record.
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = v => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const SOURCE_LABELS = { website: 'Website', manual: 'Manual invoice', owner_test: 'Test invoice', brew: 'WhatsApp (Brew)', whatsapp: 'WhatsApp (Brew)' };

export function orderLines(o) {
  const items = (o.items || []).map(i => ({ label: `Estate Tea black CTC tea powder, ${i.weight || i.product_id}`, qty: i.quantity, unit: i.unit_price, total: i.line_total ?? (i.unit_price || 0) * (i.quantity || 0) }));
  const goods = items.reduce((s, i) => s + Number(i.total || 0), 0);
  const fee = Number(o.delivery_fee || 0);
  const method = o.delivery_method === 'own_delivery' ? 'Estate Tea delivery' : o.delivery_method === 'third_party_courier' ? 'Third-party delivery service' : null;
  return { items, goods, fee, method, gst: Number(o.gst_amount || 0), total: Number(o.total_amount || goods + fee + Number(o.gst_amount || 0)) };
}

export function openInvoice(o) {
  const { items, goods, fee, method, gst, total } = orderLines(o);
  const number = o.estate_order_number || o.display_order_number || o.order_id;
  const date = o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const paid = o.payment_verified || ['PAID', 'paid', 'VERIFIED'].includes(o.payment_status);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(number)}</title><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:-apple-system,Segoe UI,Inter,sans-serif;color:#1a1714;max-width:760px;margin:32px auto;padding:0 20px}h1{font-size:22px;margin:0}
.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #b8913a;padding-bottom:16px}.muted{color:#6b6359;font-size:13px;line-height:1.5}
table{width:100%;border-collapse:collapse;margin-top:24px;font-size:14px}th,td{padding:10px 8px;border-bottom:1px solid #e6dfd3;text-align:left}th{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b6359}
td.r,th.r{text-align:right}.tot td{border:0;padding:6px 8px}.grand td{font-weight:700;font-size:16px;border-top:2px solid #1a1714}.badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600;background:${paid ? '#e3f4e7;color:#1d6b35' : '#fdf0d8;color:#8a5a00'}}
.btn{margin-top:28px;padding:10px 18px;border:1px solid #1a1714;background:#fff;border-radius:8px;cursor:pointer}@media print{.btn{display:none}body{margin:0}}</style></head><body>
<div class="top"><div><h1>Estate Tea</h1><div class="muted">Bangalore, 560077<br>estatetea.in · brew@estatetea.in</div></div>
<div style="text-align:right"><div style="font-size:18px;font-weight:700">Tax invoice</div><div class="muted">${esc(number)}<br>${esc(date)}</div><div style="margin-top:6px"><span class="badge">${paid ? 'Paid' : 'Awaiting payment'}</span></div></div></div>
<div style="display:flex;gap:40px;margin-top:20px"><div><div class="muted" style="text-transform:uppercase;font-size:11px;letter-spacing:.08em">Billed to</div>
<div style="margin-top:4px">${esc(o.business_name || o.customer_name || '')}${o.business_name && o.customer_name ? `<br>${esc(o.customer_name)}` : ''}${o.gstin ? `<br>GSTIN ${esc(o.gstin)}` : ''}<br>${esc(o.phone || '')}<br>${esc(o.email || '')}</div></div>
<div><div class="muted" style="text-transform:uppercase;font-size:11px;letter-spacing:.08em">Deliver to</div><div style="margin-top:4px">${esc(o.delivery_address || '')}${o.delivery_pincode ? ` ${esc(o.delivery_pincode)}` : ''}${method ? `<br><span class="muted">${esc(method)}</span>` : ''}</div></div></div>
<table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>
${items.map(i => `<tr><td>${esc(i.label)}</td><td class="r">${esc(i.qty)}</td><td class="r">${money(i.unit)}</td><td class="r">${money(i.total)}</td></tr>`).join('')}
${fee > 0 ? `<tr><td>Delivery${method ? ` (${esc(method)})` : ''}</td><td class="r">1</td><td class="r">${money(fee)}</td><td class="r">${money(fee)}</td></tr>` : method ? `<tr><td>Delivery (${esc(method)})</td><td class="r"></td><td class="r"></td><td class="r">Free</td></tr>` : ''}
</tbody></table><table><tbody class="tot"><tr><td class="r" style="width:75%">Subtotal</td><td class="r">${money(goods + fee)}</td></tr>
${gst > 0 ? `<tr><td class="r">CGST (2.5%)</td><td class="r">${money(gst / 2)}</td></tr><tr><td class="r">SGST (2.5%)</td><td class="r">${money(gst / 2)}</td></tr>` : ''}
<tr class="grand"><td class="r">Total</td><td class="r">${money(total)}</td></tr></tbody></table>
${o.invoice_url ? `<p class="muted" style="margin-top:18px">Payment link: ${esc(o.invoice_url)}</p>` : ''}
<button class="btn" onclick="window.print()">Print or save as PDF</button></body></html>`;
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.open(); w.document.write(html); w.document.close();
  return true;
}
