import { PackageOpen, PackageCheck, Truck, AlertTriangle } from 'lucide-react';

export const SUMMARY_BUCKETS = [
  { id: 'packing', label: 'Awaiting packing', icon: PackageOpen, statuses: ['', 'ORDER_CONFIRMED', 'BEING_PACKAGED'] },
  { id: 'dispatch', label: 'Ready for dispatch', icon: PackageCheck, statuses: ['READY_FOR_DISPATCH'] },
  { id: 'transit', label: 'Out for delivery', icon: Truck, statuses: ['OUT_FOR_DELIVERY'] },
  { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle, statuses: ['DELIVERY_FAILED', 'RESCHEDULED'] },
];

// Only paid Steward orders count as "awaiting packing"; unpaid ones are not fulfilment work yet.
export const inBucket = (bucket, order) =>
  order.source === 'steward' && bucket.statuses.includes(order.delivery_status || '') &&
  (bucket.id !== 'packing' || order.delivery_status || order.payment_verified);

export const DeliverySummary = ({ orders, active, onSelect }) => (
  <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 lg:grid-cols-4" data-testid="delivery-summary">
    {SUMMARY_BUCKETS.map((bucket, i) => {
      const count = orders.filter(o => inBucket(bucket, o)).length;
      const isActive = active === bucket.id;
      const alert = bucket.id === 'exceptions' && count > 0;
      return (
        <button
          key={bucket.id}
          type="button"
          onClick={() => onSelect(isActive ? null : bucket.id)}
          style={{ animationDelay: `${i * 60}ms` }}
          className={`group relative flex flex-col items-start gap-3 bg-[#0d0d0c] p-4 text-left transition-colors duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both sm:p-5 ${isActive ? 'bg-[#16130b]' : 'hover:bg-[#121110]'}`}
          data-testid={`delivery-summary-${bucket.id}`}
        >
          <span className={`absolute inset-x-0 top-0 h-px transition-opacity ${isActive ? 'bg-[#D4AF37] opacity-100' : 'bg-[#D4AF37]/50 opacity-0 group-hover:opacity-100'}`} />
          <bucket.icon className={`h-4 w-4 ${alert ? 'text-red-300' : 'text-[#D4AF37]/80'}`} strokeWidth={1.5} />
          <span className={`font-['Cormorant_Garamond'] text-4xl font-light leading-none [font-variant-numeric:lining-nums] sm:text-5xl ${alert ? 'text-red-200' : 'text-white'}`} data-testid={`delivery-summary-${bucket.id}-count`}>{count}</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500 group-hover:text-gray-300">{bucket.label}</span>
        </button>
      );
    })}
  </div>
);
