import { useEffect, useState } from 'react';

// Shows which reasoning models Aegis is thinking with, so a missing key is obvious.
export function AegisBrainStatus({ headers }) {
  const [status, setStatus] = useState(null);
  const auth = headers?.Authorization;
  useEffect(() => {
    let alive = true;
    fetch('/api/admin/aegis/brain', { headers: { Authorization: auth }, cache: 'no-store' })
      .then(r => r.json().catch(() => ({ error: 'Could not read Aegis status' })))
      .then(body => { if (alive) setStatus(body); })
      .catch(() => { if (alive) setStatus({ error: 'Aegis unavailable' }); });
    return () => { alive = false; };
  }, [auth]);

  const row = (name, on, note) => <div className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-300">{name}</span>
    <span className={`text-xs ${on ? 'text-emerald-400' : 'text-red-400'}`}>{on ? `Connected${note ? ' · ' + note : ''}` : 'Not connected (API key missing on Aegis)'}</span>
  </div>;
  const usage = status?.groq_daily_usage;
  return <div className="rounded-[28px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-5 sm:p-6">
    <h2 className="text-xl text-[#efbd63]">Aegis's brain</h2>
    <p className="text-xs text-gray-500 mt-1">Aegis thinks with Groq first and falls back to Gemini. Each reply in the chat is labelled with the model that answered.</p>
    {!status ? <p className="mt-4 text-sm text-gray-500">Checking…</p> : status.error ? <p className="mt-4 text-sm text-red-400">{status.error}</p> : <div className="mt-3 divide-y divide-white/[.06]">
      {row('Groq', status.groq_configured, status.brain_provider === 'groq' ? `main brain · ${status.model}` : '')}
      {row('Gemini', status.gemini_configured, status.brain_provider === 'gemini' ? `main brain · ${status.model}` : 'fallback')}
      {usage && status.groq_configured && <p className="pt-2 text-[11px] text-gray-500">Groq today: {Number(usage.billable_tokens || 0).toLocaleString('en-IN')} of {Number(usage.hard_stop_tokens || 0).toLocaleString('en-IN')} tokens{usage.conservation_active ? ' · daily limit reached, Gemini is answering' : ''}</p>}
    </div>}
  </div>;
}
