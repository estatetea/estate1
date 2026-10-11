import { DELIVERY_LABELS, formatWhen } from '@/lib/delivery-status';

export const DeliveryHistory = ({ history }) => {
  if (!history?.length) return <p className="text-xs text-gray-600" data-testid="delivery-history-empty">No status changes recorded yet.</p>;
  return (
    <ol className="relative space-y-4 border-l border-white/10 pl-5" data-testid="delivery-history">
      {[...history].reverse().map((entry, i) => (
        <li key={`${entry.changed_at || ''}-${i}`} className="relative" data-testid={`delivery-history-entry-${i}`}>
          <span className={`absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ring-4 ring-[#0b0b0a] ${i === 0 ? 'bg-[#D4AF37]' : 'bg-white/25'}`} />
          <p className="text-sm text-white">
            {entry.from_status && <span className="text-gray-500">{DELIVERY_LABELS[entry.from_status] || entry.from_status} → </span>}
            <span className={i === 0 ? 'text-[#e6d4a2]' : ''}>{DELIVERY_LABELS[entry.to_status] || entry.to_status}</span>
          </p>
          <p className="text-[11px] text-gray-500">{formatWhen(entry.changed_at)} · {entry.changed_by || 'owner'}</p>
          {entry.note && <p className="mt-1 text-xs text-gray-400">{entry.note}</p>}
        </li>
      ))}
    </ol>
  );
};
