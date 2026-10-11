import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { DeliverySummary, SUMMARY_BUCKETS, inBucket } from './DeliverySummary';
import { DeliveryToolbar } from './DeliveryToolbar';
import { DeliveryRow } from './DeliveryRow';
import { DeliveryPanel } from './DeliveryPanel';
import { orderNumber, recipientName, isPaymentVerified } from '@/lib/delivery-status';

const keyOf = o => o.internal_order_id || o.order_id || o.id;

function applyFilters(orders, { query, status, payment, bucket }) {
  const q = query.trim().toLowerCase();
  const b = SUMMARY_BUCKETS.find(x => x.id === bucket);
  return orders.filter(o =>
    (!q || [orderNumber(o), recipientName(o), o.customer_name].some(v => v && String(v).toLowerCase().includes(q))) &&
    (status === 'all' || (status === 'none' ? !o.delivery_status : o.delivery_status === status)) &&
    (payment === 'all' || (payment === 'verified') === isPaymentVerified(o)) &&
    (!b || inBucket(b, o)));
}

export const DeliveryBoard = ({ orders, loading, error, headers, reload }) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [payment, setPayment] = useState('all');
  const [bucket, setBucket] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const visible = useMemo(() => applyFilters(orders, { query, status, payment, bucket }), [orders, query, status, payment, bucket]);
  const selected = orders.find(o => keyOf(o) === selectedKey) || null;

  return (
    <div className="space-y-5" data-testid="admin-orders-section">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]/70">Fulfilment</p>
          <h2 className="font-['Cormorant_Garamond'] text-3xl font-light text-white sm:text-4xl">Deliveries</h2>
        </div>
        <p className="pb-1 text-xs text-gray-500" data-testid="delivery-visible-count">{visible.length} of {orders.length} orders</p>
      </div>
      <DeliverySummary orders={orders} active={bucket} onSelect={setBucket} />
      <DeliveryToolbar query={query} setQuery={setQuery} status={status} setStatus={setStatus} payment={payment} setPayment={setPayment} onRefresh={reload} loading={loading} />
      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-400/30 bg-red-500/[0.06] p-3 text-sm text-red-200" data-testid="delivery-load-error">
          <AlertCircle className="h-4 w-4 shrink-0" /><p className="flex-1">{error}</p>
          <button type="button" onClick={reload} className="rounded-lg border border-red-300/30 px-3 py-1.5 text-xs hover:bg-red-400/10" data-testid="delivery-retry-button">Retry</button>
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0a]" data-testid="delivery-list">
        {loading && !orders.length && [0, 1, 2].map(i => <div key={i} className="h-[76px] animate-pulse border-b border-white/[0.06] bg-white/[0.015]" />)}
        {!loading && !visible.length && <p className="px-5 py-12 text-center text-sm text-gray-500" data-testid="delivery-empty">{orders.length ? 'No orders match these filters.' : 'No orders yet.'}</p>}
        {visible.map((order, i) => <DeliveryRow key={keyOf(order) || i} order={order} index={i} onOpen={o => setSelectedKey(keyOf(o))} />)}
      </div>
      {selected && <DeliveryPanel order={selected} headers={headers} onClose={() => setSelectedKey(null)} onSaved={reload} />}
    </div>
  );
};
