import { useState, useEffect } from "react";
import { Star, Quote, Send } from "lucide-react";
import { toast } from "sonner";

const API = '/api';

const StarRating = ({ rating, onRate, interactive = false }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => interactive && onRate(star)}
        className={`transition-colors ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        data-testid={`star-${star}`}
      >
        <Star
          className={`w-4 h-4 sm:w-5 sm:h-5 ${
            star <= rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-white/15'
          }`}
        />
      </button>
    ))}
  </div>
);

const TestimonialCard = ({ testimonial }) => {
  const date = new Date(testimonial.created_at);
  const timeAgo = getTimeAgo(date);

  return (
    <div className="card-surface rounded-xl p-5 sm:p-6 border border-white/5 hover:border-[#D4AF37]/20 transition-colors" data-testid="testimonial-card">
      <div className="flex items-start gap-3 mb-4">
        {testimonial.user_picture ? (
          <img
            src={testimonial.user_picture}
            alt={testimonial.user_name}
            className="w-10 h-10 rounded-full object-cover border border-white/10"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-sm font-medium">
            {testimonial.user_name?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{testimonial.user_name}</p>
          <p className="text-xs text-gray-500">{timeAgo}</p>
        </div>
        <StarRating rating={testimonial.rating} />
      </div>
      <div className="relative pl-4">
        <Quote className="absolute left-0 top-0 w-3 h-3 text-[#D4AF37]/30" />
        <p className="text-sm sm:text-base text-gray-300 leading-relaxed italic">{testimonial.text}</p>
      </div>
    </div>
  );
};

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

const Testimonials = ({ navigate, authUser, authToken, setAuthUser, setAuthToken }) => {
  const [testimonials, setTestimonials] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Load testimonials
  useEffect(() => {
    fetch(`${API}/testimonials`).then(r => r.json()).then(setTestimonials).catch(() => {});
  }, []);

  // Check if user is already signed in (session from OAuth)
  useEffect(() => {
    if (!authUser) {
      fetch(`${API}/auth/me`, { credentials: 'include' })
        .then(r => { if (r.ok) return r.json(); throw new Error(); })
        .then(data => {
          if (data.name) setAuthUser(data);
        })
        .catch(() => {});
    }
  }, [authUser, setAuthUser]);

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleGoogleSignIn = () => {
    const redirectUrl = window.location.origin + window.location.pathname;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) { toast.error('Please write something'); return; }
    setSubmitting(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${API}/testimonials`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ text: reviewText.trim(), rating }),
      });
      if (!res.ok) throw new Error('Failed');
      const newTestimonial = await res.json();
      setTestimonials(prev => [newTestimonial, ...prev]);
      setReviewText('');
      setRating(5);
      toast.success('Thank you for your review!');
    } catch {
      toast.error('Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-up" data-testid="testimonials-section">
      {/* Section header */}
      <div className="text-center mb-8 sm:mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/60 mb-3">What Our Customers Say</p>
        <h2 className="text-3xl sm:text-4xl font-light gold-text">Testimonials</h2>
        <div className="mt-4 mx-auto w-16 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
      </div>

      {/* Write a review */}
      <div className="card-surface rounded-2xl p-5 sm:p-8 mb-8 border border-white/5" data-testid="review-form-section">
        {authUser ? (
          <div>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
              {authUser.picture ? (
                <img src={authUser.picture} alt={authUser.name} className="w-10 h-10 rounded-full border border-[#D4AF37]/30" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-medium">
                  {authUser.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white">{authUser.name}</p>
                <p className="text-xs text-gray-500">Sharing your experience</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Your Rating</p>
              <StarRating rating={rating} onRate={setRating} interactive />
            </div>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Tell us about your experience with Estate Tea..."
              maxLength={500}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none resize-none transition-colors"
              data-testid="review-textarea"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">{reviewText.length}/500</span>
              <button
                onClick={handleSubmitReview}
                disabled={submitting || !reviewText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#c5a030] disabled:bg-gray-700 disabled:text-gray-500 text-black text-sm font-medium rounded-lg transition-colors touch-manipulation"
                data-testid="submit-review-button"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Posting...' : 'Post Review'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 sm:py-6">
            <p className="text-sm sm:text-base text-gray-300 mb-1 font-light">Loved your cup of Estate Tea?</p>
            <p className="text-xs text-gray-500 mb-5">Sign in with Google to share your experience</p>
            <button
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#D4AF37]/30 rounded-xl transition-all touch-manipulation"
              data-testid="google-signin-button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm text-white font-light">{authLoading ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Existing testimonials */}
      {testimonials.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5" data-testid="testimonials-grid">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.id || i} testimonial={t} />
          ))}
        </div>
      )}

      {testimonials.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-6">Be the first to share your experience with Estate Tea!</p>
      )}
    </div>
  );
};

export default Testimonials;
