import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Brew's replies per channel wait for your approval or go out by themselves; "WhatsApp orders" decides whether a
// standard home order stops for your Go ahead.
const CHANNELS = [
  ['whatsapp', 'WhatsApp replies', 'Wait for my approval', 'Brew sends them himself'],
  ['whatsapp_orders', 'WhatsApp orders', 'Brew stops and asks me to Go ahead', 'Brew goes ahead with standard home orders himself'],
  ['email', 'Email replies', 'Wait for my approval', 'Brew sends them himself'],
];
const LABEL = { whatsapp: 'WhatsApp replies', whatsapp_orders: 'WhatsApp orders', email: 'Email replies' };

export function ApprovalSettings({ headers, only, compact = false }) {
  const auth = headers?.Authorization;
  const [mode, setMode] = useState(null);
  const [busy, setBusy] = useState('');
  useEffect(() => {
    fetch('/api/admin/brew-approval-mode', { headers: { Authorization: auth }, cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).then(setMode).catch(() => {});
  }, [auth]);
  const flip = async channel => {
    const next = mode?.[channel] === 'auto' ? 'approval' : 'auto';
    setBusy(channel);
    try {
      const r = await fetch('/api/admin/brew-approval-mode', { method: 'PUT', headers: { Authorization: auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ channel, mode: next }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Could not change the setting');
      setMode(data);
      toast.success(next === 'auto' ? `${LABEL[channel]}: approval off` : `${LABEL[channel]}: approval on`);
    } catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };
  const rows = CHANNELS.filter(([channel]) => !only || channel.startsWith(only));
  const switches = <div className={`${compact ? '' : 'mt-4 '}divide-y divide-white/[.06]`}>
      {rows.map(([channel, label, onText, offText]) => {
        const on = mode?.[channel] !== 'auto';
        return <div key={channel} className="flex items-center justify-between gap-3 py-3">
          <div><p className="text-sm text-white">{label}</p><p className="text-[11px] text-gray-500">{mode ? (on ? onText : offText) : 'Loading…'}</p></div>
          <button onClick={() => flip(channel)} disabled={!mode || busy === channel} role="switch" aria-checked={on} aria-label={`${label}: approval ${on ? 'on' : 'off'}`} className="flex items-center gap-2 text-xs text-gray-300 disabled:opacity-50">
            <span className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-[#efbd63]' : 'bg-white/15'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-black transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} /></span>
            {on ? 'Approval on' : 'Approval off'}
          </button>
        </div>;
      })}
    </div>;
  if (compact) return switches;
  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <h2 className="text-xl text-[#efbd63]">Approvals</h2>
    <p className="text-xs text-gray-500 mt-1">Choose what waits for you. With reply approval off, Brew replies to customers himself; with order approval off, he goes ahead with standard home orders. Businesses, custom prices, low stock, complaints, refunds and cancellations, and any reply he isn't sure about still come to you.</p>
    {switches}
  </div>;
}
