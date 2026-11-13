'use client';
import { useEffect, useRef, useState } from 'react';
import { Crown, X, Send, Loader2 } from 'lucide-react';

const STARTERS = ["How's the team doing today?", "Today's sales and orders", 'Anything waiting for my OK?', 'What is Brew working on?'];

// Aegis on the website, only for the boss (signed in with his own WhatsApp number). The same Aegis as in the web app:
// the same memory and history, and he can check on any agent or hand work to them.
export default function BossAegis() {
  const [open, setOpen] = useState(false), [msgs, setMsgs] = useState(null), [text, setText] = useState(''), [busy, setBusy] = useState(false);
  const end = useRef(null), input = useRef(null);
  useEffect(() => {
    if (!open || msgs) return;
    fetch('/api/boss/aegis', { cache: 'no-store' }).then(r => r.json()).then(b => setMsgs(b.messages || [])).catch(() => setMsgs([]));
  }, [open, msgs]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy, open]);
  // "Ask Aegis" on the boss's welcome opens this chat.
  useEffect(() => { const o = () => setOpen(true); window.addEventListener('estate:open-aegis', o); return () => window.removeEventListener('estate:open-aegis', o); }, []);
  const send = async q => {
    const message = String(q ?? text).trim();
    if (!message || busy) return;
    setText(''); setBusy(true);
    setMsgs(m => [...(m || []), { role: 'you', text: message }]);
    try {
      const r = await fetch('/api/boss/aegis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      const b = await r.json().catch(() => ({}));
      setMsgs(m => [...m, r.ok ? { role: 'aegis', text: b.answer || '…' } : { role: 'aegis', text: b.error || 'I could not answer just now, Sir. Please try again.', error: true }]);
    } catch { setMsgs(m => [...m, { role: 'aegis', text: 'I could not be reached just now, Sir. Please try again.', error: true }]); }
    finally { setBusy(false); setTimeout(() => input.current?.focus(), 50); }
  };
  return <div className="fixed bottom-5 right-5 z-[80] font-sans" data-testid="boss-aegis">
    {!open ? <button type="button" aria-label="Talk to Aegis" onClick={() => setOpen(true)}
      className="flex items-center gap-2 rounded-full border border-[#D4AF37]/50 bg-[#14120f] px-4 py-3 text-[#E9CF8A] shadow-xl">
      <Crown size={17} /><span className="text-sm">Ask Aegis</span>
    </button> : <section aria-label="Aegis, your second in command"
      className="flex w-[min(390px,calc(100vw-32px))] h-[min(600px,calc(100dvh-40px))] flex-col rounded-2xl border border-[#D4AF37]/30 bg-[#100f0d] text-gray-200 shadow-2xl">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div><p className="text-sm font-semibold text-[#D4AF37]">Aegis</p><p className="text-[11px] text-gray-500">Your second in command · sees every agent</p></div>
        <button type="button" aria-label="Close Aegis" onClick={() => setOpen(false)} className="p-2 text-gray-400 hover:text-white"><X size={17} /></button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm leading-6">
        <div className="rounded-2xl rounded-tl-sm bg-white/[.04] px-3 py-2 text-gray-200">Welcome back, boss. Ask me about any of the team (Brew, Steward, Ledger, Scout, Muse), today's numbers, or tell me what you need done.</div>
        {msgs === null && <p className="flex items-center gap-2 text-xs text-gray-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading our recent conversation…</p>}
        {(msgs || []).map((m, i) => <div key={i} className={m.role === 'you' ? 'flex justify-end' : ''}>
          <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${m.role === 'you' ? 'rounded-tr-sm bg-[#D4AF37] text-black' : `rounded-tl-sm bg-white/[.04] ${m.error ? 'text-amber-300' : 'text-gray-200'}`}`}>{m.text}</div>
        </div>)}
        {busy && <p className="flex items-center gap-2 text-xs text-gray-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Aegis is checking…</p>}
        {msgs && !msgs.length && !busy && <div className="flex flex-wrap gap-2 pt-1">
          {STARTERS.map(s => <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-[#D4AF37]/25 px-3 py-1.5 text-xs text-[#e6d4a2] hover:bg-[#D4AF37]/[.06]">{s}</button>)}
        </div>}
        <div ref={end} />
      </div>
      <form className="flex items-end gap-2 border-t border-white/10 p-3" onSubmit={e => { e.preventDefault(); send(); }}>
        <textarea ref={input} value={text} onChange={e => setText(e.target.value)} rows={1} placeholder="Message Aegis…" aria-label="Message Aegis"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/50" />
        <button type="submit" disabled={busy || !text.trim()} aria-label="Send" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37] text-black disabled:opacity-40"><Send size={16} /></button>
      </form>
    </section>}
  </div>;
}
