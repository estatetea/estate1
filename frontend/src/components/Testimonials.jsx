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
        className={`transition-all ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
        data-testid={`star-${star}`}
      >
        <Star
          className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
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
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-white">{testimonial.user_name}</p>
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

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [name, setName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API}/testimonials`).then(r => r.json()).then(setTestimonials).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    if (!reviewText.trim()) { toast.error('Please write a review'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/testimonials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), text: reviewText.trim(), rating }),
      });
      if (!res.ok) throw new Error();
      const newTestimonial = await res.json();
      setTestimonials(prev => [newTestimonial, ...prev]);
      setName('');
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
      <div className="text-center mb-8 sm:mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/60 mb-3">What Our Customers Say</p>
        <h2 className="text-3xl sm:text-4xl font-light gold-text">Testimonials</h2>
        <div className="mt-4 mx-auto w-16 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
      </div>

      {/* Review form */}
      <div className="card-surface rounded-2xl p-5 sm:p-8 mb-8 border border-white/5" data-testid="review-form-section">
        <p className="text-sm sm:text-base text-gray-300 mb-5 font-light">Loved your cup of Estate Tea? We'd love to hear from you.</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-gray-400 mb-1.5 block">Your Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={50}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none transition-colors"
              data-testid="review-name-input"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-gray-400 mb-1.5 block">Your Rating</label>
            <StarRating rating={rating} onRate={setRating} interactive />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-gray-400 mb-1.5 block">Your Experience</label>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Tell us about your experience with Estate Tea..."
              maxLength={500}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none resize-none transition-colors"
              data-testid="review-textarea"
            />
            <span className="text-xs text-gray-500 mt-1 block text-right">{reviewText.length}/500</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !reviewText.trim()}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-[#D4AF37] hover:bg-[#c5a030] disabled:bg-gray-700 disabled:text-gray-500 text-black text-sm font-medium rounded-xl transition-colors touch-manipulation"
            data-testid="submit-review-button"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Posting...' : 'Post Review'}
          </button>
        </div>
      </div>

      {/* Testimonials grid */}
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
