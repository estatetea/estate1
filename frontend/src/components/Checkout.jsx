import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Smartphone } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Checkout = ({ cart, userInfo }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: userInfo?.name || "",
    phone: "",
    address: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error("Please fill all delivery details");
      return;
    }
    
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    
    if (!termsAccepted) {
      toast.error("Please accept terms and conditions");
      return;
    }
    
    // Proceed to Razorpay
    window.open("https://rzp.io/l/estatetea", "_blank");
    toast.success("Redirecting to payment...");
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (cart.length === 0) {
    navigate("/cart");
    return null;
  }

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
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate("/cart")}
          className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors mb-6 sm:mb-8 touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="uppercase tracking-widest text-xs sm:text-sm">Back to Cart</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-3 card-surface rounded-2xl p-5 sm:p-6 md:p-8">
            <h1 className="text-3xl sm:text-4xl font-light mb-6 sm:mb-8">Checkout</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Delivery Details */}
              <div>
                <h2 className="text-xl sm:text-2xl font-light gold-text mb-4">Delivery Details</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs sm:text-sm uppercase tracking-widest text-gray-300">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      data-testid="checkout-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="bg-black/40 border-white/10 text-white focus:border-[#D4AF37] h-11 sm:h-12 text-base touch-manipulation"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs sm:text-sm uppercase tracking-widest text-gray-300">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      data-testid="checkout-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="bg-black/40 border-white/10 text-white focus:border-[#D4AF37] h-11 sm:h-12 text-base touch-manipulation"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-xs sm:text-sm uppercase tracking-widest text-gray-300">
                      Delivery Address (Bangalore Only)
                    </Label>
                    <textarea
                      id="address"
                      data-testid="checkout-address"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      rows={3}
                      className="w-full bg-black/40 border border-white/10 text-white focus:border-[#D4AF37] rounded-md p-3 text-base touch-manipulation resize-none"
                      placeholder="Street, Area, City, PIN Code"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h2 className="text-xl sm:text-2xl font-light gold-text mb-4">Payment Method</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    data-testid="payment-upi"
                    onClick={() => setPaymentMethod("upi")}
                    className={`p-4 rounded-lg border-2 transition-all touch-manipulation ${
                      paymentMethod === "upi"
                        ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <Smartphone className="w-6 h-6 mx-auto mb-2 text-[#D4AF37]" />
                    <p className="text-sm font-light">UPI</p>
                  </button>
                  
                  <button
                    type="button"
                    data-testid="payment-debit"
                    onClick={() => setPaymentMethod("debit")}
                    className={`p-4 rounded-lg border-2 transition-all touch-manipulation ${
                      paymentMethod === "debit"
                        ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mx-auto mb-2 text-[#D4AF37]" />
                    <p className="text-sm font-light">Debit Card</p>
                  </button>
                  
                  <button
                    type="button"
                    data-testid="payment-credit"
                    onClick={() => setPaymentMethod("credit")}
                    className={`p-4 rounded-lg border-2 transition-all touch-manipulation ${
                      paymentMethod === "credit"
                        ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mx-auto mb-2 text-[#D4AF37]" />
                    <p className="text-sm font-light">Credit Card</p>
                  </button>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="bg-[#D4AF37]/5 p-4 sm:p-5 rounded-lg border border-[#D4AF37]/20">
                <h3 className="text-sm sm:text-base font-light gold-text mb-3 uppercase tracking-widest">Terms & Conditions</h3>
                <div className="text-xs sm:text-sm text-gray-300 space-y-2 leading-relaxed">
                  <p>Once ordered, there will be no refund. Orders are available only to those who are <strong>residing in Bangalore</strong>.</p>
                  <p>Please fill in the details accurately as orders will be delivered according to the provided details.</p>
                  <p>Order shall be received in 3-5 days from the time of payment.</p>
                  <p>You agree to share information entered on this page with ESTATE TEA (owner of this page) and Razorpay, adhering to applicable laws.</p>
                </div>
                <div className="flex items-start gap-3 mt-4">
                  <input
                    type="checkbox"
                    id="terms"
                    data-testid="terms-checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-[#D4AF37] cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs sm:text-sm text-gray-300 cursor-pointer">
                    I accept the terms and conditions
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                data-testid="proceed-payment-button"
                className="w-full bg-[#D4AF37] hover:bg-[#FDE047] active:bg-[#FDE047] text-black font-light uppercase tracking-[0.2em] py-3.5 sm:py-4 rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
              >
                Proceed to Payment
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2 card-surface rounded-2xl p-5 sm:p-6 h-fit">
            <h2 className="text-2xl font-light mb-4 sm:mb-6">Order Summary</h2>
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between text-sm sm:text-base pb-3 border-b border-white/10">
                  <div>
                    <p className="text-gray-300">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.variant} × {item.quantity}</p>
                  </div>
                  <p className="gold-text">₹{item.price * item.quantity}</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3">
                <p className="text-lg sm:text-xl font-light">Total</p>
                <p className="text-2xl sm:text-3xl gold-text">₹{getTotalPrice()}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;