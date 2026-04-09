import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Cart = ({ cart, setCart, userInfo }) => {
  const navigate = useNavigate();

  const handleBuyLater = () => {
    toast.info("Continue shopping");
    navigate("/store");
  };

  const handleRemoveItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    toast.success("Item removed from cart");
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleBuyNow = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="glass-surface sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png" 
              alt="Estate Tea" 
              className="w-10 h-10 sm:w-12 sm:h-12"
            />
            <div>
              <h2 className="text-xl sm:text-2xl font-light gold-text">Estate Tea</h2>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Welcome, {userInfo?.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate("/store")}
          data-testid="back-to-store-button"
          className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] active:text-[#D4AF37] transition-colors mb-6 sm:mb-8 touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="uppercase tracking-widest text-xs sm:text-sm">Back to Store</span>
        </button>

        {cart.length === 0 ? (
          <div className="card-surface rounded-2xl p-8 sm:p-16 text-center" data-testid="empty-cart">
            <h2 className="text-3xl sm:text-4xl font-light mb-3 sm:mb-4">Your Cart is Empty</h2>
            <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">Add some premium tea to get started</p>
            <button
              onClick={() => navigate("/store")}
              className="bg-[#D4AF37] hover:bg-[#FDE047] active:bg-[#FDE047] text-black font-light uppercase tracking-[0.2em] px-6 sm:px-8 py-3 rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
            >
              Shop Now
            </button>
          </div>
        ) : (
          <div className="card-surface rounded-2xl p-5 sm:p-6 md:p-8 fade-up" data-testid="cart-page">
            <h1 className="text-3xl sm:text-4xl font-light mb-6 sm:mb-8">Your Cart</h1>
            
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div className="flex-1">
                    <p className="text-lg sm:text-xl mb-1">{item.product_name}</p>
                    <p className="text-xs sm:text-sm text-gray-400">{item.variant} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl sm:text-2xl gold-text">₹{item.price * item.quantity}</p>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      data-testid={`remove-item-${index}`}
                      className="text-red-400 hover:text-red-300 active:scale-95 transition-all touch-manipulation p-2"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-4 sm:pt-6 border-b border-white/10 pb-4 sm:pb-6">
                <p className="text-2xl sm:text-3xl font-light">Total</p>
                <p className="text-3xl sm:text-4xl gold-text" data-testid="cart-total">₹{getTotalPrice()}</p>
              </div>
              
              {/* Payment Actions - Only Buy Later */}
              <div className="pt-6 sm:pt-8">
                <button
                  onClick={handleBuyLater}
                  data-testid="buy-later-button"
                  className="w-full border-2 border-white/20 hover:border-[#D4AF37] active:border-[#D4AF37] text-white font-light uppercase tracking-[0.2em] py-3.5 sm:py-4 rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
                >
                  Continue Shopping
                </button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  To complete payment, click "Continue Shopping" and proceed to checkout
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;