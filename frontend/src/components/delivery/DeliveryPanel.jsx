import { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { StatusPill, PaymentPill } from './StatusPill';
import { DeliveryProgress } from './DeliveryProgress';
import { DeliveryUpdateForm } from './DeliveryUpdateForm';
import { DeliveryHistory } from './DeliveryHistory';
import { orderNumber, recipientName, isPaymentVerified, statusLabel, formatWhen, METHOD_LABELS } from '@/lib/delivery-status';

const Section = ({ title, children, testId }) => (
  <section className="space-y-3 border-t border-white/[0.07] pt-5" data-testid={testId}>
    <h3 className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]/70">{title}</h3>
    {children}
  </section>
);

const details = o => [
  ['Customer', o.customer_name !== o.recipient_name ? o.customer_name : null],
  ['Phone', o.customer_phone || o.phone],
  ['Email', o.customer_email || o.email],
  ['Address', o.delivery_address || o.address],
  ['PIN code', o.pincode || o.pin_code],
  ['Total', o.total_amount != null ? `₹${o.total_amount}` : null],
  ['Method', METHOD_LABELS[o.delivery_method] || o.delivery_method],
  ['Courier', o.courier_name],
  ['Tracking', o.tracking_reference],
  ['Delivered at', o.delivered_at ? formatWhen(o.delivered_at) : null],
  ['Confirmation', o.delivery_confirmation_note],
  ['Proof ref', o.proof_of_delivery_reference],
].filter(([, v]) => v !== undefined && v !== null && v !== '');

export const DeliveryPanel = ({ order, headers, onClose, onSaved }) => {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const ref = orderNumber(order);
  const steward = order.source === 'steward';
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in" onMouseDown={e => e.target === e.currentTarget && onClose()} data-testid="delivery-panel-overlay">
      <aside role="dialog" aria-modal="true" aria-label="Order delivery" className="mt-auto flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0b0a] shadow-2xl animate-in slide-in-from-bottom-8 duration-300 sm:mt-0 sm:h-full sm:max-h-none sm:max-w-xl sm:rounded-none sm:border-y-0 sm:border-r-0 sm:slide-in-from-right-8" data-testid="delivery-panel">
        <header className="relative border-b border-white/[0.07] px-5 pb-5 pt-6 sm:px-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_70%)]" />
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition-colors hover:bg-white/5 hover:text-white" data-testid="delivery-panel-close"><X className="h-5 w-5" /></button>
          <p className={`font-mono text-sm tracking-[0.12em] ${ref ? 'text-[#D4AF37]' : 'italic text-gray-500'}`} data-testid="delivery-panel-order-number">{ref || 'Reference unavailable'}</p>
          <h2 className="mt-1 pr-10 font-['Cormorant_Garamond'] text-3xl font-light leading-tight text-white sm:text-4xl" data-testid="delivery-panel-recipient">{recipientName(order) || 'Recipient not recorded'}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {steward && <StatusPill status={order.delivery_status} fallback={statusLabel(order)} testId="delivery-panel-status" />}
            <PaymentPill verified={isPaymentVerified(order)} label={order.payment_status} testId="delivery-panel-payment" />
          </div>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-8 pt-5 sm:px-7">
          {steward ? (
            <>
              <DeliveryProgress status={order.delivery_status} testId="delivery-panel-progress" />
              <Section title="Update status" testId="delivery-workflow-controls">
                <DeliveryUpdateForm order={order} headers={headers} onSaved={onSaved} />
              </Section>
            </>
          ) : (
            <div className="flex gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-4 text-sm text-amber-100" data-testid="delivery-legacy-notice">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>Legacy local record — not an authoritative Steward order. Delivery controls are disabled so this screen cannot create a false status or bypass payment verification.</p>
            </div>
          )}
          <Section title="Order details" testId="delivery-panel-details">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {details(order).map(([label, value]) => (
                <div key={label} className={label === 'Address' ? 'sm:col-span-2' : ''}>
                  <dt className="text-[11px] text-gray-500">{label}</dt>
                  <dd className="break-words text-gray-100">{String(value)}</dd>
                </div>
              ))}
            </dl>
            {order.invoice_url && <a href={order.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-[#D4AF37] underline-offset-4 hover:underline" data-testid="delivery-panel-invoice-link">View invoice</a>}
          </Section>
          {steward && (
            <Section title="History" testId="delivery-panel-history">
              <DeliveryHistory history={order.delivery_history} />
            </Section>
          )}
        </div>
      </aside>
    </div>
  );
};
