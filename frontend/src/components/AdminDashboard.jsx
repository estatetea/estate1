import { useState, useEffect } from "react";
import { Lock, Package, Star, Trash2, ArrowLeft, Check, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const API = '/api';

const AdminDashboard = ({ navigate }) => {
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [logging, setLogging] = useState(false);
  const [products, setProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('products');
  const [editingPrice, setEditingPrice] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  const getHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });

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
            {orders.map((order, i) => (
              <div key={order.id || i} className="card-surface rounded-xl p-4 border border-white/5" data-testid={`admin-order-${i}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white">{order.customer_name}</p>
                  <p className="text-sm gold-text">₹{order.price * (order.quantity || 1)}</p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>{order.variant}</span>
                  <span>Qty: {order.quantity || 1}</span>
                  <span>{order.customer_place}</span>
                  {order.timestamp && <span>{new Date(order.timestamp).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
