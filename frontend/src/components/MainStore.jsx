import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ShoppingCart, Thermometer, Plus, Minus, Flame, Snowflake, BookOpen, ArrowRight, ChevronDown } from "lucide-react";
import RecipeModal from "./RecipeModal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

const API = '/api';

const SLIDE_IMAGES = [
  "https://customer-assets.emergentagent.com/job_tea-estate-store/artifacts/p3gkmb59_WhatsApp%20Image%202026-05-12%20at%2011.03.38%20AM.jpeg",
  "https://customer-assets.emergentagent.com/job_tea-estate-store/artifacts/bfjxesqj_estate%205%20insta.png",
  "https://customer-assets.emergentagent.com/job_tea-estate-store/artifacts/scqqgqhb_estate%202.jpg",
  "https://customer-assets.emergentagent.com/job_tea-estate-store/artifacts/bn0sx1sc_estate%201.jpg"
];

const ImageSlideshow = () => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % SLIDE_IMAGES.length);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(next, 4500);
    return () => clearInterval(timerRef.current);
  }, [next]);

  return (
    <div className="relative rounded-2xl overflow-hidden h-[300px] sm:h-[400px] md:h-[500px] bg-[#0e0e0e] fade-up" data-testid="image-slideshow">
      {SLIDE_IMAGES.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Estate Tea ${i + 1}`}
          className="absolute inset-0 w-full h-full object-contain transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: current === i ? 1 : 0 }}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10" data-testid="slideshow-dots">
        {SLIDE_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); clearInterval(timerRef.current); timerRef.current = setInterval(next, 4500); }}
            className={`rounded-full transition-all duration-400 ${current === i ? "w-6 h-1.5 bg-[#D4AF37]" : "w-1.5 h-1.5 bg-white/40"}`}
            data-testid={`slideshow-dot-${i}`}
          />
        ))}
      </div>
    </div>
  );
};

const MainStore = ({ userInfo, weatherData, cart, setCart, navigate }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [recipeType, setRecipeType] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const productRef = useRef(null);

  const variants = [
    { id: "250g", weight: "250 grams", price: 200 },
    { id: "500g", weight: "500 grams", price: 390 }
  ];

  const hotRecommendation = "Hot Estate Classic with ginger and honey — perfect for warming up on chilly days";
  const coldRecommendation = "Iced Estate Tea with mint and lime — a refreshing cooler for sunny weather";

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error("Please select a variant");
      return;
    }

    const variant = variants.find(v => v.id === selectedVariant);
    const orderData = {
      customer_name: userInfo.name,
      customer_age: 0,
      customer_place: userInfo.place || "Unknown",
      product_name: "Estate Premium Tea",
      variant: variant.weight,
      price: variant.price,
      quantity: quantity
    };

    try {
      await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      setCart([orderData]);
      toast.success(`Added ${quantity} item(s) to cart!`);
      setTransitioning(true);
      setTimeout(() => navigate('checkout'), 600);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to add to cart");
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      {/* Tea powder background */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1540363786380-d00a1f4622c8?w=1920&q=80" 
          alt="" 
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]" />
      </div>

      {/* Page exit transition */}
      <div
        className="fixed inset-0 z-[100] bg-[#0a0a0a] pointer-events-none transition-opacity duration-500"
        style={{ opacity: transitioning ? 1 : 0 }}
      />
      
      {/* Header */}
      <header className="glass-surface sticky top-0 z-50 border-b border-white/10 relative">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png" 
              alt="Estate Tea" 
              className="w-8 h-8 sm:w-12 sm:h-12"
            />
            <h2 className="hidden sm:block text-xl sm:text-2xl font-light gold-text">Estate Tea</h2>
          </div>

          {/* Nav Dropdowns */}
          <nav className="flex items-center gap-0.5 sm:gap-2" data-testid="nav-dropdowns">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-0.5 sm:gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm text-gray-300 hover:text-[#D4AF37] hover:bg-white/5 transition-colors touch-manipulation" data-testid="categories-dropdown">
                  Categories
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-[#1a1a1a] border-white/10 min-w-[140px]">
                <DropdownMenuItem
                  className="text-gray-200 hover:text-[#D4AF37] focus:text-[#D4AF37] focus:bg-white/5 cursor-pointer"
                  data-testid="nav-tea"
                  onClick={() => productRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                >
                  Tea
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-gray-200 hover:text-[#D4AF37] focus:text-[#D4AF37] focus:bg-white/5 cursor-pointer"
                  data-testid="nav-hampers"
                  onClick={() => toast("Hampers — Coming Soon!", { description: "We're working on something special." })}
                >
                  Hampers
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-0.5 sm:gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm text-gray-300 hover:text-[#D4AF37] hover:bg-white/5 transition-colors touch-manipulation" data-testid="services-dropdown">
                  Services
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-[#1a1a1a] border-white/10 min-w-[160px]">
                <DropdownMenuItem
                  className="text-gray-200 hover:text-[#D4AF37] focus:text-[#D4AF37] focus:bg-white/5 cursor-pointer"
                  data-testid="nav-wedding-favours"
                  onClick={() => toast("Wedding Favours — Coming Soon!", { description: "Custom tea hampers for your special day." })}
                >
                  Wedding Favours
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex items-center gap-3 sm:gap-6">
            <p className="text-xs sm:text-sm text-gray-400 hidden md:block">Welcome, {userInfo.name}</p>
            <button 
              onClick={() => navigate('cart')}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 relative z-10">

        {/* Image Slideshow */}
        <div className="mb-8 sm:mb-12">
          <ImageSlideshow />
        </div>

        {/* Weather-based Recommendation (location granted) */}
        {weatherData && (
          <div className="card-surface rounded-2xl p-4 sm:p-6 md:p-8 mb-8 sm:mb-12 fade-up" data-testid="weather-card">
            <div className="flex flex-col gap-4 sm:gap-6">
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

              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light" data-testid="weather-greeting">
                {weatherData.temperature < 20
                  ? `We notice it's quite cool where you are, ${userInfo.name}. Here's something to warm you up.`
                  : weatherData.temperature < 28
                    ? `It feels pretty pleasant in ${weatherData.place} right now, ${userInfo.name}. Here's what we'd suggest.`
                    : `It's quite warm where you are, ${userInfo.name}. Here's our pick to help you cool down.`
                }
              </p>
              
              <div className="bg-[#D4AF37]/10 p-4 sm:p-5 rounded-xl border border-[#D4AF37]/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                    <p className="text-xs sm:text-sm uppercase tracking-[0.15em] text-[#D4AF37] font-medium">Our suggestion for you</p>
                  </div>
                  <button
                    onClick={() => setRecipeType(weatherData.temperature < 25 ? "hot" : "cold")}
                    data-testid="recipe-button-weather"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 text-[#D4AF37] text-xs sm:text-sm transition-colors touch-manipulation"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Recipe
                  </button>
                </div>
                <p className="text-base sm:text-lg leading-relaxed text-white font-light" data-testid="tea-recommendation">
                  {weatherData.tea_recommendation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Both options (location denied) */}
        {!weatherData && (
          <div className="mb-8 sm:mb-12 fade-up" data-testid="tea-options-section">
            <div className="text-center mb-6 sm:mb-8">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">What are you in the mood for?</p>
              <h3 className="text-2xl sm:text-3xl font-light gold-text">Choose Your Preparation</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="card-surface rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-[#D4AF37]/30 transition-colors" data-testid="hot-tea-option">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                  <div className="bg-orange-500/10 p-3 rounded-xl">
                    <Flame className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-light text-white">Hot Tea</h4>
                    <span className="text-xs uppercase tracking-widest text-gray-400">For cold weather</span>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-4" data-testid="hot-tea-recommendation">
                  {hotRecommendation}
                </p>
                <button
                  onClick={() => setRecipeType("hot")}
                  data-testid="recipe-button-hot"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/30 text-[#D4AF37] text-sm transition-colors touch-manipulation w-full justify-center"
                >
                  <BookOpen className="w-4 h-4" />
                  View Recipe
                </button>
              </div>

              <div className="card-surface rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-[#D4AF37]/30 transition-colors" data-testid="cold-tea-option">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                  <div className="bg-cyan-500/10 p-3 rounded-xl">
                    <Snowflake className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-light text-white">Iced Tea</h4>
                    <span className="text-xs uppercase tracking-widest text-gray-400">For warm weather</span>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-4" data-testid="cold-tea-recommendation">
                  {coldRecommendation}
                </p>
                <button
                  onClick={() => setRecipeType("cold")}
                  data-testid="recipe-button-cold"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/30 text-[#D4AF37] text-sm transition-colors touch-manipulation w-full justify-center"
                >
                  <BookOpen className="w-4 h-4" />
                  View Recipe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Modal */}
        {recipeType && (
          <RecipeModal type={recipeType} onClose={() => setRecipeType(null)} />
        )}

        {/* Product Section */}
        <div ref={productRef} className="max-w-lg mx-auto mb-12 sm:mb-16 fade-up" data-testid="product-section">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2 sm:mb-3">Premium Collection</p>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-3 sm:mb-4" data-testid="product-name">Estate Premium Tea</h1>
            <p className="text-sm sm:text-base leading-relaxed text-gray-400">
              Carefully selected tea leaves from the finest estates, offering a rich and aromatic experience.
            </p>
          </div>

          {/* Variant Selection */}
          <div className="mb-6 sm:mb-8">
            <p className="text-xs sm:text-sm uppercase tracking-[0.15em] text-gray-300 mb-3 sm:mb-4 text-center">Select Size</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  data-testid={`variant-${variant.id}`}
                  onClick={() => setSelectedVariant(variant.id)}
                  className={`p-4 sm:p-6 rounded-xl border transition-all duration-300 touch-manipulation active:scale-[0.97] text-center ${
                    selectedVariant === variant.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                      : 'border-white/10 hover:border-white/25'
                  }`}
                >
                  <p className="text-lg sm:text-2xl font-light mb-1 sm:mb-2">{variant.weight}</p>
                  <p className="text-lg sm:text-xl gold-text">₹{variant.price}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center mt-2" data-testid="gst-note">Prices exclusive of 5% GST (CGST 2.5% + SGST 2.5%)</p>
          </div>

          {/* Quantity Selector */}
          <div className="mb-6 sm:mb-8">
            <p className="text-xs sm:text-sm uppercase tracking-[0.15em] text-gray-300 mb-3 sm:mb-4 text-center">Quantity</p>
            <div className="flex items-center gap-4 justify-center">
              <button
                data-testid="decrease-quantity-button"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="border border-white/15 hover:border-[#D4AF37] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed p-3 rounded-xl transition-all touch-manipulation"
              >
                <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
              <span data-testid="quantity-display" className="text-2xl sm:text-3xl font-light w-16 text-center">{quantity}</span>
              <button
                data-testid="increase-quantity-button"
                onClick={incrementQuantity}
                className="border border-white/15 hover:border-[#D4AF37] active:scale-95 p-3 rounded-xl transition-all touch-manipulation"
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
            className="w-full flex items-center justify-center gap-3 bg-[#D4AF37] hover:bg-[#c5a030] active:bg-[#b89528] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-light uppercase tracking-[0.2em] py-3.5 sm:py-4 rounded-xl transition-all text-sm sm:text-base touch-manipulation active:scale-[0.98]"
          >
            {selectedVariant ? (
              <>
                <span>Add to Cart — ₹{Math.round((variants.find(v => v.id === selectedVariant)?.price || 0) * quantity * 1.05)}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : "Select a size"}
          </button>
        </div>

        {/* About Section */}
        <div className="card-surface rounded-2xl p-6 sm:p-8 md:p-12 fade-up" data-testid="about-section">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4 sm:mb-6 gold-text">Our Story</h2>
            <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-6 sm:mb-8"></div>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-300">
              We're excited to share that our family-run venture, Estate Tea, is now open for orders! Our teas are hand-picked from the misty hills of Kotagiri, bringing fresh, flavourful, feel-good cups straight to your home. Every cup carries a little love from our family to yours.
            </p>
            <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-400">
              <span className="w-8 sm:w-12 h-px bg-[#D4AF37]"></span>
              <span className="uppercase tracking-[0.2em]">Kotagiri, India</span>
              <span className="w-8 sm:w-12 h-px bg-[#D4AF37]"></span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainStore;
