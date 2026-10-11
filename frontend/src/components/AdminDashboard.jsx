import { useState, useEffect } from "react";
import { Lock, Package, Star, Trash2, ArrowLeft, Check, X, RefreshCw, PackageCheck, Truck, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const API = '/api';

const AdminDashboard = ({ navigate }) => {
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [logging, setLogging] = useState(false);
  const [products, setProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tab, setTab] = useState('products');
  const [editingPrice, setEditingPrice] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryDraft, setDeliveryDraft] = useState({
    targetStatus: '', deliveryMethod: '', courierName: '', trackingReference: '',
    deliveryNote: '', confirmationType: 'customer_confirmation',
    confirmationNote: '', proofReference: '',
  });

  const getHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });

  const DELIVERY_NEXT = {
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
  const DELIVERY_LABELS = {
    ORDER_CONFIRMED: 'Order confirmed',
    BEING_PACKAGED: 'Being packaged',
    READY_FOR_DISPATCH: 'Ready for dispatch',
    OUT_FOR_DELIVERY: 'Out for delivery',
    DELIVERED: 'Delivered',
    DELIVERY_FAILED: 'Delivery failed',
    RESCHEDULED: 'Rescheduled',
    CANCELLED: 'Cancelled',
  };

  useEffect(() => {
    if (!selectedOrder) return;
    const status = selectedOrder.delivery_status || '';
    setDeliveryDraft({
      targetStatus: status || (selectedOrder.payment_verified ? 'ORDER_CONFIRMED' : 'CANCELLED'),
      deliveryMethod: selectedOrder.delivery_method || '',
      courierName: selectedOrder.courier_name || '',
      trackingReference: selectedOrder.tracking_reference || '',
      deliveryNote: '',
      confirmationType: selectedOrder.delivery_confirmation_type || 'customer_confirmation',
      confirmationNote: selectedOrder.delivery_confirmation_note || '',
      proofReference: selectedOrder.proof_of_delivery_reference || '',
    });
  }, [selectedOrder]);

  const updateDelivery = async () => {
    if (!selectedOrder || selectedOrder.source !== 'steward') return;
    if (deliveryDraft.targetStatus === 'DELIVERED' &&
        ((deliveryDraft.confirmationType === 'customer_confirmation' && !deliveryDraft.confirmationNote.trim()) ||
         (deliveryDraft.confirmationType === 'proof_of_delivery' && !deliveryDraft.proofReference.trim() && !deliveryDraft.confirmationNote.trim()))) {
      toast.error('Record customer confirmation or proof of delivery before marking delivered.');
      return;
    }
    setDeliverySaving(true);
    try {
      const internalId = selectedOrder.internal_order_id || selectedOrder.order_id;
      const res = await fetch(`${API}/admin/orders/${encodeURIComponent(internalId)}/delivery`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          delivery_status: deliveryDraft.targetStatus,
          delivery_method: deliveryDraft.deliveryMethod || null,
          courier_name: deliveryDraft.courierName || null,
          tracking_reference: deliveryDraft.trackingReference || null,
          delivery_note: deliveryDraft.deliveryNote || null,
          delivery_confirmation_type: deliveryDraft.confirmationType,
          delivery_confirmation_note: deliveryDraft.confirmationNote || null,
          proof_of_delivery_reference: deliveryDraft.proofReference || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.error || 'Delivery update failed.');
      const updated = { ...selectedOrder, ...data, source: 'steward',
        internal_order_id: data.order_id || internalId,
        display_order_number: data.estate_order_number || selectedOrder.display_order_number || selectedOrder.order_id };
      setOrders(prev => prev.map(order =>
        (order.internal_order_id || order.order_id || order.id) === internalId ? { ...order, ...updated } : order
      ));
      setSelectedOrder(updated);
      toast.success(`Delivery status updated: ${DELIVERY_LABELS[data.delivery_status] || data.delivery_status}`);
    } catch (error) {
      toast.error(error.message || 'Could not update delivery status.');
    } finally {
      setDeliverySaving(false);
    }
  };

  const handleLogin = async () => {
    setLogging(true);
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setToken(data.token);
      toast.success('Welcome, Admin');
    } catch { toast.error('Wrong password'); }
    finally { setLogging(false); }
  };

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/admin/products`, { headers: getHeaders() }).then(r => r.json()).then(setProducts).catch(() => {});
    fetch(`${API}/admin/testimonials`, { headers: getHeaders() }).then(r => r.json()).then(setTestimonials).catch(() => {});
    fetch(`${API}/admin/orders`, { headers: getHeaders() }).then(r => r.json()).then(setOrders).catch(() => {});
  }, [token]);

  const toggleStock = async (productId, currentStock) => {
    try {
      const res = await fetch(`${API}/admin/products`, {
        method: 'PUT', headers: getHeaders(),
        body: JSON.stringify({ product_id: productId, in_stock: !currentStock }),
      });
      const updated = await res.json();
      setProducts(prev => prev.map(p => p.product_id === productId ? { ...p, ...updated } : p));
      toast.success(`${productId} marked as ${!currentStock ? 'In Stock' : 'Out of Stock'}`);
    } catch { toast.error('Failed to update'); }
  };

  const updatePrice = async (productId) => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) { toast.error('Enter a valid price'); return; }
    try {
      const res = await fetch(`${API}/admin/products`, {
        method: 'PUT', headers: getHeaders(),
        body: JSON.stringify({ product_id: productId, price }),
      });
      const updated = await res.json();
      setProducts(prev => prev.map(p => p.product_id === productId ? { ...p, ...updated } : p));
      setEditingPrice(null);
      setNewPrice('');
      toast.success('Price updated');
    } catch { toast.error('Failed to update price'); }
  };

  const deleteTestimonial = async (id) => {
    try {
      await fetch(`${API}/admin/testimonials/${id}`, { method: 'DELETE', headers: getHeaders() });
      setTestimonials(prev => prev.filter(t => t.id !== id));
      toast.success('Review deleted');
    } catch { toast.error('Failed to delete'); }
  };

  // Login screen
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="card-surface rounded-2xl p-6 sm:p-8 max-w-sm w-full border border-white/10">
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <h1 className="text-2xl font-light gold-text">Admin Panel</h1>
            <p className="text-xs text-gray-500 mt-1">Estate Tea Management</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter admin password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none"
              data-testid="admin-password-input"
            />
            <button
              onClick={handleLogin}
              disabled={logging || !password}
              className="w-full bg-[#D4AF37] hover:bg-[#c5a030] disabled:bg-gray-700 text-black font-medium py-3 rounded-xl transition-colors text-sm"
              data-testid="admin-login-button"
            >
              {logging ? 'Logging in...' : 'Log In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="glass-surface border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('store')} className="text-gray-400 hover:text-white transition-colors" data-testid="admin-back">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-light gold-text">Admin Panel</h1>
          </div>
          <button onClick={() => { setToken(null); setPassword(''); }} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
          {[
            { id: 'products', label: 'Products', icon: Package },
            { id: 'testimonials', label: 'Reviews', icon: Star },
            { id: 'orders', label: 'Orders', icon: RefreshCw },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm transition-colors ${
                tab === t.id ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-gray-400 hover:text-white'
              }`}
              data-testid={`admin-tab-${t.id}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Products */}
        {tab === 'products' && (
          <div className="space-y-4" data-testid="admin-products-section">
            <h2 className="text-sm uppercase tracking-wider text-gray-400">Product Management</h2>
            {products.map(product => (
              <div key={product.product_id} className="card-surface rounded-xl p-4 sm:p-5 border border-white/5 flex flex-col sm:flex-row sm:items-center gap-4" data-testid={`admin-product-${product.product_id}`}>
                <div className="flex-1">
                  <p className="text-white font-medium">{product.weight}</p>
                  <p className="text-xs text-gray-500">{product.name || 'Estate Premium Tea'}</p>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                  {editingPrice === product.product_id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">₹</span>
                      <input
                        type="number"
                        value={newPrice}
                        onChange={e => setNewPrice(e.target.value)}
                        className="w-20 bg-white/5 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                        data-testid={`admin-price-input-${product.product_id}`}
                      />
                      <button onClick={() => updatePrice(product.product_id)} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                      <button onClick={() => { setEditingPrice(null); setNewPrice(''); }} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingPrice(product.product_id); setNewPrice(product.price.toString()); }}
                      className="text-lg gold-text hover:underline cursor-pointer"
                      data-testid={`admin-price-${product.product_id}`}
                    >
                      ₹{product.price}
                    </button>
                  )}
                </div>

                {/* Stock toggle */}
                <button
                  onClick={() => toggleStock(product.product_id, product.in_stock)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors ${
                    product.in_stock
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                  }`}
                  data-testid={`admin-stock-${product.product_id}`}
                >
                  {product.in_stock ? 'In Stock' : 'Out of Stock'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Testimonials */}
        {tab === 'testimonials' && (
          <div className="space-y-3" data-testid="admin-testimonials-section">
            <h2 className="text-sm uppercase tracking-wider text-gray-400">Review Management ({testimonials.length})</h2>
            {testimonials.length === 0 && <p className="text-sm text-gray-500 py-4">No reviews yet</p>}
            {testimonials.map(t => (
              <div key={t.id} className="card-surface rounded-xl p-4 border border-white/5 flex items-start gap-3" data-testid={`admin-testimonial-${t.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white">{t.user_name}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= t.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-white/10'}`} />)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{t.text}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => deleteTestimonial(t.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  data-testid={`admin-delete-${t.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div className="space-y-3" data-testid="admin-orders-section">
            <h2 className="text-sm uppercase tracking-wider text-gray-400">Recent Orders ({orders.length})</h2>
            {orders.length === 0 && <p className="text-sm text-gray-500 py-4">No orders yet</p>}
            {orders.map((order, i) => {
              const qty = order.quantity || 1;
              const subtotal = (order.price || 0) * qty;
              const gst = Math.round(subtotal * 0.05);
              const total = order.total_amount != null ? Number(order.total_amount) : subtotal + gst;
              const displayNumber = order.display_order_number || order.estate_order_number || order.order_id || order.id || "Order reference unavailable";
              const productSummary = Array.isArray(order.items) && order.items.length
                ? order.items.map(item => `${item.weight || item.product_id} × ${item.quantity}`).join(', ')
                : (order.product_name || 'Estate Premium Tea');
              return (
              <div key={order.id || i} className="card-surface rounded-xl p-4 border border-white/5" data-testid={`admin-order-${i}`}>
                <div className="flex items-center justify-between mb-2">
                  <button type="button" onClick={() => setSelectedOrder(order)} className="text-sm font-medium text-[#D4AF37] hover:underline text-left" title="View order details">{displayNumber} — {order.recipient_name || order.customer_name || "Recipient not recorded"}</button>
                  <p className="text-sm gold-text">₹{total}</p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>{productSummary}</span>
                  <span>{order.variant}</span>
                  <span>Qty: {qty}</span>
                  {order.price != null && <span>@ ₹{order.price}/pack</span>}
                  {order.gst_amount != null ? <span>GST ₹{order.gst_amount}</span> : (order.price != null && <span>+ GST ₹{gst}</span>)}
                  {order.source === 'steward' && <span className="text-[#D4AF37]">{DELIVERY_LABELS[order.delivery_status] || (order.payment_verified ? 'Awaiting delivery update' : 'Awaiting verified payment')}</span>}
                  {order.customer_place && order.customer_place !== 'Unknown' && <span>{order.customer_place}</span>}
                  {order.timestamp && <span>{new Date(order.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedOrder(null); }}>
          <div role="dialog" aria-modal="true" aria-label="Order details" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-[#151515] p-5 space-y-5">
            <div className="flex justify-between gap-4 items-start">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">Order details</p>
                <h2 className="text-lg text-[#D4AF37] font-medium">{selectedOrder.display_order_number || selectedOrder.estate_order_number || selectedOrder.order_id || selectedOrder.id || "Order reference unavailable"} — {selectedOrder.recipient_name || selectedOrder.customer_name || "Recipient not recorded"}</h2>
                {selectedOrder.source === 'steward' && <p className="text-xs text-gray-500 mt-1">Internal reference: {selectedOrder.internal_order_id || selectedOrder.order_id}</p>}
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)} aria-label="Close order details" className="text-gray-300 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[["Recipient",selectedOrder.recipient_name || selectedOrder.customer_name],["Customer",selectedOrder.customer_name],["Phone",selectedOrder.customer_phone || selectedOrder.phone],["Email",selectedOrder.customer_email || selectedOrder.email],["Delivery address",selectedOrder.delivery_address || selectedOrder.address],["PIN code",selectedOrder.pincode || selectedOrder.pin_code],["Delivery method",selectedOrder.delivery_method],["Delivery status",DELIVERY_LABELS[selectedOrder.delivery_status] || selectedOrder.delivery_status || "Not started"],["Order/payment status",selectedOrder.payment_status || selectedOrder.status],["Total",selectedOrder.total_amount != null ? "₹"+selectedOrder.total_amount : null],["Tracking reference",selectedOrder.tracking_reference],["Delivered at",selectedOrder.delivered_at ? new Date(selectedOrder.delivered_at).toLocaleString('en-IN') : null],["Confirmation type",selectedOrder.delivery_confirmation_type],["Confirmation note",selectedOrder.delivery_confirmation_note],["Proof reference",selectedOrder.proof_of_delivery_reference]].filter(([,v]) => v !== undefined && v !== null && v !== "").map(([label,value]) => <div key={label}><dt className="text-xs text-gray-500">{label}</dt><dd className="text-white break-words">{String(value)}</dd></div>)}
            </dl>
            {selectedOrder.source === 'steward' ? (
              <section className="border border-white/10 rounded-xl p-4 space-y-4" data-testid="delivery-workflow-controls">
                <div className="flex items-center gap-2"><PackageCheck className="w-5 h-5 text-[#D4AF37]" /><h3 className="text-sm font-medium text-white">Delivery workflow — owner controls</h3></div>
                {!selectedOrder.payment_verified && !['PAID', 'FULFILLED'].includes(selectedOrder.status) ? (
                  <p className="text-sm text-amber-300">Delivery is locked until Steward and Ledger independently verify payment. Current status: {selectedOrder.payment_status || selectedOrder.status || 'unknown'}.</p>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Choose the next status. The status is saved only when you press Save update.</p>
                      <div className="flex flex-wrap gap-2">
                        {(DELIVERY_NEXT[selectedOrder.delivery_status || ''] || []).filter(status => status !== 'CANCELLED' || selectedOrder.status === 'AWAITING_PAYMENT').map(status => (
                          <button key={status} type="button" onClick={() => setDeliveryDraft(prev => ({ ...prev, targetStatus: status }))} className={`rounded-lg border px-3 py-2 text-xs transition-colors ${deliveryDraft.targetStatus === status ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]' : 'border-white/10 text-gray-300 hover:border-white/30'}`} data-testid={`delivery-status-${status.toLowerCase()}`}>
                            {DELIVERY_LABELS[status]}
                          </button>
                        ))}
                      </div>
                    </div>
                    {deliveryDraft.targetStatus && deliveryDraft.targetStatus !== 'CANCELLED' && (
                      <>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1" htmlFor="delivery-method">Delivery method</label>
                          <select id="delivery-method" value={deliveryDraft.deliveryMethod} onChange={e => setDeliveryDraft(prev => ({ ...prev, deliveryMethod: e.target.value }))} className="w-full rounded-lg bg-black border border-white/15 px-3 py-2.5 text-sm text-white">
                            <option value="">Choose delivery method</option>
                            <option value="own_delivery">Estate Tea own delivery</option>
                            <option value="third_party_courier">Third-party courier (manually booked)</option>
                          </select>
                        </div>
                        {deliveryDraft.deliveryMethod === 'third_party_courier' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div><label className="block text-xs text-gray-400 mb-1" htmlFor="courier-name">Courier / service</label><input id="courier-name" value={deliveryDraft.courierName} onChange={e => setDeliveryDraft(prev => ({ ...prev, courierName: e.target.value }))} placeholder="e.g. Porter" className="w-full rounded-lg bg-black border border-white/15 px-3 py-2.5 text-sm text-white" /></div>
                            <div><label className="block text-xs text-gray-400 mb-1" htmlFor="tracking-reference">Tracking / booking reference</label><input id="tracking-reference" value={deliveryDraft.trackingReference} onChange={e => setDeliveryDraft(prev => ({ ...prev, trackingReference: e.target.value }))} placeholder="Optional reference" className="w-full rounded-lg bg-black border border-white/15 px-3 py-2.5 text-sm text-white" /></div>
                          </div>
                        )}
                        {deliveryDraft.targetStatus === 'DELIVERED' && (
                          <div className="border border-[#D4AF37]/25 rounded-lg p-3 space-y-3">
                            <div className="flex items-center gap-2 text-[#D4AF37]"><CheckCircle2 className="w-4 h-4" /><p className="text-sm font-medium">Delivery confirmation required</p></div>
                            <select value={deliveryDraft.confirmationType} onChange={e => setDeliveryDraft(prev => ({ ...prev, confirmationType: e.target.value }))} className="w-full rounded-lg bg-black border border-white/15 px-3 py-2.5 text-sm text-white">
                              <option value="customer_confirmation">Customer confirmed receipt</option>
                              <option value="proof_of_delivery">Recorded proof of delivery</option>
                            </select>
                            <div><label className="block text-xs text-gray-400 mb-1" htmlFor="delivery-confirmation-note">{deliveryDraft.confirmationType === 'customer_confirmation' ? 'How / when did the customer confirm?' : 'Proof description (optional if reference supplied)'}</label><textarea id="delivery-confirmation-note" value={deliveryDraft.confirmationNote} onChange={e => setDeliveryDraft(prev => ({ ...prev, confirmationNote: e.target.value }))} placeholder={deliveryDraft.confirmationType === 'customer_confirmation' ? 'e.g. Customer confirmed receipt by phone at 4:15 PM' : 'e.g. Delivered to reception; recipient confirmed'} rows={2} className="w-full rounded-lg bg-black border border-white/15 px-3 py-2.5 text-sm text-white" /></div>
                            {deliveryDraft.confirmationType === 'proof_of_delivery' && <div><label className="block text-xs text-gray-400 mb-1" htmlFor="proof-reference">Proof reference (optional if description supplied)</label><input id="proof-reference" value={deliveryDraft.proofReference} onChange={e => setDeliveryDraft(prev => ({ ...prev, proofReference: e.target.value }))} placeholder="Photo/file reference, receipt, or courier reference" className="w-full rounded-lg bg-black border border-white/15 px-3 py-2.5 text-sm text-white" /></div>}
                          </div>
                        )}
                      </>
                    )}
                    <div><label className="block text-xs text-gray-400 mb-1" htmlFor="delivery-note">Internal delivery note (optional)</label><textarea id="delivery-note" value={deliveryDraft.deliveryNote} onChange={e => setDeliveryDraft(prev => ({ ...prev, deliveryNote: e.target.value }))} rows={2} placeholder="Delay reason, reschedule details, or handover note" className="w-full rounded-lg bg-black border border-white/15 px-3 py-2.5 text-sm text-white" /></div>
                    {selectedOrder.delivery_history?.length > 0 && <div className="space-y-2"><p className="text-xs uppercase tracking-wider text-gray-500">Recent status history</p>{selectedOrder.delivery_history.slice(-5).reverse().map((entry, index) => <div key={`${entry.changed_at || index}`} className="flex gap-2 text-xs text-gray-400"><span className="text-[#D4AF37]">{DELIVERY_LABELS[entry.to_status] || entry.to_status}</span><span>{entry.changed_at ? new Date(entry.changed_at).toLocaleString('en-IN') : ''}</span><span>· {entry.changed_by || 'owner'}</span>{entry.note && <span>· {entry.note}</span>}</div>)}</div>}
                    <button type="button" onClick={updateDelivery} disabled={deliverySaving || !deliveryDraft.targetStatus || deliveryDraft.targetStatus === (selectedOrder.delivery_status || '')} className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-black disabled:opacity-50" data-testid="save-delivery-status">
                      {deliverySaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {deliverySaving ? 'Saving update…' : 'Save delivery update'}
                    </button>
                    <p className="text-[11px] text-gray-500">Status changes are owner-authenticated and audited. WhatsApp notifications are not sent yet; they will be connected after the WhatsApp integration is ready.</p>
                  </>
                )}
              </section>
            ) : (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex gap-2 text-sm text-amber-200"><AlertTriangle className="w-5 h-5 shrink-0" /><p>This is a legacy local order record, not an authoritative Steward order. Delivery controls are disabled so this screen cannot create a false status or bypass payment verification.</p></div>
            )}
            <p className="text-xs text-gray-500">Only fields available in the order record are displayed. Delivery proof can be a recorded reference or customer confirmation note; uploading a photo is not required.</p>
            {selectedOrder.invoice_url && <a href={selectedOrder.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-block text-[#D4AF37] underline">View invoice</a>}
            {!selectedOrder.invoice_url && <p className="text-xs text-gray-500">Invoice link not available in this order record.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
