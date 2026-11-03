'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, CheckCheck, RefreshCw, Search } from 'lucide-react';

const TZ = { timeZone: 'Asia/Kolkata' };
const time = d => new Date(d).toLocaleTimeString('en-IN', { ...TZ, hour: 'numeric', minute: '2-digit' });
const dayKey = d => new Date(d).toLocaleDateString('en-CA', TZ);
const dayLabel = d => {
  const k = dayKey(d), today = dayKey(new Date()), y = dayKey(new Date(Date.now() - 864e5));
  if (k === today) return 'Today';
  if (k === y) return 'Yesterday';
  return new Date(d).toLocaleDateString('en-IN', { ...TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};
const listWhen = d => { if (!d) return ''; const k = dayKey(d); return k === dayKey(new Date()) ? time(d) : k === dayKey(new Date(Date.now() - 864e5)) ? 'Yesterday' : new Date(d).toLocaleDateString('en-IN', { ...TZ, day: 'numeric', month: 'short' }); };
const full = d => new Date(d).toLocaleString('en-IN', { ...TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', second: '2-digit' });
const took = s => s == null ? '' : s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.round(s / 360) / 10} h`;
const WHO = { brew: 'Brew', aegis: 'Aegis', owner: 'You' };

function Ticks({ m }) {
  if (!m.status) return null;
  if (m.status === 'failed') return <span className="text-red-400 text-[11px]">Not delivered</span>;
  if (m.status === 'read') return <CheckCheck className="w-4 h-4 text-sky-400" aria-label="Read" />;
  if (m.status === 'delivered') return <CheckCheck className="w-4 h-4 text-gray-500" aria-label="Delivered" />;
  return <Check className="w-4 h-4 text-gray-500" aria-label="Sent" />;
}

export function WhatsAppChats({ headers }) {
  const [chats, setChats] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [q, setQ] = useState(''), [openId, setOpenId] = useState(null), [chat, setChat] = useState(null), [chatLoading, setChatLoading] = useState(false), [info, setInfo] = useState(null);
  const bottom = useRef(null), lastCount = useRef(0);

  const loadList = async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const r = await fetch('/api/admin/aegis/whatsapp-chats', { headers, cache: 'no-store' }), b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'WhatsApp chats unavailable');
      setChats(b.chats || []); setError('');
    } catch (e) { if (!quiet) setError(e.message); } finally { if (!quiet) setLoading(false); }
  };
  const loadChat = async (id, { quiet = false } = {}) => {
    if (!id) return;
    if (!quiet) setChatLoading(true);
    try {
      const r = await fetch(`/api/admin/aegis/whatsapp-chats/${id}`, { headers, cache: 'no-store' }), b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Chat unavailable');
      setChat(c => (c?.relationship_id === id && quiet && (c.messages || []).length === (b.messages || []).length && JSON.stringify(c.messages) === JSON.stringify(b.messages)) ? c : b);
    } catch (e) { if (!quiet) setError(e.message); } finally { if (!quiet) setChatLoading(false); }
  };

  useEffect(() => { loadList(); const t = setInterval(() => loadList({ quiet: true }), 20000); return () => clearInterval(t); }, []);
  useEffect(() => { if (!openId) return; setChat(null); setInfo(null); lastCount.current = 0; loadChat(openId); const t = setInterval(() => loadChat(openId, { quiet: true }), 10000); return () => clearInterval(t); }, [openId]);
  useEffect(() => { const n = chat?.messages?.length || 0; if (n && n !== lastCount.current) { lastCount.current = n; setTimeout(() => bottom.current?.scrollIntoView({ block: 'end' }), 0); } }, [chat]);

  const shown = useMemo(() => { const s = q.trim().toLowerCase(); return s ? chats.filter(c => `${c.name} ${c.phone || ''} ${c.whatsapp_name || ''}`.toLowerCase().includes(s)) : chats; }, [chats, q]);
  const today = dayKey(new Date());
  const todayCount = chats.filter(c => c.last_at && dayKey(c.last_at) === today).length;

  const list = <div className={`${openId ? 'hidden lg:block' : ''} space-y-3`}>
    <div className="rounded-[24px] border border-white/[.07] bg-gradient-to-b from-[#111] to-[#090909] p-4">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-xl text-[#efbd63]">WhatsApp chats</h2><p className="text-xs text-gray-500 mt-1">{loading ? 'Loading…' : `${chats.length} customer${chats.length === 1 ? '' : 's'} · ${todayCount} active today`}</p></div>
        <button onClick={() => loadList()} className="rounded-xl border border-white/10 p-2.5 text-gray-400" aria-label="Refresh"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      <label className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5"><Search className="w-4 h-4 text-gray-500" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or number" className="flex-1 bg-transparent text-[15px] text-gray-200 outline-none placeholder:text-gray-600" /></label>
      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
    </div>
    {!loading && !shown.length && <p className="px-2 text-sm text-gray-500">{q ? 'No chats match that search.' : 'No WhatsApp chats yet.'}</p>}
    <div className="rounded-[24px] border border-white/[.07] bg-white/[.02] divide-y divide-white/[.05] overflow-hidden">
      {shown.map(c => <button key={c.relationship_id} onClick={() => setOpenId(c.relationship_id)} className={`w-full text-left px-4 py-3.5 flex gap-3 items-start ${openId === c.relationship_id ? 'bg-[#d7a84b]/[.08]' : 'hover:bg-white/[.03]'}`}>
        <div className="shrink-0 w-11 h-11 rounded-full bg-[#d7a84b]/15 border border-[#d7a84b]/25 flex items-center justify-center text-[#efbd63] text-base">{(c.name || '?').replace(/^\+/, '').slice(0, 1).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2"><p className="text-[15px] text-gray-100 truncate">{c.name}</p><span className={`shrink-0 text-[11px] ${c.last_from === 'customer' ? 'text-[#efbd63]' : 'text-gray-500'}`}>{listWhen(c.last_at)}</span></div>
          <p className="mt-0.5 text-[13px] text-gray-500 truncate">{c.last_from !== 'customer' && <span className="text-gray-400">{WHO[c.last_from] || 'Brew'}: </span>}{c.last_preview || ' '}</p>
          {c.phone && c.phone !== c.name && <p className="mt-0.5 text-[11px] text-gray-600">{c.phone}</p>}
        </div>
      </button>)}
    </div>
  </div>;

  let lastDay = null;
  const convo = openId && <section className="rounded-[24px] border border-white/[.08] bg-[#0b0a09] flex flex-col min-h-[70vh] lg:h-[calc(100vh-140px)] overflow-hidden">
    <header className="flex items-center gap-3 border-b border-white/[.06] px-4 py-3 bg-[#111]">
      <button onClick={() => setOpenId(null)} className="lg:hidden p-1 -ml-1 text-gray-300" aria-label="Back"><ArrowLeft className="w-5 h-5" /></button>
      <div className="min-w-0 flex-1"><p className="text-base text-white truncate">{chat?.name || 'Loading…'}</p><p className="text-xs text-gray-500 truncate">{[chat?.phone, chat?.whatsapp_name && chat.whatsapp_name !== chat?.name ? `WhatsApp name: ${chat.whatsapp_name}` : null].filter(Boolean).join(' · ')}</p></div>
      {chat?.phone && <a href={`https://wa.me/${chat.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="shrink-0 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-gray-400">Open in WhatsApp</a>}
    </header>
    {!!chat?.orders?.length && <div className="px-4 py-2 border-b border-white/[.05] flex gap-2 overflow-x-auto text-[11px]">{chat.orders.map(o => <span key={o.number} className="shrink-0 rounded-full border border-[#d7a84b]/25 px-2.5 py-1 text-gray-400"><span className="text-[#efbd63]">{o.number}</span> · {String(o.status || '').toLowerCase().replace(/_/g, ' ')}{o.total ? ` · ₹${Math.round(o.total)}` : ''}</span>)}</div>}
    <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-2">
      {chatLoading && !chat && <p className="text-center text-sm text-gray-500 py-10">Loading chat…</p>}
      {(chat?.messages || []).map(m => {
        const d = dayKey(m.at), sep = d !== lastDay; lastDay = d;
        const mine = m.from !== 'customer';
        return <div key={m.id}>
          {sep && <div className="flex justify-center my-3"><span className="rounded-full bg-white/[.06] px-3 py-1 text-[11px] text-gray-400">{dayLabel(m.at)}</span></div>}
          <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <button onClick={() => setInfo(info === m.id ? null : m.id)} className={`text-left max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 ${mine ? 'rounded-br-md bg-[#2a2215] border border-[#d7a84b]/20' : 'rounded-bl-md bg-[#1b1b1b] border border-white/[.06]'}`}>
              {mine && <p className={`text-[11px] mb-0.5 ${m.from === 'aegis' ? 'text-sky-300' : 'text-[#efbd63]'}`}>{WHO[m.from] || 'Brew'}</p>}
              <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-gray-100">{m.body}</p>
              <div className="mt-1 flex items-center justify-end gap-1.5 text-[11px] text-gray-500">{mine && m.reply_seconds != null && <span>replied in {took(m.reply_seconds)} ·</span>}<span>{time(m.at)}</span>{mine && <Ticks m={m} />}</div>
              {info === m.id && <div className="mt-2 border-t border-white/10 pt-2 text-[11px] leading-5 text-gray-400">
                <p>{mine ? 'Sent' : 'Received'}: {full(m.at)}</p>
                {m.delivered_at && <p>Delivered: {full(m.delivered_at)}</p>}
                {m.read_at && <p>Read: {full(m.read_at)}</p>}
                {mine && !m.delivered_at && !m.read_at && <p className="text-gray-600">Delivery details are kept for 30 days.</p>}
              </div>}
            </button>
          </div>
        </div>;
      })}
      <div ref={bottom} />
    </div>
    <p className="border-t border-white/[.05] px-4 py-2 text-[11px] text-gray-600">Read-only. Tap a message for exact times. Updates every 10 seconds.</p>
  </section>;

  return <div className={`grid gap-4 ${openId ? 'lg:grid-cols-[340px_1fr]' : ''}`}>{list}{convo}</div>;
}
