// Shared delivery lifecycle: same labels for admin, Brew lookup and future WhatsApp templates.
export const DELIVERY_LABELS = {
  ORDER_CONFIRMED: 'Order confirmed',
  BEING_PACKAGED: 'Being packaged',
  READY_FOR_DISPATCH: 'Ready for dispatch',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  DELIVERY_FAILED: 'Delivery failed',
  RESCHEDULED: 'Rescheduled',
  CANCELLED: 'Cancelled',
};

export const DELIVERY_NEXT = {
  '': ['ORDER_CONFIRMED', 'CANCELLED'],
  ORDER_CONFIRMED: ['BEING_PACKAGED', 'CANCELLED'],
  BEING_PACKAGED: ['READY_FOR_DISPATCH', 'CANCELLED'],
  READY_FOR_DISPATCH: ['OUT_FOR_DELIVERY', 'RESCHEDULED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED', 'RESCHEDULED'],
  DELIVERY_FAILED: ['READY_FOR_DISPATCH', 'RESCHEDULED'],
  RESCHEDULED: ['READY_FOR_DISPATCH', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const PROGRESS_STEPS = ['ORDER_CONFIRMED', 'BEING_PACKAGED', 'READY_FOR_DISPATCH', 'OUT_FOR_DELIVERY', 'DELIVERED'];
export const EXCEPTION_STATUSES = ['DELIVERY_FAILED', 'RESCHEDULED'];

export const METHOD_LABELS = {
  own_delivery: 'Estate Tea delivery',
  third_party_courier: 'Third-party courier',
};

// Progress index used by the stepper; exceptions sit between dispatch and delivery.
export function progressIndex(status) {
  if (!status) return -1;
  if (EXCEPTION_STATUSES.includes(status)) return 3;
  return PROGRESS_STEPS.indexOf(status);
}

export const orderNumber = order => order?.estate_order_number || order?.display_order_number || order?.customer_order_number || null;
export const recipientName = order => order?.recipient_name || order?.customer_name || null;

export const isPaymentVerified = order =>
  Boolean(order?.payment_verified) || ['PAID', 'FULFILLED'].includes(order?.status);

// Cancellation is only offered under the unpaid/cancellation rule; backend re-validates.
export function nextStatuses(order) {
  return (DELIVERY_NEXT[order?.delivery_status || ''] || [])
    .filter(status => status !== 'CANCELLED' || order?.status === 'AWAITING_PAYMENT');
}

export function statusLabel(order) {
  if (order?.delivery_status) return DELIVERY_LABELS[order.delivery_status] || order.delivery_status;
  return isPaymentVerified(order) ? 'Awaiting confirmation' : 'Awaiting payment';
}

export function formatWhen(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export const lastUpdated = order =>
  order?.delivery_updated_at || order?.delivery_history?.at?.(-1)?.changed_at || order?.updated_at || order?.timestamp;
