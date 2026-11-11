"use client";
import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import WhatsAppSignIn from "./WhatsAppSignIn";
import { useAccount, fillFromProfile, saveAccount, signOut } from "@/lib/useAccount";
import { Label } from "./ui/label";

/** Website checkout details: the same fields Brew's "Add your details" form records, so every order is on file alike. */
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function composeAddress(d) {
  return [d.house, d.street, d.landmark, `${d.city || ""} ${d.pincode || ""}`.trim()].map(x => (x || "").trim()).filter(Boolean).join(", ");
}

export function detailsComplete(d) {
  const base = (d.name || "").trim().length >= 2 && (d.phone || "").replace(/\D/g, "").length >= 10 && (d.email || "").includes("@")
    && (d.house || "").trim() && (d.street || "").trim().length >= 2 && (d.city || "").trim().length >= 2 && /^[1-9][0-9]{5}$/.test(d.pincode || "");
  if (!base) return false;
  if (d.customer_type === "business") return (d.business_name || "").trim().length >= 2 && GSTIN_RE.test((d.gstin || "").trim());
  return true;
}

const field = "mt-2 bg-black/40 border-white/10 text-white";
const label = "text-xs uppercase tracking-widest text-gray-400";

function Text({ k, title, details, update, type = "text", placeholder, hint, ...rest }) {
  return <div>
    <Label className={label}>{title}</Label>
    <Input type={type} value={details[k] || ""} onChange={e => update(k, e.target.value)} placeholder={placeholder} className={field} {...rest}/>
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>;
}

// Signed in (with WhatsApp): their details come from Brew's record and show as one line, with Change.
// Not signed in: a "Sign in with WhatsApp" offer above the usual form (guest checkout still works).
export default function CustomerDeliveryFields({ details, update }) {
  const acct = useAccount();
  const business = details.customer_type === "business";
  const [editing, setEditing] = useState(false), [saving, setSaving] = useState(false), [msg, setMsg] = useState("");
  const filled = useRef(false);
  useEffect(() => {
    if (!acct.signedIn || !acct.profile || filled.current) return;
    filled.current = true;
    const f = fillFromProfile(details, acct.profile);
    for (const k of Object.keys(f)) if (f[k] !== details[k]) update(k, f[k]);
    if (!detailsComplete(f)) setEditing(true);   // a new account: they fill the form once, then it's remembered
  }, [acct.signedIn, acct.profile]);
  if (!acct.signedIn) filled.current = false;
  // Signed in and the form is complete: keep it on their account straight away (a new customer "registers" just by
  // filling it in once), quietly, a moment after they stop typing.
  const lastSaved = useRef("");
  useEffect(() => {
    if (!acct.signedIn || !editing || !detailsComplete(details)) return;
    const key = JSON.stringify(details);
    if (key === lastSaved.current) return;
    const t = setTimeout(() => { saveAccount(details).then(() => { lastSaved.current = key; setMsg(""); }).catch(() => {}); }, 1500);
    return () => clearTimeout(t);
  }, [acct.signedIn, editing, details]);
  const save = async () => {
    if (!detailsComplete(details)) { setMsg("Please fill in every detail (landmark is optional)."); return; }
    setSaving(true); setMsg("");
    try { await saveAccount(details); setEditing(false); } catch (e) { setMsg(e.message); } finally { setSaving(false); }
  };
  if (acct.signedIn && !editing && detailsComplete(details)) {
    return <div className="rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/[.05] p-4" data-testid="saved-details">
      <p className="text-[10px] uppercase tracking-[.2em] text-[#D4AF37]">Delivering to</p>
      <p className="mt-2 text-white">{details.name}{details.customer_type === "business" && details.business_name ? ` · ${details.business_name}` : ""}</p>
      <p className="mt-1 text-sm text-gray-300">{composeAddress(details)}</p>
      <p className="mt-1 text-xs text-gray-500">{details.phone} · {details.email}</p>
      <div className="mt-3 flex gap-4 text-xs"><button type="button" onClick={() => setEditing(true)} className="text-[#D4AF37] hover:underline">Change</button>
        <button type="button" onClick={signOut} className="text-gray-500 hover:underline">Sign out</button></div>
    </div>;
  }
  return <div className="space-y-4">
    {!acct.signedIn && !acct.loading && <div className="rounded-xl border border-white/10 bg-white/[.02] p-4">
      <p className="text-sm text-gray-200">Ordered with us before, or chatted with Brew?</p>
      <p className="mt-1 mb-3 text-xs text-gray-500">Sign in with WhatsApp and your details fill in by themselves. Or just fill them in below.</p>
      <WhatsAppSignIn />
    </div>}
    {acct.signedIn && <p className="text-xs text-gray-500">Signed in. {detailsComplete(details) ? "Change anything below, then save." : "Fill these in once and we'll remember them, here and on WhatsApp (they're saved as you go)."}</p>}
    <Text k="name" title="Full Name" details={details} update={update} autoComplete="name"/>
    <Text k="phone" title="Phone Number (WhatsApp)" type="tel" details={details} update={update} autoComplete="tel" placeholder="98765 43210"/>
    <Text k="email" title="Email Address" type="email" details={details} update={update} autoComplete="email"/>

    <div>
      <Label className={label}>Buying for</Label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[["home", "My home"], ["business", "A business"]].map(([v, t]) =>
          <button key={v} type="button" onClick={() => update("customer_type", v)}
            className={`rounded-md border px-3 py-2.5 text-sm ${(details.customer_type || "home") === v ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#E9CF8A]" : "border-white/10 bg-black/40 text-gray-300"}`}>{t}</button>)}
      </div>
    </div>
    {business && <>
      <Text k="business_name" title="Business Name" details={details} update={update} autoComplete="organization"/>
      <div>
        <Label className={label}>GSTIN</Label>
        <Input type="text" maxLength={15} value={details.gstin || ""} onChange={e => update("gstin", e.target.value.toUpperCase().replace(/\s/g, ""))} placeholder="29ABCDE1234F1Z5" className={field}/>
        {(details.gstin || "").length > 0 && !GSTIN_RE.test(details.gstin) && <p className="mt-1 text-xs text-amber-300">A GSTIN has 15 characters, like 29ABCDE1234F1Z5.</p>}
      </div>
    </>}

    <Text k="house" title="House / Flat No. and Building" details={details} update={update} autoComplete="address-line1" placeholder="e.g. B-204, Golden Palms"/>
    <Text k="street" title="Street and Area" details={details} update={update} autoComplete="address-line2" placeholder="e.g. Hennur Road, Kothanur"/>
    <Text k="landmark" title="Landmark (optional)" details={details} update={update} placeholder="e.g. near Kristu Jayanti College"/>
    <div className="grid grid-cols-2 gap-3">
      <Text k="city" title="City" details={details} update={update} autoComplete="address-level2"/>
      <div>
        <Label className={label}>PIN Code</Label>
        <Input type="text" inputMode="numeric" autoComplete="postal-code" maxLength={6} required pattern="[0-9]{6}" value={details.pincode || ""} onChange={e => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="560077" className={field}/>
      </div>
    </div>
    {acct.signedIn ? <div>
      <button type="button" onClick={save} disabled={saving} className="w-full rounded-lg border border-[#D4AF37]/50 px-4 py-2.5 text-sm text-[#E9CF8A] disabled:opacity-50">{saving ? "Saving…" : "Save my details"}</button>
      {msg && <p className="mt-2 text-xs text-red-300">{msg}</p>}
    </div> : <p className="text-xs text-gray-500">We keep these on file, so if you ever order through Brew on WhatsApp you won't need to type them again.</p>}
  </div>;
}
