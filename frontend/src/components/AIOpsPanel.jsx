import { useEffect, useState } from 'react';
import { Bot, Send, RefreshCw, AlertTriangle, CheckCircle2, Clock3, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function AIOpsPanel({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/aegis/dashboard', { headers, cache: 'no-store' });
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch { toast.error('Could not reach Aegis'); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [token]);

  const send = async () => {
    const text = message.trim();
    if (!text) return;
    setSending(true);
    try {
      const r = await fetch('/api/admin/aegis/commands', { method: 'POST', headers, body: JSON.stringify({ message: text }) });
      const body = await r.json();
      if (!r.ok) throw new Error(body.detail || body.error || 'Command failed');
      setLastCommand(body);
      setMessage('');
      toast.success('Aegis received your instruction');
      refresh();
    } catch (e) { toast.error(e.message || 'Aegis command failed'); }
    finally { setSending(false); }
  };

  if (loading && !data) return <div className="py-12 text-center text-sm text-gray-500">Connecting to Aegis…</div>;
  const snap = data?.snapshot || {};
  const attention = snap.attention || {};
  const agents = snap.agents || [];
  const inv = snap.inventory || {};

  return (
    <div className="space-y-5" data-testid="admin-ai-ops-section">
      <div className="flex items-center justify-between">
        <div><h2 className="text-sm uppercase tracking-wider text-gray-400">Estate Tea AI Operations</h2><p className="text-xs text-gray-600 mt-1">Aegis is your command layer across the agent team.</p></div>
        <button onClick={refresh} disabled={loading} className="p-2 text-gray-500 hover:text-[#D4AF37] transition-colors"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>

      <div className="card-surface rounded-xl p-4 border border-[#D4AF37]/20">
        <div className="flex items-center gap-2 mb-3"><Bot className="w-5 h-5 text-[#D4AF37]"/><p className="text-sm font-medium text-white">Talk to Aegis</p></div>
        <div className="flex gap-2">
          <textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="e.g. Get me the latest invoice for Acme Cafe, or ask Scout to research cafés in Hennur…" className="flex-1 min-h-[82px] resize-none bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none" />
          <button onClick={send} disabled={sending || !message.trim()} className="self-end bg-[#D4AF37] disabled:bg-gray-700 text-black rounded-xl p-3"><Send className="w-4 h-4"/></button>
        </div>
        {lastCommand && <div className="mt-3 rounded-lg bg-white/[0.03] border border-white/5 p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs gold-text">{lastCommand.command_id}</span><span className="text-[10px] uppercase tracking-wider text-gray-500">{lastCommand.status}</span></div><p className="text-sm text-gray-300 mt-1">{lastCommand.result?.message || lastCommand.result?.instruction || 'Command recorded.'}</p>{lastCommand.result?.matches?.length > 0 && <div className="mt-2 space-y-1">{lastCommand.result.matches.map((m,i)=><p key={i} className="text-xs text-gray-500">{m.business_name} · {m.invoice_id} · {m.order_id} · ₹{m.amount}</p>)}</div>}</div>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric label="Open incidents" value={attention.open_incidents || 0} icon={AlertTriangle}/>
        <Metric label="Pending handoffs" value={attention.pending_handoffs || 0} icon={Clock3}/>
        <Metric label="Paid orders" value={snap.orders?.paid || 0} icon={CheckCircle2}/>
        <Metric label="Restock requests" value={snap.pending_restock_requests || 0} icon={PackageOpen}/>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {agents.map(a => <div key={a.agent} className="card-surface rounded-xl p-4 border border-white/5"><div className="flex items-center justify-between"><p className="text-sm text-white">{a.agent}</p><span className={`w-2 h-2 rounded-full ${a.enabled && ['online','active','running'].includes(String(a.status).toLowerCase()) ? 'bg-green-400' : 'bg-gray-600'}`}/></div><p className="text-xs text-gray-500 mt-1">{a.agent === 'Muse' ? 'Standby' : a.status || 'Unknown'} · {a.enabled ? 'enabled' : 'paused'}</p></div>)}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card-surface rounded-xl p-4 border border-white/5"><p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Attention</p>{(data?.incidents || []).filter(x => !['resolved','closed'].includes(x.status)).slice(0,5).map((x,i)=><div key={x.incident_id || i} className="py-2 border-b border-white/5 last:border-0"><p className="text-sm text-gray-300">{x.summary}</p><p className="text-[10px] text-gray-600 mt-1">{x.severity || 'info'} · {x.status}</p></div>)}{!(data?.incidents || []).some(x => !['resolved','closed'].includes(x.status)) && <p className="text-sm text-gray-600">Nothing requiring attention.</p>}</div>
        <div className="card-surface rounded-xl p-4 border border-white/5"><p className="text-xs uppercase tracking-wider text-gray-500 mb-3">Inventory</p><p className="text-2xl gold-text">{inv.sellable_kg ?? inv.physical_kg ?? '—'} kg</p><p className="text-xs text-gray-500 mt-1">Sellable stock · protected reserve {inv.protected_reserve_kg ?? 2} kg</p><p className="text-xs mt-3 text-gray-500">Integrity: <span className={inv.integrity_ok === false ? 'text-red-400' : 'text-green-400'}>{inv.integrity_ok === false ? 'Needs attention' : 'OK'}</span></p></div>
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon }) {
  return <div className="card-surface rounded-xl p-4 border border-white/5"><Icon className="w-4 h-4 text-[#D4AF37] mb-3"/><p className="text-2xl text-white font-light">{value}</p><p className="text-[11px] text-gray-500 mt-1">{label}</p></div>;
}
