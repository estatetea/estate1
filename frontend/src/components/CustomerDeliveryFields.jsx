import { Input } from "./ui/input";
import { Label } from "./ui/label";

/** Shared delivery identity fields for website checkout and owner-approved AI orders. */
export default function CustomerDeliveryFields({ details, update }) {
  return <div className="space-y-4">
    {[
      ["name", "Full Name", "text"],
      ["phone", "Phone Number", "tel"],
      ["email", "Email Address", "email"],
    ].map(([key, label, type]) => <div key={key}>
      <Label className="text-xs uppercase tracking-widest text-gray-400">{label}</Label>
      <Input type={type} value={details[key] || ""} onChange={event => update(key, event.target.value)} className="mt-2 bg-black/40 border-white/10 text-white"/>
    </div>)}
    <div>
      <Label className="text-xs uppercase tracking-widest text-gray-400">GSTIN (optional)</Label>
      <Input type="text" maxLength={15} value={details.gstin || ""} onChange={event => update("gstin", event.target.value.toUpperCase())} placeholder="Enter GSTIN if applicable" className="mt-2 bg-black/40 border-white/10 text-white"/>
    </div>
    <div>
      <Label className="text-xs uppercase tracking-widest text-gray-400">Delivery Address</Label>
      <textarea value={details.address || ""} onChange={event => update("address", event.target.value)} rows={3} className="mt-2 w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white"/>
    </div>
  </div>;
}
