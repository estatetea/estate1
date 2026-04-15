import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Checkout = ({ cart, userInfo }) => {
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePay = async () => {
    if (paying) return;
    setPaying(true);

    try {
      // Create Razorpay order on backend
      const { data } = await axios.post(`${API}/create-razorpay-order`, {
        amount: getTotalPrice(),
        customer_name: userInfo?.name || "Customer",
        variant: cart.map(i => i.variant).join(", ")
      });

      const options = {
        key: data.key_id,
        amount: data.amount * 100,
        currency: data.currency,
        name: "Estate Tea",
        description: cart.map(i => `${i.product_name} (${i.variant}) x${i.quantity}`).join(", "),
        order_id: data.order_id,
        handler: async function (response) {
          // Payment successful — show redirecting overlay
          setRedirecting(true);

          try {
            // Verify payment on backend
            await axios.post(`${API}/verify-payment`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
          } catch {
            // Verification failed silently — still redirect to success
            // (webhook will handle it server-side)
          }

          // Brief pause so user sees "Redirecting..."
          setTimeout(() => {
            navigate("/payment-success", {
              state: {
                orderDetails: {
                  items: cart,
                  total: getTotalPrice(),
                  paymentId: response.razorpay_payment_id
                }
              }
            });
          }, 1500);
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
            navigate("/payment-failed");
          }
        },
        prefill: {
          name: userInfo?.name || ""
        },
        theme: {
          color: "#D4AF37"
        },
        notes: {
          customer_name: userInfo?.name,
          location: userInfo?.place || "Bangalore"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        setPaying(false);
        navigate("/payment-failed");
      });
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Could not initiate payment. Please try again.");
      setPaying(false);
    }
  };

  if (cart.length === 0 && !redirecting) {
    navigate("/cart");
    return null;
  }

  // Redirecting overlay
  if (redirecting) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4" data-testid="redirecting-screen">
        <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin mb-6" />
        <h2 className="text-xl sm:text-2xl font-light gold-text mb-2">Payment Received</h2>
        <p className="text-sm text-gray-400">Redirecting you back to the website...</p>
      </div>
    );
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
            <h2 className="text-xl sm:text-2xl font-light gold-text">Estate Tea</h2>
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

            {/* Pay Now Button */}
            <div className="card-surface rounded-2xl p-5 sm:p-6 md:p-8">
              <h2 className="text-xl sm:text-2xl font-light gold-text mb-4 sm:mb-6">Complete Payment</h2>
              <button
                onClick={handlePay}
                disabled={paying}
                data-testid="pay-now-button"
                className="w-full bg-[#D4AF37] hover:bg-[#FDE047] disabled:opacity-50 disabled:cursor-not-allowed text-black font-light uppercase tracking-[0.2em] py-4 sm:py-5 rounded-lg transition-colors text-base sm:text-lg touch-manipulation flex items-center justify-center gap-3"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Pay ₹{getTotalPrice()}</>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">Secured by Razorpay</p>
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
