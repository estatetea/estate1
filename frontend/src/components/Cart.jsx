import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Cart = ({ cart, setCart, userInfo }) => {
  const navigate = useNavigate();

  const handleBuyLater = () => {
    setCart([]);
    toast.info("Cart cleared. Continue shopping!");
    navigate("/store");
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="glass-surface sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png" 
              alt="Estate Tea" 
              className="w-12 h-12"
            />
            <div>
              <h2 className="text-2xl font-light gold-text">Estate Tea</h2>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <p className="text-sm text-gray-400">Welcome, {userInfo?.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate("/store")}
          data-testid="back-to-store-button"
          className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="uppercase tracking-widest text-sm">Back to Store</span>
        </button>

        {cart.length === 0 ? (
          <div className="card-surface rounded-2xl p-16 text-center" data-testid="empty-cart">
            <h2 className="text-4xl font-light mb-4">Your Cart is Empty</h2>
            <p className="text-gray-400 mb-8">Add some premium tea to get started</p>
            <button
              onClick={() => navigate("/store")}
              className="bg-[#D4AF37] hover:bg-[#FDE047] text-black font-light uppercase tracking-[0.2em] px-8 py-3 rounded-lg transition-colors"
            >
              Shop Now
            </button>
          </div>
        ) : (
          <div className="card-surface rounded-2xl p-8 fade-up" data-testid="cart-page">
            <h1 className="text-4xl font-light mb-8">Your Cart</h1>
            
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xl mb-1">{item.product_name}</p>
                    <p className="text-sm text-gray-400">{item.variant} × {item.quantity}</p>
                  </div>
                  <p className="text-2xl gold-text">₹{item.price * item.quantity}</p>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-6 border-b border-white/10 pb-6">
                <p className="text-3xl font-light">Total</p>
                <p className="text-4xl gold-text" data-testid="cart-total">₹{getTotalPrice()}</p>
              </div>
              
              {/* Payment Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8">
                <a
                  href="https://rzp.io/l/estatetea"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="buy-now-button"
                  className="bg-[#D4AF37] hover:bg-[#FDE047] text-black font-light uppercase tracking-[0.2em] py-4 rounded-lg transition-colors text-center"
                >
                  Buy Now
                </a>
                <button
                  onClick={handleBuyLater}
                  data-testid="buy-later-button"
                  className="border-2 border-white/20 hover:border-[#D4AF37] text-white font-light uppercase tracking-[0.2em] py-4 rounded-lg transition-colors"
                >
                  Buy Later
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;