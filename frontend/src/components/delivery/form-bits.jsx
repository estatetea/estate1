import { PackageCheck, Package, PackageOpen, Truck, CheckCircle2, AlertTriangle, CalendarClock, XCircle } from 'lucide-react';

export const STATUS_ICONS = {
  ORDER_CONFIRMED: PackageCheck,
  BEING_PACKAGED: PackageOpen,
  READY_FOR_DISPATCH: Package,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle2,
  DELIVERY_FAILED: AlertTriangle,
  RESCHEDULED: CalendarClock,
  CANCELLED: XCircle,
};

export const inputClass = 'w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-[#D4AF37]/50 focus:outline-none';

export const Field = ({ label, id, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-gray-500">{label}</label>
    {children}
  </div>
);
