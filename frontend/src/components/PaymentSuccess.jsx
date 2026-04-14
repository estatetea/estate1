import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Mail, ShoppingBag } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderDetails = location.state?.orderDetails;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="glass-surface border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
          <img
            src="https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png"
            alt="Estate Tea"
            className="w-10 h-10 sm:w-12 sm:h-12"
          />
          <h2 className="text-xl sm:text-2xl font-light gold-text">Estate Tea</h2>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg text-center fade-up">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#D4AF37]/10 border-2 border-[#D4AF37] flex items-center justify-center mb-6 sm:mb-8 payment-success-pulse" data-testid="success-icon">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-[#D4AF37]" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light gold-text mb-3" data-testid="success-heading">
            Payment Successful
          </h1>
          <p className="text-base sm:text-lg text-gray-400 mb-8 sm:mb-10 font-light">
            Thank you for choosing Estate Tea!
          </p>

          {/* Order Details Card */}
          {orderDetails && (
            <div className="card-surface rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8 text-left" data-testid="order-details-card">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-4">Order Summary</p>
              <div className="space-y-3">
                {orderDetails.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-300">
                      {item.product_name} ({item.variant}) x{item.quantity}
                    </span>
                    <span className="text-[#D4AF37]">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Paid</span>
                  <span className="text-xl sm:text-2xl gold-text font-light">₹{orderDetails.total}</span>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Notice */}
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-xl p-4 sm:p-5 mb-8 sm:mb-10 flex items-start gap-3 text-left" data-testid="invoice-notice">
            <Mail className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm sm:text-base text-white font-medium mb-1">Invoice sent to your email</p>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                A confirmation invoice has been sent to the email you provided during payment. Your order will be delivered within 3-5 business days.
              </p>
            </div>
          </div>

          {/* Shop Again Button */}
          <button
            onClick={() => navigate("/store")}
            data-testid="shop-again-button"
            className="w-full bg-[#D4AF37] hover:bg-[#FDE047] text-black font-light uppercase tracking-[0.2em] py-4 rounded-lg transition-colors text-sm sm:text-base touch-manipulation flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Shop Again
          </button>

          <p className="text-xs text-gray-600 mt-6">
            We truly appreciate your support. Every cup carries a little love from our family to yours.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;
