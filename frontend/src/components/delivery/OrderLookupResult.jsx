import { StatusPill } from './StatusPill';
import { DeliveryProgress } from './DeliveryProgress';
import { orderNumber, recipientName, formatWhen, METHOD_LABELS } from '@/lib/delivery-status';

// Customer-facing view of one authorised order, using the same labels as the owner console.
export const OrderLookupResult = ({ order }) => {
  const name = recipientName(order);
  return (
    <div className="space-y-4 rounded-xl border border-[#D4AF37]/25 bg-gradient-to-b from-[#D4AF37]/[0.06] to-transparent p-4 animate-in fade-in slide-in-from-bottom-1" data-testid="brew-order-result">
      <div>
        <p className="font-mono text-xs tracking-[0.14em] text-[#D4AF37]" data-testid="brew-order-number">{orderNumber(order) || 'Reference unavailable'}</p>
        {name && <p className="font-['Cormorant_Garamond'] text-2xl leading-tight text-white" data-testid="brew-order-recipient">{name}</p>}
      </div>
      {order.delivery_status
        ? <StatusPill status={order.delivery_status} testId="brew-order-delivery-status" />
        : <p className="text-xs text-gray-300" data-testid="brew-order-status">Order status: <strong>{order.order_status || 'Being processed'}</strong></p>}
      <DeliveryProgress status={order.delivery_status} testId="brew-order-progress" />
      <dl className="space-y-1 text-xs text-gray-400">
        <div><dt className="inline">Payment: </dt><dd className="inline text-gray-200" data-testid="brew-order-payment">{order.payment_status || 'Awaiting confirmation'}</dd></div>
        {order.delivery_method && <div><dt className="inline">Delivery: </dt><dd className="inline text-gray-200">{order.courier_name || METHOD_LABELS[order.delivery_method] || order.delivery_method}</dd></div>}
        {order.tracking_reference && <div><dt className="inline">Tracking: </dt><dd className="inline font-mono text-gray-200" data-testid="brew-order-tracking">{order.tracking_reference}</dd></div>}
        {order.delivered_at && <div><dt className="inline">Delivered: </dt><dd className="inline text-gray-200">{formatWhen(order.delivered_at)}</dd></div>}
        {order.created_at && <div><dt className="inline">Placed: </dt><dd className="inline">{new Date(order.created_at).toLocaleDateString('en-IN')}</dd></div>}
      </dl>
      <p className="text-[11px] text-gray-500">Need help? Contact Estate Tea and quote this order number.</p>
    </div>
  );
};
