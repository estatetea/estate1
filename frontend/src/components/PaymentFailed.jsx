import { XCircle, RefreshCw, ArrowLeft } from "lucide-react";

const PaymentFailed = ({ data, navigate }) => {
  const reason = data?.reason;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="glass-surface border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
          <img src="https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png" alt="Estate Tea" className="w-10 h-10 sm:w-12 sm:h-12" />
          <h2 className="text-xl sm:text-2xl font-light gold-text">Estate Tea</h2>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg text-center fade-up">
          <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-500/10 border-2 border-red-500/50 flex items-center justify-center mb-6 sm:mb-8" data-testid="failure-icon">
            <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-400" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-3" data-testid="failure-heading">Payment Unsuccessful</h1>
          <p className="text-base sm:text-lg text-gray-400 mb-4 font-light max-w-md mx-auto leading-relaxed">We're sorry — it looks like the payment didn't go through this time.</p>

          {reason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 max-w-sm mx-auto" data-testid="failure-reason">
              <p className="text-sm text-red-300">{reason}</p>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-8 sm:mb-10 max-w-sm mx-auto leading-relaxed">Don't worry, no amount has been deducted. These things happen sometimes — a network hiccup or a momentary glitch. Your tea is still waiting for you.</p>

          <div className="space-y-3 sm:space-y-4">
            <button onClick={() => navigate('checkout')} data-testid="try-again-button" className="w-full bg-[#D4AF37] hover:bg-[#FDE047] text-black font-light uppercase tracking-[0.2em] py-4 rounded-lg transition-colors text-sm sm:text-base touch-manipulation flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button onClick={() => navigate('store')} data-testid="back-to-store-button" className="w-full border border-white/20 hover:border-[#D4AF37] text-white font-light uppercase tracking-[0.2em] py-4 rounded-lg transition-colors text-sm sm:text-base touch-manipulation flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Store
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-8 leading-relaxed max-w-xs mx-auto">If the issue persists, please reach out to us and we'll be happy to help.</p>
        </div>
      </main>
    </div>
  );
};

export default PaymentFailed;
