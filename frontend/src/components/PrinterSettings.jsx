import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Automatic bill printing: when an order is marked Being packaged, the bill is emailed to the printer.
export function PrinterSettings({ headers }) {
  const auth = headers?.Authorization;
  const h = { 'Content-Type': 'application/json', Authorization: auth };
  const [cfg, setCfg] = useState(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch('/api/admin/print-settings', { headers: h, cache: 'no-store' }).then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setCfg(d); setEmail(d.printer_email || ''); } }).catch(() => {});
  }, [auth]);
  const save = async enabled => {
    setBusy(true);
    const r = await fetch('/api/admin/print-settings', { method: 'PUT', headers: h, body: JSON.stringify({ enabled, printer_email: email }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return toast.error(d.error || 'Could not save');
    setCfg(d);
    toast.success(enabled ? 'Automatic bill printing is on' : 'Automatic bill printing is off');
  };
  const on = cfg?.enabled;
  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <h2 className="text-xl text-[#efbd63]">Automatic bill printing</h2>
    <p className="mt-1 text-xs text-gray-500">When you mark an order <span className="text-gray-300">Being packaged</span>, the bill is emailed to your printer's own email address and prints at home by itself. Find the address in your printer's app (HP Smart → ePrint, Epson Connect → Email Print).</p>
    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Printer email, e.g. yourprinter@hpeprint.com" className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#d7a84b]/40" />
    <div className="mt-3 flex items-center gap-3">
      <button onClick={() => save(!on)} disabled={busy || !cfg} role="switch" aria-checked={Boolean(on)} className="flex items-center gap-3 text-sm text-gray-300 disabled:opacity-50">
        <span className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-[#efbd63]' : 'bg-white/15'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-black transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} /></span>{on ? 'On' : 'Off'}
      </button>
      {on && email !== (cfg?.printer_email || '') && <button onClick={() => save(true)} disabled={busy} className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-[#efbd63]">Save new address</button>}
    </div>
    <p className="mt-3 text-[11px] text-gray-600">Some printers only accept email from approved senders. If nothing prints, add brew@estatetea.in to the printer's allowed senders. The Print bill button still works for reprints.</p>
  </div>;
}
