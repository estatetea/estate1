import { Check } from 'lucide-react';
import { DELIVERY_LABELS, PROGRESS_STEPS, EXCEPTION_STATUSES, progressIndex } from '@/lib/delivery-status';

const SHORT = {
  ORDER_CONFIRMED: 'Confirmed', BEING_PACKAGED: 'Packing', READY_FOR_DISPATCH: 'Ready',
  OUT_FOR_DELIVERY: 'On the way', DELIVERED: 'Delivered',
};

export const DeliveryProgress = ({ status, compact = false, testId = 'delivery-progress' }) => {
  const current = progressIndex(status);
  const exception = EXCEPTION_STATUSES.includes(status);
  const cancelled = status === 'CANCELLED';
  return (
    <div data-testid={testId} className={cancelled ? 'opacity-40' : ''}>
      <ol className="grid grid-cols-5 gap-1">
        {PROGRESS_STEPS.map((step, i) => {
          const done = i < current || (i === current && step === 'DELIVERED');
          const active = i === current && step !== 'DELIVERED';
          return (
            <li key={step} className="flex flex-col items-center gap-1.5 text-center" data-testid={`${testId}-step-${step.toLowerCase()}`}>
              <div className="flex w-full items-center">
                <span className={`h-px flex-1 ${i === 0 ? 'opacity-0' : i <= current ? 'bg-[#D4AF37]/70' : 'bg-white/10'}`} />
                <span className={`flex shrink-0 items-center justify-center rounded-full border transition-colors duration-500 ${compact ? 'h-4 w-4' : 'h-6 w-6'} ${done ? 'border-[#D4AF37] bg-[#D4AF37] text-black' : active ? (exception ? 'border-amber-300 bg-amber-300/15' : 'border-[#D4AF37] bg-[#D4AF37]/15 shadow-[0_0_14px_rgba(212,175,55,0.45)]') : 'border-white/15 bg-black'}`}>
                  {done ? <Check className={compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} strokeWidth={3} /> : active ? <span className={`h-1.5 w-1.5 rounded-full ${exception ? 'bg-amber-200' : 'bg-[#D4AF37] animate-pulse'}`} /> : null}
                </span>
                <span className={`h-px flex-1 ${i === PROGRESS_STEPS.length - 1 ? 'opacity-0' : i < current ? 'bg-[#D4AF37]/70' : 'bg-white/10'}`} />
              </div>
              {!compact && <span className={`text-[10px] leading-tight sm:text-[11px] ${i <= current ? 'text-[#e6d4a2]' : 'text-gray-600'}`}>{SHORT[step]}</span>}
            </li>
          );
        })}
      </ol>
      {exception && !compact && <p className="mt-2 text-center text-[11px] text-amber-200/90">{DELIVERY_LABELS[status]} — awaiting a new delivery attempt</p>}
      {cancelled && !compact && <p className="mt-2 text-center text-[11px] text-gray-400">This order was cancelled</p>}
    </div>
  );
};
