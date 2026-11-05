import { Input } from "./ui/input";
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

export default function CustomerDeliveryFields({ details, update }) {
  const business = details.customer_type === "business";
  return <div className="space-y-4">
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
    <p className="text-xs text-gray-500">We keep these on file, so if you ever order through Brew on WhatsApp you won't need to type them again.</p>
  </div>;
}
