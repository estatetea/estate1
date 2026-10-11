import { useCallback, useEffect, useState } from 'react';
import { DeliveryBoard } from './DeliveryBoard';

// Owner delivery console for the Estate Tea AI web app; always re-reads backend state.
export const DeliveriesSection = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(data)) throw new Error(data?.error || `Could not load orders (${res.status}).`);
      // Legacy rows are add-to-cart records, not orders; only Steward orders can be fulfilled.
      setOrders(data.filter(o => o.source === 'steward'));
    } catch (e) {
      setError(e.message || 'Could not load orders.');
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return <DeliveryBoard orders={orders} loading={loading} error={error} headers={headers} reload={load} />;
};
