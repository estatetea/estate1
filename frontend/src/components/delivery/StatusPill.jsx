import { DELIVERY_LABELS } from '@/lib/delivery-status';

const TONES = {
  DELIVERED: 'border-emerald-400/30 bg-emerald-400/[0.07] text-emerald-200',
  DELIVERY_FAILED: 'border-red-400/35 bg-red-400/[0.08] text-red-200',
  RESCHEDULED: 'border-amber-300/35 bg-amber-300/[0.08] text-amber-100',
  CANCELLED: 'border-white/15 bg-white/[0.03] text-gray-400 line-through decoration-white/30',
  OUT_FOR_DELIVERY: 'border-[#D4AF37]/60 bg-[#D4AF37]/[0.14] text-[#f1dc9c]',
};
const DOT = {
  DELIVERED: 'bg-emerald-300', DELIVERY_FAILED: 'bg-red-300', RESCHEDULED: 'bg-amber-200',
  CANCELLED: 'bg-gray-500', OUT_FOR_DELIVERY: 'bg-[#D4AF37] animate-pulse',
};

export const StatusPill = ({ status, fallback = 'Not started', testId }) => (
  <span
    data-testid={testId}
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide ${TONES[status] || (status ? 'border-[#D4AF37]/30 bg-[#D4AF37]/[0.06] text-[#e6d4a2]' : 'border-white/10 text-gray-400')}`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${DOT[status] || (status ? 'bg-[#D4AF37]' : 'bg-gray-600')}`} />
    {DELIVERY_LABELS[status] || fallback}
  </span>
);

export const PaymentPill = ({ verified, label, testId }) => (
  <span data-testid={testId} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${verified ? 'text-[#D4AF37]/90 bg-[#D4AF37]/[0.06]' : 'text-amber-200/90 bg-amber-300/[0.07]'}`}>
    {verified ? 'Paid · verified' : (label ? String(label).replace(/_/g, ' ') : 'Payment unverified')}
  </span>
);
