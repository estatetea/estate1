import { CheckCircle, ShoppingBag } from "lucide-react";
import { useEffect } from "react";

const PaymentSuccessModal = ({ orderDetails, onContinue }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-testid="payment-success-overlay"
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md card-surface rounded-2xl p-6 sm:p-8 text-center fade-up"
        data-testid="payment-success-modal"
      >
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-[#D4AF37]/15 border-2 border-[#D4AF37] flex items-center justify-center mb-5 payment-success-pulse">
          <CheckCircle className="w-8 h-8 text-[#D4AF37]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-light gold-text mb-2">Payment Successful</h2>
        <p className="text-sm text-gray-400 mb-6">Thank you for your purchase!</p>

        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent mb-5" />

        {/* Order Details */}
        {orderDetails && (
          <div className="bg-black/40 rounded-xl p-4 mb-6 text-left space-y-3">
            {orderDetails.items && orderDetails.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-300">{item.product_name} ({item.variant}) x{item.quantity}</span>
                <span className="text-[#D4AF37]">₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="h-px bg-white/10" />
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Total</span>
              <span className="text-lg gold-text font-medium">₹{orderDetails.total}</span>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          Your invoice will be sent to the email and phone number provided during payment.
          Orders are delivered within 3-5 business days.
        </p>

        <button
          onClick={onContinue}
          data-testid="continue-shopping-button"
          className="w-full bg-[#D4AF37] hover:bg-[#FDE047] text-black font-light uppercase tracking-[0.2em] py-3.5 rounded-lg transition-colors text-sm touch-manipulation flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
