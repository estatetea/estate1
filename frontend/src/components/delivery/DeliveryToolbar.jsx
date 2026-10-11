import { Search, RefreshCw } from 'lucide-react';
import { DELIVERY_LABELS } from '@/lib/delivery-status';

const selectClass = 'h-11 rounded-xl border border-white/10 bg-[#0d0d0c] px-3 text-sm text-gray-200 focus:border-[#D4AF37]/50 focus:outline-none';

export const DeliveryToolbar = ({ query, setQuery, status, setStatus, payment, setPayment, onRefresh, loading }) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center" data-testid="delivery-toolbar">
    <label className="relative flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search ET number or recipient"
        className="h-11 w-full rounded-xl border border-white/10 bg-[#0d0d0c] pl-10 pr-3 text-sm text-white placeholder:text-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
        data-testid="delivery-search-input"
      />
    </label>
    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
      <select value={status} onChange={e => setStatus(e.target.value)} className={selectClass} data-testid="delivery-status-filter" aria-label="Filter by delivery status">
        <option value="all">All statuses</option>
        <option value="none">Not started</option>
        {Object.entries(DELIVERY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select value={payment} onChange={e => setPayment(e.target.value)} className={selectClass} data-testid="delivery-payment-filter" aria-label="Filter by payment verification">
        <option value="all">All payments</option>
        <option value="verified">Paid · verified</option>
        <option value="unverified">Unverified</option>
      </select>
      <button type="button" onClick={onRefresh} disabled={loading} aria-label="Reload orders" className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-gray-400 transition-colors hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:opacity-50" data-testid="delivery-refresh-button">
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  </div>
);
