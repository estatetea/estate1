'use client';
import { useEffect, useState } from 'react';

// "Meet Estate Tea": where Brew's welcome button leads. Everything a new customer usually asks, in one place,
// so their WhatsApp messages go on ordering, not on questions. Facts match Brew's rulebook; prices are live from the shop.
const WA = 'https://wa.me/919742668951?text=' + encodeURIComponent("Hi Brew, I'd like to order");
const FALLBACK = [{ product_id: '250g', weight: '250 g', price: 180 }, { product_id: '500g', weight: '500 g', price: 360 }, { product_id: '1kg', weight: '1 kg', price: 720 }];
const LASTS = { '250g': 'about a month', '500g': 'about two months', '1kg': 'about four months' };
const grams = w => String(w || '').replace(/grams?/i, 'g').replace(/\s+/g, ' ').trim();

function Section({ title, children }) {
  return <section className="rounded-2xl border border-white/10 bg-white/[.03] p-5 sm:p-6"><h2 className="text-xl font-light text-[#E9CF8A] mb-3">{title}</h2>{children}</section>;
}

export default function MeetEstateTea() {
  const [packs, setPacks] = useState(FALLBACK);
  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(list => {
      if (Array.isArray(list) && list.length) {
        const byId = new Map(list.map(p => [p.product_id, p]));
        setPacks(FALLBACK.map(f => ({ ...f, ...(byId.get(f.product_id) || {}), weight: f.weight })));
      }
    }).catch(() => {});
  }, []);
  return <div className="min-h-screen bg-[#0a0a0a] text-[#EDE6D8] pb-28">
    <header className="border-b border-white/10"><div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
      <span className="text-2xl font-light text-[#D4AF37]">Estate Tea</span>
      <a href={WA} className="text-xs uppercase tracking-[.2em] text-gray-400">Back to Brew</a></div></header>
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-5 text-[15px] leading-7">
      <div>
        <p className="text-xs uppercase tracking-[.25em] text-[#D4AF37]">Meet Estate Tea</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-light">Premium tea powder, <span className="text-[#D4AF37]">at an everyday price.</span></h1>
        <p className="mt-3 text-gray-300">Brew is your personal tea concierge on WhatsApp. Everything you need to know is here; when you're ready, tap the button below and tell him the pack you'd like.</p>
      </div>

      <Section title="Our story">
        <p className="text-gray-300">Estate Tea is a family-run venture, now open for orders. Our teas are from the misty hills of the Nilgiris, bringing fresh, flavourful, feel-good cups straight to your home. Every cup carries a little love from our family to yours.</p>
        <p className="mt-2 text-gray-400">It's premium black CTC tea powder: strong, brisk and full-bodied, made for a proper cup of chai.</p>
      </Section>

      <Section title="Packs and prices">
        <div className="divide-y divide-white/10">
          {packs.map(p => <div key={p.product_id} className="flex items-baseline justify-between py-2.5">
            <div><span className="text-white">{grams(p.weight)}</span><span className="ml-2 text-xs text-gray-500">lasts {LASTS[p.product_id]}*</span></div>
            <span className="text-[#E9CF8A]">₹{Number(p.price).toLocaleString('en-IN')} <span className="text-xs text-gray-500">+ 5% GST</span></span>
          </div>)}
        </div>
        <p className="mt-2 text-xs text-gray-500">*For a household having about 3 cups a day.</p>
        <p className="mt-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[.06] px-4 py-3 text-[#E9CF8A]">New here? Your first order of home packs gets <b>10% off</b> when you order through Brew.</p>
        <p className="mt-3 text-gray-400">For cafés, offices and shops: ₹420 per kg plus GST, minimum order 2 kg, with a proper GST invoice. Ask Brew about a free sample.</p>
      </Section>

      <Section title="Delivery">
        <ul className="space-y-1.5 text-gray-300 list-disc pl-5">
          <li>We deliver within Bangalore.</li>
          <li>Free delivery in our neighbourhood (PIN 560077, from Golden Palms to Kristu Jayanti College).</li>
          <li>Free for orders over 500 g within about 10 km, and over 750 g further away in Bangalore.</li>
          <li>Otherwise within about 10 km we deliver ourselves, ₹10 to ₹25 by distance; further away a delivery service carries it, at what it costs.</li>
          <li>You get a 4-digit delivery code; share it at the door so we know it reached you.</li>
        </ul>
      </Section>

      <Section title="How ordering with Brew works">
        <ol className="space-y-1.5 text-gray-300 list-decimal pl-5">
          <li>Tell Brew the pack and how many (for example "2 × 500 g").</li>
          <li>Tap <b>Add your details</b> once: name, email, address and PIN. He keeps them on file for next time.</li>
          <li>Pay securely through the Razorpay link he sends (UPI, card or netbanking).</li>
          <li>You get your order number by email, and can track it at estatetea.in/track.</li>
        </ol>
        <p className="mt-3 text-gray-400">Next time, just say "same as last time".</p>
      </Section>

      <Section title="A perfect cup">
        <p className="text-gray-300">About a heaped teaspoon per cup. Boil it with the water for 2 to 3 minutes until deep red-brown, add milk, bring back to a boil for a minute, sweeten to taste and strain. Ginger, cardamom or tulsi go in with the water.</p>
      </Section>
    </main>
    <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur px-4 py-3">
      <a href={WA} className="mx-auto flex max-w-2xl items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-[15px] font-semibold text-black">
        <svg viewBox="0 0 32 32" className="w-5 h-5" fill="currentColor"><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm6.4 18.3c-.3.8-1.6 1.5-2.2 1.6-.6.1-1.3.1-2.1-.1-.5-.2-1.1-.4-1.9-.7-3.3-1.4-5.4-4.8-5.6-5-.2-.2-1.3-1.8-1.3-3.4s.8-2.4 1.1-2.8c.3-.3.7-.4.9-.4h.7c.2 0 .5 0 .8.6.3.7 1 2.4 1.1 2.6.1.2.1.4 0 .6-.1.2-.2.4-.4.6l-.5.6c-.2.2-.4.4-.2.8.2.4 1 1.6 2.1 2.6 1.4 1.3 2.6 1.7 3 1.9.4.2.6.2.8-.1.2-.3.9-1.1 1.2-1.4.2-.4.5-.3.8-.2.3.1 2.1 1 2.5 1.2.4.2.6.3.7.4.1.2.1.9-.2 1.7z"/></svg>
        Back to chat with Brew</a>
    </div>
  </div>;
}
