import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Checkout = ({ cart, userInfo }) => {
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [details, setDetails] = useState({
    name: userInfo?.name || "",
    phone: "",
    email: "",
    address: ""
  });

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const updateField = (field, value) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      details.name.trim() &&
      details.phone.trim().length >= 10 &&
      details.email.trim().includes("@") &&
      details.address.trim()
    );
  };

  const handlePay = async () => {
    if (paying || !isFormValid()) return;
    setPaying(true);

    try {
      const { data } = await axios.post(`${API}/create-razorpay-order`, {
        amount: getTotalPrice(),
        customer_name: details.name,
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
          setRedirecting(true);

          try {
            await axios.post(`${API}/verify-payment`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
          } catch {
            // Webhook handles it
          }

          setTimeout(() => {
            navigate("/payment-success", {
              state: {
                orderDetails: {
                  items: cart,
                  total: getTotalPrice(),
                  paymentId: response.razorpay_payment_id,
                  customerEmail: details.email
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
          name: details.name,
          email: details.email,
          contact: details.phone
        },
        theme: {
          color: "#D4AF37"
        },
        notes: {
          customer_name: details.name,
          phone: details.phone,
          email: details.email,
          address: details.address,
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
      <header className="glass-surface sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
          <img
            src="https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png"
            alt="Estate Tea"
            className="w-10 h-10 sm:w-12 sm:h-12"
          />
          <h2 className="text-xl sm:text-2xl font-light gold-text">Estate Tea</h2>
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

            {/* Delivery Details Form */}
            <div className="card-surface rounded-2xl p-5 sm:p-6 md:p-8" data-testid="delivery-details-form">
              <h2 className="text-xl sm:text-2xl font-light gold-text mb-5 sm:mb-6">Delivery Details</h2>
              <div className="space-y-4 sm:space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-name" className="text-xs uppercase tracking-widest text-gray-400">Full Name</Label>
                  <Input
                    id="checkout-name"
                    data-testid="checkout-name"
                    value={details.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-black/40 border-white/10 text-white focus:border-[#D4AF37] h-11 sm:h-12 text-base touch-manipulation"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-phone" className="text-xs uppercase tracking-widest text-gray-400">Phone Number</Label>
                  <Input
                    id="checkout-phone"
                    data-testid="checkout-phone"
                    type="tel"
                    value={details.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="10-digit mobile number"
                    className="bg-black/40 border-white/10 text-white focus:border-[#D4AF37] h-11 sm:h-12 text-base touch-manipulation"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-email" className="text-xs uppercase tracking-widest text-gray-400">Email Address</Label>
                  <Input
                    id="checkout-email"
                    data-testid="checkout-email"
                    type="email"
                    value={details.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="your@email.com"
                    className="bg-black/40 border-white/10 text-white focus:border-[#D4AF37] h-11 sm:h-12 text-base touch-manipulation"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-address" className="text-xs uppercase tracking-widest text-gray-400">Delivery Address</Label>
                  <textarea
                    id="checkout-address"
                    data-testid="checkout-address"
                    value={details.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Full address with pincode"
                    rows={3}
                    className="w-full bg-black/40 border border-white/10 text-white focus:border-[#D4AF37] rounded-md px-3 py-2.5 text-base touch-manipulation resize-none outline-none focus:ring-1 focus:ring-[#D4AF37]/50 placeholder:text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Pay Now Button */}
            <div className="card-surface rounded-2xl p-5 sm:p-6 md:p-8">
              <button
                onClick={handlePay}
                disabled={paying || !isFormValid()}
                data-testid="pay-now-button"
                className="w-full bg-[#D4AF37] hover:bg-[#FDE047] disabled:opacity-40 disabled:cursor-not-allowed text-black font-light uppercase tracking-[0.2em] py-4 sm:py-5 rounded-lg transition-colors text-base sm:text-lg touch-manipulation flex items-center justify-center gap-3"
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
              {!isFormValid() && (
                <p className="text-xs text-gray-600 text-center mt-2" data-testid="form-incomplete-hint">
                  Please fill in all delivery details to proceed
                </p>
              )}
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

          {/* Sidebar - Order at a glance */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-surface rounded-2xl p-5 sm:p-6 h-fit">
              <h2 className="text-xl sm:text-2xl font-light mb-4 sm:mb-6 gold-text">Order at a Glance</h2>
              <div className="space-y-3 text-sm">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between pb-2 border-b border-white/10">
                    <span className="text-gray-400">{item.variant}</span>
                    <span className="text-white">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1">
                  <span className="text-gray-400">Total</span>
                  <span className="text-xl gold-text">₹{getTotalPrice()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
