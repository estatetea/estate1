import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ShoppingCart, Thermometer, Plus, Minus } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MainStore = ({ userInfo, weatherData, cart, setCart }) => {
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const variants = [
    { id: "250g", weight: "250 grams", price: 200 },
    { id: "500g", weight: "500 grams", price: 400 }
  ];

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error("Please select a variant");
      return;
    }

    const variant = variants.find(v => v.id === selectedVariant);
    const orderData = {
      customer_name: userInfo.name,
      customer_age: userInfo.age,
      customer_place: userInfo.place,
      product_name: "Estate Premium Tea",
      variant: variant.weight,
      price: variant.price,
      quantity: quantity
    };

    try {
      await axios.post(`${API}/orders`, orderData);
      setCart([orderData]);
      toast.success(`Added ${quantity} item(s) to cart!`);
      // Go directly to checkout
      navigate("/checkout");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to add to cart");
    }
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
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
            <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Welcome, {userInfo.name}</p>
            <button 
              onClick={() => navigate("/cart")}
              className="relative hover:scale-110 active:scale-95 transition-transform touch-manipulation" 
              data-testid="cart-icon-button"
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37]" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Weather Recommendation Section */}
        {weatherData && (
          <div className="card-surface rounded-2xl p-4 sm:p-6 md:p-8 mb-8 sm:mb-12 fade-up" data-testid="weather-card">
            <div className="flex flex-col gap-4 sm:gap-6">
              {/* Temperature Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="bg-[#D4AF37]/10 p-3 rounded-xl">
                    <Thermometer className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-white">{weatherData.place}</h3>
                    <span className="text-xs uppercase tracking-widest text-gray-400">{weatherData.condition}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl sm:text-5xl md:text-6xl font-light gold-text block" data-testid="temperature-display">
                    {weatherData.temperature}°
                  </span>
                </div>
              </div>
              
              {/* Recommendation Box */}
              <div className="bg-[#D4AF37]/10 p-4 sm:p-5 rounded-xl border border-[#D4AF37]/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                  <p className="text-xs sm:text-sm uppercase tracking-[0.15em] text-[#D4AF37] font-medium">Recommended for you</p>
                </div>
                <p className="text-base sm:text-lg leading-relaxed text-white font-light" data-testid="tea-recommendation">
                  {weatherData.tea_recommendation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Product Section - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {/* Product Image */}
          <div className="md:col-span-7 fade-up">
            <div className="card-surface rounded-2xl overflow-hidden h-[300px] sm:h-[400px] md:h-[500px]">
              <img 
                src="https://images.unsplash.com/photo-1760074057726-e94ee8ff1eb4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwdGVhJTIwbGVhdmVzfGVufDB8fHx8MTc3NTY2MTM1NHww&ixlib=rb-4.1.0&q=85" 
                alt="Estate Premium Tea"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="md:col-span-5 fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="card-surface rounded-2xl p-5 sm:p-6 md:p-8">
              <div className="mb-6 sm:mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2 sm:mb-3">Premium Collection</p>
                <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-3 sm:mb-4" data-testid="product-name">Estate Premium Tea</h1>
                <p className="text-sm sm:text-base leading-relaxed text-gray-400">
                  Carefully selected tea leaves from the finest estates, offering a rich and aromatic experience.
                </p>
              </div>

              {/* Variant Selection */}
              <div className="mb-6 sm:mb-8">
                <p className="text-xs sm:text-sm uppercase tracking-[0.15em] text-gray-300 mb-3 sm:mb-4">Select Size</p>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {variants.map((variant) => (
                    <button
                      key={variant.id}
                      data-testid={`variant-${variant.id}`}
                      onClick={() => setSelectedVariant(variant.id)}
                      className={`p-4 sm:p-6 rounded-lg border-2 transition-all touch-manipulation active:scale-95 ${
                        selectedVariant === variant.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <p className="text-xl sm:text-2xl font-light mb-1 sm:mb-2">{variant.weight}</p>
                      <p className="text-lg sm:text-xl gold-text">₹{variant.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6 sm:mb-8">
                <p className="text-xs sm:text-sm uppercase tracking-[0.15em] text-gray-300 mb-3 sm:mb-4">Quantity</p>
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    data-testid="decrease-quantity-button"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="border-2 border-white/20 hover:border-[#D4AF37] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed p-3 rounded-lg transition-all touch-manipulation"
                  >
                    <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </button>
                  <div className="flex-1 text-center">
                    <span data-testid="quantity-display" className="text-2xl sm:text-3xl font-light">{quantity}</span>
                  </div>
                  <button
                    data-testid="increase-quantity-button"
                    onClick={incrementQuantity}
                    className="border-2 border-white/20 hover:border-[#D4AF37] active:scale-95 p-3 rounded-lg transition-all touch-manipulation"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                data-testid="add-to-cart-button"
                onClick={handleAddToCart}
                disabled={!selectedVariant}
                className="w-full bg-[#D4AF37] hover:bg-[#FDE047] active:bg-[#FDE047] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-light uppercase tracking-[0.2em] py-3.5 sm:py-4 rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="card-surface rounded-2xl p-12 fade-up" data-testid="about-section">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-light mb-6 gold-text">Our Story</h2>
            <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-8"></div>
            <p className="text-lg leading-relaxed text-gray-300">
              We're excited to share that our family-run venture, Estate Tea, is now open for orders! Our teas are hand-picked from the misty hills of Kotagiri, bringing fresh, flavourful, feel-good cups straight to your home. Every cup carries a little love from our family to yours.
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
              <span className="w-12 h-px bg-[#D4AF37]"></span>
              <span className="uppercase tracking-[0.2em]">Kotagiri, India</span>
              <span className="w-12 h-px bg-[#D4AF37]"></span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainStore;