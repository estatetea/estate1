'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png';
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const empty = { name: '', email: '', house: '', street: '', landmark: '', city: 'Bengaluru', pincode: '', customer_type: 'home', business_name: '', gstin: '' };

function friendlyError(status, payload) {
  if (status === 404) return 'This link isn’t valid. Message us on WhatsApp and we’ll send you a fresh one.';
  if (status === 410) return payload?.detail || 'This link has expired. Message us on WhatsApp and we’ll send you a fresh one.';
  if (status === 422) return payload?.detail || 'Please check the details you entered and try again.';
  if (status === 503) return 'We’re unable to load this page right now. Please try again shortly.';
  return payload?.detail || 'Something went wrong. Please try again.';
}

// A customer's own "Add your details" form, opened from Brew's WhatsApp button. The link belongs to one customer:
// whatever is entered here is saved to their record only, and they confirm a summary back in the chat.
export default function OrderDetailsPage() {
  const params = useParams();
  const token = useMemo(() => (Array.isArray(params?.token) ? params.token[0] : params?.token), [params]);
  const [pageState, setPageState] = useState('loading');
  const [phone, setPhone] = useState('');
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/order-details/${encodeURIComponent(token)}`, { cache: 'no-store' });
        const p = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok) { setError(friendlyError(r.status, p)); setPageState('error'); return; }
        setPhone(p.phone || '');
        setForm(f => ({ ...f, ...Object.fromEntries(Object.entries(p).filter(([k, v]) => k in empty && v)) }));
        setPageState(p.submitted ? 'success' : 'form');
      } catch {
        if (!cancelled) { setError('We’re unable to load this page right now. Please try again shortly.'); setPageState('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const set = e => { const { name, value } = e.target; setForm(f => ({ ...f, [name]: value })); if (error) setError(''); };
  const business = form.customer_type === 'business';

  const submit = async e => {
    e.preventDefault();
    if (submitting) return;
    const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
    payload.gstin = payload.gstin.toUpperCase();
    if (!payload.name || !payload.email || !payload.house || !payload.street || !payload.city || !payload.pincode) return setError('Please fill in all the required fields.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return setError('Please enter a valid email address.');
    if (!/^[1-9][0-9]{5}$/.test(payload.pincode)) return setError('Please enter a valid 6-digit PIN code.');
    if (business && !payload.business_name) return setError('Please enter your business name.');
    if (business && !GSTIN_RE.test(payload.gstin)) return setError('Please check your GSTIN: 15 characters, like 29ABCDE1234F1Z5.');
    if (!business) { payload.business_name = null; payload.gstin = null; }
    if (!payload.landmark) payload.landmark = null;
    setSubmitting(true); setError('');
    try {
      const r = await fetch(`/api/order-details/${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await r.json().catch(() => ({}));
      if (!r.ok) return setError(friendlyError(r.status, result));
      setPageState('success');
    } catch {
      setError('We couldn’t send your details right now. Please try again shortly.');
    } finally { setSubmitting(false); }
  };

  const input = 'sample-input bg-white text-black caret-black placeholder:text-black/40';
  return (
    <main className="min-h-[100dvh] bg-[#0A0A0A] text-[#F5F5F0] px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-xl flex-col justify-center">
        <div className="mb-8 flex justify-center sm:mb-10">
          <img src={LOGO_URL} alt="Estate Tea" className="h-24 w-24 object-contain logo-sharp sm:h-28 sm:w-28" />
        </div>
        <section className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl shadow-black/30 sm:p-9">
          {pageState === 'loading' && (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <Loader2 className="mb-5 h-7 w-7 animate-spin text-[#D4AF37]" aria-hidden="true" />
              <p className="text-sm font-light text-white/65">One moment…</p>
            </div>
          )}
          {pageState === 'error' && (
            <div className="min-h-72 flex flex-col items-center justify-center text-center">
              <div className="mb-5 h-px w-12 bg-[#D4AF37]" />
              <h1 className="text-3xl font-light tracking-wide sm:text-4xl">Your details</h1>
              <p className="mt-5 max-w-md text-sm font-light leading-6 text-white/65 sm:text-base">{error}</p>
              <p className="mt-7 text-xs uppercase tracking-[0.22em] text-[#D4AF37]">Estate Tea</p>
            </div>
          )}
          {pageState === 'success' && (
            <div className="min-h-72 flex flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/70 bg-[#D4AF37]/10">
                <Check className="h-6 w-6 text-[#D4AF37]" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-light tracking-wide sm:text-4xl">Thank you.</h1>
              <p className="mt-4 max-w-md text-sm font-light leading-6 text-white/65 sm:text-base">
                We’ve saved your details. Head back to WhatsApp: Brew will send you a quick summary to confirm, then your invoice.
              </p>
              <div className="mt-8 h-px w-12 bg-[#D4AF37]" />
              <p className="mt-5 text-xs uppercase tracking-[0.22em] text-[#D4AF37]">Estate Tea</p>
            </div>
          )}
          {pageState === 'form' && (
            <>
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">Estate Tea</p>
                <h1 className="mt-3 text-3xl font-light tracking-wide sm:text-4xl">Your details</h1>
                <p className="mx-auto mt-4 max-w-md text-sm font-light leading-6 text-white/65 sm:text-base">
                  For your invoice and delivery. We’ll keep them on file so you never have to enter them again.
                </p>
                {phone && <p className="mt-4 text-xs text-white/45">For WhatsApp number <span className="text-white/80">{phone}</span></p>}
              </div>
              <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 p-1">
                  {[['home', 'For my home'], ['business', 'For a business']].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setForm(f => ({ ...f, customer_type: v }))}
                      className={`rounded-lg py-2.5 text-sm transition ${form.customer_type === v ? 'bg-[#D4AF37] text-[#0A0A0A]' : 'text-white/65'}`}>{l}</button>
                  ))}
                </div>
                <Field label={business ? 'Your name' : 'Name'} required><input name="name" value={form.name} onChange={set} autoComplete="name" maxLength={80} className={input} /></Field>
                <Field label="Email (your invoice goes here)" required><input name="email" value={form.email} onChange={set} type="email" inputMode="email" autoComplete="email" maxLength={254} className={input} /></Field>
                {business && <>
                  <Field label="Business name" required><input name="business_name" value={form.business_name} onChange={set} autoComplete="organization" maxLength={120} className={input} /></Field>
                  <Field label="GSTIN" required><input name="gstin" value={form.gstin} onChange={set} autoCapitalize="characters" maxLength={15} placeholder="29ABCDE1234F1Z5" className={`${input} uppercase`} /></Field>
                </>}
                <Field label="House / flat no., floor, building" required><input name="house" value={form.house} onChange={set} autoComplete="address-line1" maxLength={200} className={input} /></Field>
                <Field label="Street and area" required><input name="street" value={form.street} onChange={set} autoComplete="address-line2" maxLength={200} className={input} /></Field>
                <Field label="Landmark" optional><input name="landmark" value={form.landmark} onChange={set} maxLength={160} placeholder="Near…" className={input} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" required><input name="city" value={form.city} onChange={set} autoComplete="address-level2" maxLength={80} className={input} /></Field>
                  <Field label="PIN code" required><input name="pincode" value={form.pincode} onChange={set} inputMode="numeric" autoComplete="postal-code" maxLength={6} className={input} /></Field>
                </div>
                {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm leading-5 text-red-200">{error}</p>}
                <button type="submit" disabled={submitting}
                  className="mt-2 flex min-h-12 w-full items-center justify-center rounded-lg border border-[#D4AF37] bg-[#D4AF37] px-5 py-3 text-sm font-medium tracking-wide text-[#0A0A0A] transition hover:bg-[#E1C15A] disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Saving…</> : 'Save my details'}
                </button>
                <p className="pt-1 text-center text-xs font-light leading-5 text-white/40">Used only for your Estate Tea orders and invoices.</p>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, required, optional, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline justify-between text-sm text-white/80">
        <span>{label}{required ? <span className="ml-1 text-[#D4AF37]">*</span> : null}</span>
        {optional ? <span className="text-xs font-light text-white/35">Optional</span> : null}
      </span>
      {children}
    </label>
  );
}
