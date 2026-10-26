// Opens the window inside the tap (so phones don't block it), then loads Ledger's bill into it.
// The bill page calls the phone's print screen itself (AirPrint on iPhone, Android print service).
export async function printBill(orderId, headers) {
  const w = window.open('', '_blank');
  if (!w) throw new Error('Your browser blocked the print window. Allow pop-ups for estatetea.in and try again.');
  w.document.write('<p style="font-family:sans-serif;padding:24px">Preparing the bill…</p>');
  try {
    const r = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/bill`, { headers, cache: 'no-store' });
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'The bill is not ready yet'); }
    const html = await r.text();
    w.document.open(); w.document.write(html); w.document.close();
  } catch (e) { w.close(); throw e; }
}
