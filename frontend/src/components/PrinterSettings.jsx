import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Bill printing: when an order is marked Ready for dispatch, the Windows laptop's print helper prints the
// bill on the Brother within a minute. Nothing opens on the phone or the laptop screen.
const ago = iso => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 48 ? `${hrs} h ago` : `${Math.round(hrs / 24)} days ago`;
};

export function PrinterSettings({ headers }) {
  const auth = headers?.Authorization;
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const load = () => fetch('/api/admin/print-helper/status', { headers: { Authorization: auth }, cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).then(setStatus).catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [auth]);
  const download = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/admin/print-helper/setup', { headers: { Authorization: auth }, cache: 'no-store' });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Could not download the setup'); }
      const url = URL.createObjectURL(await r.blob());
      const a = Object.assign(document.createElement('a'), { href: url, download: 'EstateTeaPrintSetup.cmd' });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success('Downloaded. Open it from your Downloads folder on the laptop.');
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const seen = status?.last_seen;
  const live = seen && Date.now() - new Date(seen).getTime() < 5 * 60000;
  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <h2 className="text-xl text-[#efbd63]">Bill printing</h2>
    <p className="mt-1 text-xs text-gray-500">When you mark an order <span className="text-gray-300">Ready for dispatch</span> (from your phone or here), the bill prints on the Brother within a minute through your Windows laptop. Nothing opens on screen.</p>
    <div className="mt-4 flex items-center gap-2 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${live ? 'bg-emerald-400' : seen ? 'bg-amber-400' : 'bg-white/20'}`} />
      <span className="text-gray-300">{live ? `Laptop printing is on · checked in ${ago(seen)}` : seen ? `Laptop last checked in ${ago(seen)}. Is it on and awake?` : 'Laptop printing is not set up yet'}</span>
    </div>
    <button onClick={download} disabled={busy} className="mt-4 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] px-4 py-2.5 text-sm text-[#f1dc9c] disabled:opacity-50">{busy ? 'Preparing…' : 'Download laptop setup (Windows)'}</button>
    <ol className="mt-3 list-decimal space-y-1 pl-5 text-[11px] leading-5 text-gray-500">
      <li>Do this on the laptop. Make sure the Brother is added in Windows Settings › Bluetooth &amp; devices › Printers.</li>
      <li>Open <span className="text-gray-300">EstateTeaPrintSetup.cmd</span> from Downloads. If Windows says it protected your PC, choose More info › Run anyway.</li>
      <li>It sets itself up and starts with the laptop from then on. Keep the laptop on and awake while you pack orders.</li>
    </ol>
    <p className="mt-3 text-[11px] text-gray-600">Reprint any time with Print bill on an order that's Ready for dispatch or later.</p>
  </div>;
}
