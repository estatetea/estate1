import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import RazorpayButton from "./RazorpayButton";

const Checkout = ({ cart, userInfo }) => {
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const has250g = cart.some(item => item.variant === "250 grams");
  const has500g = cart.some(item => item.variant === "500 grams");
  
  const PAYMENT_BUTTONS = {
    "250g": "pl_SbQMIgFUp1d0QU",
    "500g": "pl_SbQNxw8mVG2fr4"
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleGoToSuccess = () => {
    navigate("/payment-success", {
      state: {
        orderDetails: {
          items: cart,
          total: getTotalPrice()
        }
      }
    });
  };

  const handleGoToFailed = () => {
    navigate("/payment-failed");
  };

  // Auto-detect that user interacted with Razorpay
  const handlePaymentAttempted = useCallback(() => {
    setShowConfirmation(true);
  }, []);

  if (cart.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="glass-surface sticky top-0 z-40 border-b border-white/10">
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
        <button
          onClick={() => navigate("/cart")}
          className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors mb-6 sm:mb-8 touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="uppercase tracking-widest text-xs sm:text-sm">Back to Cart</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
          <div className="lg:col-span-3 space-y-6">
            {/* Order Summary */}
            <div className="card-surface rounded-2xl p-5 sm:p-6 md:p-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4 sm:mb-6">Checkout</h1>
              <h2 className="text-lg sm:text-xl md:text-2xl font-light gold-text mb-4">Order Summary</h2>
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm sm:text-base pb-3 border-b border-white/10">
                    <div>
                      <p className="text-gray-300">{item.product_name}</p>
                      <p className="text-xs text-gray-500">{item.variant} x {item.quantity}</p>
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

            {/* Payment Section */}
            <div className="card-surface rounded-2xl p-4 sm:p-5 md:p-8">
              <h2 className="text-xl sm:text-2xl font-light gold-text mb-4 sm:mb-6">Complete Payment</h2>
              
              {has250g && PAYMENT_BUTTONS["250g"] && (
                <div className="mb-6">
                  <p className="text-xs sm:text-sm text-gray-400 mb-3 uppercase tracking-widest">Pay for 250g Estate Premium Tea</p>
                  <div data-testid="razorpay-250g-button" className="razorpay-button-container">
                    <RazorpayButton
                      buttonId={PAYMENT_BUTTONS["250g"]}
                      onPaymentSuccess={handleGoToSuccess}
                      onPaymentAttempted={handlePaymentAttempted}
                    />
                  </div>
                </div>
              )}

              {has500g && PAYMENT_BUTTONS["500g"] && (
                <div className="mb-6">
                  <p className="text-xs sm:text-sm text-gray-400 mb-3 uppercase tracking-widest">Pay for 500g Estate Premium Tea</p>
                  <div data-testid="razorpay-500g-button" className="razorpay-button-container">
                    <RazorpayButton
                      buttonId={PAYMENT_BUTTONS["500g"]}
                      onPaymentSuccess={handleGoToSuccess}
                      onPaymentAttempted={handlePaymentAttempted}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Post-Payment Confirmation — always visible */}
            <div className="card-surface rounded-2xl p-5 sm:p-6 md:p-8" data-testid="post-payment-section">
              <p className="text-xs sm:text-sm uppercase tracking-[0.15em] text-gray-400 mb-4 sm:mb-5">After completing your payment</p>
              <div className="space-y-3">
                <button
                  onClick={handleGoToSuccess}
                  data-testid="confirm-payment-success-button"
                  className="w-full bg-[#D4AF37] hover:bg-[#FDE047] text-black font-light uppercase tracking-[0.15em] py-3.5 sm:py-4 rounded-lg transition-colors text-sm touch-manipulation flex items-center justify-center gap-2.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  I've Completed My Payment
                </button>
                <button
                  onClick={handleGoToFailed}
                  data-testid="confirm-payment-failed-button"
                  className="w-full border border-white/15 hover:border-red-400/40 text-gray-400 hover:text-red-400 font-light uppercase tracking-[0.15em] py-3.5 sm:py-4 rounded-lg transition-colors text-sm touch-manipulation flex items-center justify-center gap-2.5"
                >
                  <XCircle className="w-4 h-4" />
                  Payment Didn't Go Through
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
            </div>
          </div>

          {/* Customer Info Sidebar */}
          <div className="lg:col-span-2 card-surface rounded-2xl p-5 sm:p-6 h-fit">
            <h2 className="text-2xl font-light mb-4 sm:mb-6">Customer Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Name</p>
                <p className="text-white">{userInfo?.name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Location</p>
                <p className="text-white">{userInfo?.place || "Bangalore"}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
