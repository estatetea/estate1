'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png';

const initialForm = {
  contact_name: '',
  phone: '',
  delivery_address: '',
  area_locality: '',
  pincode: '',
  delivery_instructions: '',
};

function friendlyError(status, payload) {
  if (status === 404) return 'This sample link is not valid. Please contact Estate Tea for a fresh link.';
  if (status === 410) return 'This sample link has expired. Please contact Estate Tea and we’ll send you a fresh one.';
  if (status === 422) return 'Please check the details you entered and try again.';
  if (status === 503) return 'We’re unable to load this page right now. Please try again shortly.';
  return payload?.detail || payload?.message || 'Something went wrong. Please try again.';
}

export default function SampleDetailsPage() {
  const params = useParams();
  const token = useMemo(() => {
    const value = params?.token;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const [pageState, setPageState] = useState('loading');
  const [businessName, setBusinessName] = useState('');
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/sample-details/${encodeURIComponent(token)}`, {
          cache: 'no-store',
        });
        const payload = await response.json().catch(() => ({}));
        if (cancelled) return;

        if (!response.ok) {
          setError(friendlyError(response.status, payload));
          setPageState('error');
          return;
        }

        setBusinessName(payload.business_name || '');
        if (payload.submitted || payload.status === 'received') {
          setPageState('success');
        } else {
          setPageState('form');
        }
      } catch {
        if (!cancelled) {
          setError('We’re unable to load this page right now. Please try again shortly.');
          setPageState('error');
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const payload = {
      contact_name: form.contact_name.trim(),
      phone: form.phone.trim(),
      delivery_address: form.delivery_address.trim(),
      area_locality: form.area_locality.trim(),
      pincode: form.pincode.trim(),
      delivery_instructions: form.delivery_instructions.trim() || null,
    };

    if (!payload.contact_name || !payload.phone || !payload.delivery_address || !payload.area_locality || !payload.pincode) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(payload.pincode)) {
      setError('Please enter a valid 6-digit PIN code.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/sample-details/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(friendlyError(response.status, result));
        return;
      }

      if (result.status === 'received' || result.status === 'already_received') {
        setPageState('success');
      } else {
        setError('We couldn’t confirm your details. Please try again.');
      }
    } catch {
      setError('We couldn’t submit your details right now. Please try again shortly.');
    } finally {
      setSubmitting(false);
    }
  };

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
              <p className="text-sm font-light text-white/65">Preparing your sample details…</p>
            </div>
          )}

          {pageState === 'error' && (
            <div className="min-h-72 flex flex-col items-center justify-center text-center">
              <div className="mb-5 h-px w-12 bg-[#D4AF37]" />
              <h1 className="text-3xl font-light tracking-wide sm:text-4xl">Sample Details</h1>
              <p className="mt-5 max-w-md text-sm font-light leading-6 text-white/65 sm:text-base">{error}</p>
              <p className="mt-7 text-xs uppercase tracking-[0.22em] text-[#D4AF37]">Estate Tea</p>
            </div>
          )}

          {pageState === 'success' && (
            <div className="min-h-72 flex flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/70 bg-[#D4AF37]/10">
                <Check className="h-6 w-6 text-[#D4AF37]" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-light tracking-wide sm:text-4xl">You’re all set.</h1>
              <p className="mt-4 max-w-md text-sm font-light leading-6 text-white/65 sm:text-base">
                We’ve received your delivery details. We’ll be in touch with an estimated delivery window.
              </p>
              <div className="mt-8 h-px w-12 bg-[#D4AF37]" />
              <p className="mt-5 text-xs uppercase tracking-[0.22em] text-[#D4AF37]">Estate Tea</p>
            </div>
          )}

          {pageState === 'form' && (
            <>
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.24em] text-[#D4AF37]">Estate Tea</p>
                <h1 className="mt-3 text-3xl font-light tracking-wide sm:text-4xl">Sample Delivery Details</h1>
                <p className="mx-auto mt-4 max-w-md text-sm font-light leading-6 text-white/65 sm:text-base">
                  {businessName
                    ? `We’d love to send an Estate Tea sample to ${businessName}. Add the delivery details below and we’ll take care of the rest.`
                    : 'We’d love to send your Estate Tea sample over. Add the delivery details below and we’ll take care of the rest.'}
                </p>
              </div>

              <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
                <Field label="Contact name" required>
                  <input
                    name="contact_name"
                    value={form.contact_name}
                    onChange={updateField}
                    autoComplete="name"
                    maxLength={120}
                    required
                    className="sample-input bg-white text-black caret-black placeholder:text-black/40"
                  />
                </Field>

                <Field label="Phone number" required>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={40}
                    required
                    className="sample-input bg-white text-black caret-black placeholder:text-black/40"
                  />
                </Field>

                <Field label="Delivery address" required>
                  <textarea
                    name="delivery_address"
                    value={form.delivery_address}
                    onChange={updateField}
                    autoComplete="street-address"
                    rows={4}
                    maxLength={700}
                    required
                    className="sample-input resize-none bg-white text-black caret-black placeholder:text-black/40"
                  />
                </Field>

                <Field label="Area / locality" required>
                  <input
                    name="area_locality"
                    value={form.area_locality}
                    onChange={updateField}
                    autoComplete="address-level2"
                    maxLength={180}
                    required
                    className="sample-input bg-white text-black caret-black placeholder:text-black/40"
                  />
                </Field>

                <Field label="PIN code" required>
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={updateField}
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    pattern="[1-9][0-9]{5}"
                    required
                    className="sample-input bg-white text-black caret-black placeholder:text-black/40"
                  />
                </Field>

                <Field label="Delivery instructions" optional>
                  <textarea
                    name="delivery_instructions"
                    value={form.delivery_instructions}
                    onChange={updateField}
                    rows={3}
                    maxLength={500}
                    placeholder="Landmark, reception desk, preferred handover notes…"
                    className="sample-input resize-none bg-white text-black caret-black placeholder:text-black/40"
                  />
                </Field>

                {error && (
                  <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm leading-5 text-red-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex min-h-12 w-full items-center justify-center rounded-lg border border-[#D4AF37] bg-[#D4AF37] px-5 py-3 text-sm font-medium tracking-wide text-[#0A0A0A] transition hover:bg-[#E1C15A] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Confirming…</>
                  ) : 'Confirm Delivery Details'}
                </button>

                <p className="pt-1 text-center text-xs font-light leading-5 text-white/40">
                  Your details will only be used to coordinate your Estate Tea sample.
                </p>
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
