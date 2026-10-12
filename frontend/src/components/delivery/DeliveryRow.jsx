import { ChevronRight, Truck, Bike } from 'lucide-react';
import { StatusPill, PaymentPill } from './StatusPill';
import { orderNumber, recipientName, isPaymentVerified, statusLabel, formatWhen, lastUpdated, METHOD_LABELS } from '@/lib/delivery-status';

export const DeliveryRow = ({ order, index, onOpen, compact = false }) => {
  const ref = orderNumber(order);
  const name = recipientName(order);
  const verified = isPaymentVerified(order);
  const steward = order.source === 'steward';
  const MethodIcon = order.delivery_method === 'third_party_courier' ? Truck : Bike;
  const testRef = (ref || `row-${index}`).toLowerCase();
  return (
    <button
      type="button"
      onClick={() => onOpen(order)}
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms`, paddingTop: compact ? '0.55rem' : '1rem', paddingBottom: compact ? '0.55rem' : '1rem' }}
      className="group grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-white/[0.06] px-4 text-left transition-colors duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-both hover:bg-[#D4AF37]/[0.035] sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:px-5"
      data-testid={`delivery-row-${testRef}`}
    >
      <div className="min-w-0">
        <p className="flex items-baseline gap-2">
          <span className={`font-mono tracking-wide ${compact ? 'text-xs' : 'text-sm'} ${ref ? 'text-[#D4AF37]' : 'text-gray-500 italic'}`} data-testid={`delivery-row-number-${testRef}`}>{ref || 'Reference unavailable'}</span>
          {!steward && <span className="text-[9px] uppercase tracking-[0.18em] text-gray-600">legacy</span>}
        </p>
        <p className={`truncate font-['Cormorant_Garamond'] leading-tight text-white ${compact ? 'text-lg' : 'text-xl'}`} data-testid={`delivery-row-recipient-${testRef}`}>{name || 'Recipient not recorded'}</p>
      </div>
      <div className="col-start-2 row-start-1 flex justify-end sm:col-start-auto sm:row-start-auto sm:justify-start">
        {steward ? <StatusPill status={order.delivery_status} fallback={statusLabel(order)} testId={`delivery-row-status-${testRef}`} /> : <span className="text-xs text-gray-600">No live delivery</span>}
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 sm:col-span-1">
        <PaymentPill verified={verified} label={order.payment_status} testId={`delivery-row-payment-${testRef}`} />
        {order.delivery_method && <span className="inline-flex items-center gap-1"><MethodIcon className="h-3.5 w-3.5" />{order.courier_name || METHOD_LABELS[order.delivery_method]}</span>}
      </div>
      <div className="hidden items-center gap-3 sm:flex">
        <span className="text-xs text-gray-600">{formatWhen(lastUpdated(order))}</span>
        <ChevronRight className="h-4 w-4 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-[#D4AF37]" />
      </div>
    </button>
  );
};
