// "Print bills automatically on this device" lives in this browser only (each phone/computer chooses).
export const AUTO_PRINT_KEY = 'estate-auto-print';
export const autoPrintOn = () => { try { return localStorage.getItem(AUTO_PRINT_KEY) === '1'; } catch { return false; } };

// Phones only allow a print window opened inside the tap, so callers can open it first and fill it later.
export const openPrintWindow = () => {
  const w = window.open('', '_blank');
  if (w) w.document.write('<p style="font-family:sans-serif;padding:24px">Preparing the bill…</p>');
  return w;
};

// Loads Ledger's bill into the window; the bill page opens the print screen itself (and prints silently
// on a Windows shortcut started with --kiosk-printing).
export async function printBill(orderId, headers, w = openPrintWindow()) {
  if (!w) throw new Error('Your browser blocked the print window. Allow pop-ups for estatetea.in and try again.');
  try {
    const r = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/bill`, { headers, cache: 'no-store' });
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'The bill is not ready yet'); }
    const html = await r.text();
    w.document.open(); w.document.write(html); w.document.close();
  } catch (e) { w.close(); throw e; }
  // Also hand the bill window a PDF copy for its "Brother app" button (phones without AirPrint).
  try {
    const p = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/bill-pdf`, { headers, cache: 'no-store' });
    if (p.ok && !w.closed) {
      const name = (p.headers.get('content-disposition') || '').match(/filename="([^"]+)"/)?.[1] || `${orderId}.pdf`;
      w.__billPdf = new File([await p.blob()], name, { type: 'application/pdf' });
      w.dispatchEvent(new Event('billpdf'));
    }
  } catch { /* the Print button still works without the PDF */ }
}
