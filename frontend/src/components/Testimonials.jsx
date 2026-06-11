import { useState, useEffect } from "react";
import { Star, Quote, Send, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const API = '/api';

const StarRating = ({ rating, onRate, interactive = false, size = "sm" }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => interactive && onRate(star)}
        className={`transition-all ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
        data-testid={`star-${star}`}
      >
        <Star
          className={`${size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} transition-colors ${
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
    <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5" data-testid="testimonial-card">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-white">{testimonial.user_name}</p>
        <StarRating rating={testimonial.rating} />
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">{testimonial.text}</p>
      <p className="text-[10px] text-gray-600 mt-2">{timeAgo}</p>
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
  const [formOpen, setFormOpen] = useState(false);

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
      setFormOpen(false);
      toast.success('Thank you for your review!');
    } catch {
      toast.error('Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-up" data-testid="testimonials-section">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]/60 mb-2">What Our Customers Say</p>
        <h2 className="text-2xl sm:text-3xl font-light gold-text">Testimonials</h2>
        <div className="mt-3 mx-auto w-12 h-px bg-[#D4AF37]/30" />
      </div>

      {/* Customer testimonials first */}
      {testimonials.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6" data-testid="testimonials-grid">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.id || i} testimonial={t} />
          ))}
        </div>
      )}

      {testimonials.length === 0 && (
        <p className="text-center text-xs text-gray-500 py-4 mb-4">Be the first to share your experience!</p>
      )}

      {/* Compact write review — collapsible */}
      <div className="card-surface rounded-xl border border-white/5 overflow-hidden" data-testid="review-form-section">
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-300 hover:text-[#D4AF37] transition-colors touch-manipulation"
          data-testid="toggle-review-form"
        >
          <span className="font-light">Leave a review</span>
          {formOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {formOpen && (
          <div className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                maxLength={50}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none transition-colors"
                data-testid="review-name-input"
              />
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-gray-500">Rating</span>
                <StarRating rating={rating} onRate={setRating} interactive size="md" />
              </div>
            </div>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Tell us about your experience..."
              maxLength={500}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none resize-none transition-colors"
              data-testid="review-textarea"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-600">{reviewText.length}/500</span>
              <button
                onClick={handleSubmit}
                disabled={submitting || !name.trim() || !reviewText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#D4AF37] hover:bg-[#c5a030] disabled:bg-gray-700 disabled:text-gray-500 text-black text-xs font-medium rounded-lg transition-colors touch-manipulation"
                data-testid="submit-review-button"
              >
                <Send className="w-3 h-3" />
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Testimonials;
