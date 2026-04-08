import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ShoppingCart, Thermometer, Plus, Minus } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MainStore = ({ userInfo, weatherData }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

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
      setShowOrderSummary(true);
      toast.success(`Added ${quantity} item(s) to cart!`);
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
            <p className="text-sm text-gray-400">Welcome, {userInfo.name}</p>
            <div className="relative" data-testid="cart-icon">
              <ShoppingCart className="w-6 h-6 text-[#D4AF37]" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Weather Recommendation Section */}
        {weatherData && (
          <div className="card-surface rounded-2xl p-8 mb-12 fade-up" data-testid="weather-card">
            <div className="flex items-start gap-6">
              <div className="bg-[#D4AF37]/10 p-4 rounded-xl">
                <Thermometer className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-4 mb-3">
                  <h3 className="text-3xl font-light">{weatherData.place}</h3>
                  <span className="text-5xl font-light gold-text" data-testid="temperature-display">
                    {weatherData.temperature}°C
                  </span>
                  <span className="text-gray-400 uppercase tracking-widest text-sm">{weatherData.condition}</span>
                </div>
                <div className="bg-[#D4AF37]/5 p-4 rounded-lg border border-[#D4AF37]/20">
                  <p className="text-sm uppercase tracking-[0.15em] text-[#D4AF37] mb-2">Recommended for you</p>
                  <p className="text-base leading-relaxed text-gray-300" data-testid="tea-recommendation">
                    {weatherData.tea_recommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Section - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Product Image */}
          <div className="md:col-span-7 fade-up">
            <div className="card-surface rounded-2xl overflow-hidden h-[500px]">
              <img 
                src="https://images.unsplash.com/photo-1760074057726-e94ee8ff1eb4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwdGVhJTIwbGVhdmVzfGVufDB8fHx8MTc3NTY2MTM1NHww&ixlib=rb-4.1.0&q=85" 
                alt="Estate Premium Tea"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="md:col-span-5 fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="card-surface rounded-2xl p-8">
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">Premium Collection</p>
                <h1 className="text-4xl font-light tracking-tight mb-4" data-testid="product-name">Estate Premium Tea</h1>
                <p className="text-base leading-relaxed text-gray-400">
                  Carefully selected tea leaves from the finest estates, offering a rich and aromatic experience.
                </p>
              </div>

              {/* Variant Selection */}
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.15em] text-gray-300 mb-4">Select Size</p>
                <div className="grid grid-cols-2 gap-4">
                  {variants.map((variant) => (
                    <button
                      key={variant.id}
                      data-testid={`variant-${variant.id}`}
                      onClick={() => setSelectedVariant(variant.id)}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        selectedVariant === variant.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <p className="text-2xl font-light mb-2">{variant.weight}</p>
                      <p className="text-xl gold-text">₹{variant.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.15em] text-gray-300 mb-4">Quantity</p>
                <div className="flex items-center gap-4">
                  <button
                    data-testid="decrease-quantity-button"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="border-2 border-white/20 hover:border-[#D4AF37] disabled:opacity-30 disabled:cursor-not-allowed p-3 rounded-lg transition-colors"
                  >
                    <Minus className="w-5 h-5 text-white" />
                  </button>
                  <div className="flex-1 text-center">
                    <span data-testid="quantity-display" className="text-3xl font-light">{quantity}</span>
                  </div>
                  <button
                    data-testid="increase-quantity-button"
                    onClick={incrementQuantity}
                    className="border-2 border-white/20 hover:border-[#D4AF37] p-3 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                data-testid="add-to-cart-button"
                onClick={handleAddToCart}
                disabled={!selectedVariant}
                className="w-full bg-[#D4AF37] hover:bg-[#FDE047] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-light uppercase tracking-[0.2em] py-4 rounded-lg transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        {showOrderSummary && cart.length > 0 && (
          <div className="mt-12 card-surface rounded-2xl p-8 fade-up" data-testid="order-summary">
            <h2 className="text-3xl font-light mb-6">Order Summary</h2>
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <p className="text-lg">{item.product_name}</p>
                    <p className="text-sm text-gray-400">{item.variant} × {item.quantity}</p>
                  </div>
                  <p className="text-xl gold-text">₹{item.price * item.quantity}</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 border-b border-white/10 pb-6">
                <p className="text-2xl font-light">Total</p>
                <p className="text-3xl gold-text">₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</p>
              </div>
              
              {/* Payment Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
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
                  onClick={() => {
                    setCart([]);
                    setShowOrderSummary(false);
                    setSelectedVariant(null);
                    setQuantity(1);
                    toast.info("Continue shopping");
                  }}
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

export default MainStore;