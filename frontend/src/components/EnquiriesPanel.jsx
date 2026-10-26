import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Mail, Phone, Star, Check } from 'lucide-react';
import { sendAegisChat, notifyAegisChatUpdated } from '@/lib/aegis-chat';

const KIND = { bulk: 'Bulk enquiry', review: 'Website review', question: 'Question' };
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
const when = iso => iso ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : '';

// Everything customers send from the website: bulk enquiries and reviews.
export function EnquiriesPanel({ headers, token, onCount }) {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(null);
  const headersRef = useRef(headers);
  headersRef.current = headers;
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/enquiries', { headers: headersRef.current, cache: 'no-store' });
      if (r.ok) { const data = await r.json(); setRows(Array.isArray(data) ? data : []); }
    } catch { /* keep last list */ }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (rows) onCount?.(rows.filter(r => r.status === 'new').length); }, [rows, onCount]);

  const mark = async (row, status) => {
    await fetch('/api/admin/enquiries', { method: 'PATCH', headers: headersRef.current, body: JSON.stringify({ enquiry_id: row.enquiry_id, status }) });
    setRows(list => list.map(r => r.enquiry_id === row.enquiry_id ? { ...r, status } : r));
  };
  const askBrew = async row => {
    setBusy(row.enquiry_id);
    try {
      const { answer } = await sendAegisChat({ token, message: `Tell Brew to email ${row.name} at ${row.contact} replying to their website bulk enquiry for ${row.quantity_kg} kg of Estate Tea: thank them, share our B2B price of ₹420 per kg, and ask for their delivery location and when they need it.` });
      notifyAegisChatUpdated();
      toast.success(answer.slice(0, 160));
      await mark(row, 'handled');
    } catch (e) { toast.error(e.message || 'Aegis could not pass it to Brew'); } finally { setBusy(null); }
  };

  if (!rows) return <p className="text-sm text-gray-500">Loading enquiries…</p>;
  if (!rows.length) return <div className="rounded-[24px] border border-white/[.07] p-8 text-center"><p className="text-sm text-gray-300">No website enquiries yet</p><p className="mt-1 text-xs text-gray-600">Bulk enquiries and reviews from estatetea.in appear here, and Aegis notifies your phone.</p></div>;
  return <div className="space-y-3">
    {rows.map(row => {
      const fresh = row.status === 'new';
      return <div key={row.enquiry_id} className={`rounded-[22px] border p-4 ${fresh ? 'border-[#d7a84b]/30 bg-[#d7a84b]/[0.04]' : 'border-white/[.07] opacity-70'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[.18em] text-[#b99043]">{KIND[row.kind] || 'Enquiry'}{fresh && ' · new'}</p>
            <p className="mt-1 text-[15px] text-white">{row.name}{row.kind === 'bulk' && row.quantity_kg ? <span className="text-[#efbd63]"> · {row.quantity_kg} kg</span> : null}</p>
            {row.rating && <p className="mt-1 flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < row.rating ? 'fill-[#efbd63] text-[#efbd63]' : 'text-gray-600'}`} />)}</p>}
            {row.message && <p className="mt-2 text-sm leading-relaxed text-gray-300">{row.message}</p>}
            <p className="mt-2 text-[11px] text-gray-500">{when(row.created_at)}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {row.contact && (isEmail(row.contact)
            ? <a href={`mailto:${row.contact}`} className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-300"><Mail className="h-3.5 w-3.5" />{row.contact}</a>
            : <a href={`tel:${row.contact.replace(/[^\d+]/g, '')}`} className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-300"><Phone className="h-3.5 w-3.5" />{row.contact}</a>)}
          {fresh && row.kind === 'bulk' && isEmail(row.contact) && <button onClick={() => askBrew(row)} disabled={busy === row.enquiry_id} className="rounded-full bg-[#efbd63] px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50">{busy === row.enquiry_id ? 'Asking Brew…' : 'Have Brew reply'}</button>}
          {fresh ? <button onClick={() => mark(row, 'handled')} className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-400"><Check className="h-3.5 w-3.5" />Mark done</button>
            : <button onClick={() => mark(row, 'new')} className="rounded-full px-3 py-1.5 text-xs text-gray-500">Mark as new</button>}
        </div>
      </div>;
    })}
  </div>;
}
