'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

// The Christmas season on the website (the owner, 25 Nov: promote the collection for the next 1.5 months; classy, warm,
// minimal). Everything here switches itself off after Twelfth Night.
export const SEASON_END = '2027-01-06';
export const festive = () => { try { return new Date() <= new Date(SEASON_END + 'T23:59:59+05:30'); } catch { return false; } };

// A few slow, soft snowflakes drifting down the page. Never in the way (no clicks), and none for people who turn motion off.
export function Snowfall({ count = 26 }) {
  const [flakes, setFlakes] = useState([]);
  useEffect(() => {
    if (!festive()) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const n = window.innerWidth < 640 ? Math.round(count * 0.6) : count;
    setFlakes(Array.from({ length: n }, (_, i) => ({
      i, left: Math.random() * 100, size: 2 + Math.random() * 3.5, dur: 14 + Math.random() * 16, delay: -Math.random() * 30,
      drift: (Math.random() * 40 - 20).toFixed(0), op: (0.25 + Math.random() * 0.45).toFixed(2),
    })));
  }, [count]);
  if (!flakes.length) return null;
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[45] overflow-hidden">
    {flakes.map(f => <span key={f.i} className="et-flake" style={{ left: `${f.left}%`, width: f.size, height: f.size, opacity: f.op,
      animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`, '--drift': `${f.drift}px` }} />)}
  </div>;
}

// A thin string of warm fairy lights, gently twinkling (under the header).
export function FairyLights({ className = '' }) {
  if (!festive()) return null;
  const bulbs = 36;
  return <div aria-hidden="true" className={`et-lights pointer-events-none ${className}`}>
    <svg className="et-wire" viewBox="0 0 1000 14" preserveAspectRatio="none"><path d="M0 2 Q 13.9 12 27.8 2 T 55.6 2 T 83.3 2 T 111 2 T 139 2 T 167 2 T 194 2 T 222 2 T 250 2 T 278 2 T 306 2 T 333 2 T 361 2 T 389 2 T 417 2 T 444 2 T 472 2 T 500 2 T 528 2 T 556 2 T 583 2 T 611 2 T 639 2 T 667 2 T 694 2 T 722 2 T 750 2 T 778 2 T 806 2 T 833 2 T 861 2 T 889 2 T 917 2 T 944 2 T 972 2 T 1000 2" /></svg>
    <div className="et-bulbs">{Array.from({ length: bulbs }, (_, i) => <span key={i} style={{ animationDelay: `${(i * 0.37) % 3}s` }} />)}</div>
  </div>;
}

// A small, elegant Christmas tree (gold line art with a star).
export function Tree({ className = 'w-6 h-6' }) {
  return <svg viewBox="0 0 32 40" className={className} aria-hidden="true" fill="none">
    <path d="M16 3.5l1.1 2.3 2.5.3-1.8 1.7.5 2.5L16 9.1l-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill="#f3d88f" className="et-star" />
    <path d="M16 11l-6 8h3.5L8 27h4.5L6 35h20l-6.5-8H24l-5.5-8H22z" stroke="#D4AF37" strokeWidth="1.3" strokeLinejoin="round" fill="rgba(212,175,55,.08)" />
    <path d="M14.5 35v3.5h3V35" stroke="#D4AF37" strokeWidth="1.3" />
    <circle cx="13" cy="22" r=".9" fill="#f3d88f" /><circle cx="19" cy="25" r=".9" fill="#f3d88f" /><circle cx="12" cy="31" r=".9" fill="#f3d88f" /><circle cx="20" cy="31.5" r=".9" fill="#f3d88f" />
  </svg>;
}

const inr = n => { const v = Number(n || 0); return Number.isInteger(v) ? `₹${v.toLocaleString('en-IN')}` : `₹${v.toFixed(2)}`; };
const WHAT = { 'christmas-spirit': 'Wine infused tea', 'christmas-cookies': 'Chocolate chip cookies', 'plum-cake': 'Christmas plum cake' };

// The Christmas Collection at the top of the shop: the three items with their photos and prices, one tap to order.
export function ChristmasBanner({ navigate }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    if (!festive()) return;
    fetch('/api/collection', { cache: 'no-store' }).then(r => r.json()).then(s => setItems(s?.collection?.public ? (s.items || []) : [])).catch(() => setItems([]));
  }, []);
  if (!festive() || !items?.length) return null;
  return <section aria-label="The Christmas Collection" className="et-xmas relative mb-8 sm:mb-12 overflow-hidden rounded-2xl border border-[#D4AF37]/25 fade-up">
    <div className="relative z-10 px-5 pt-6 pb-5 sm:px-10 sm:pt-9 sm:pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[.4em] text-[#D4AF37]">Now open · until Christmas</p>
          <h2 className="mt-2 font-light text-3xl sm:text-5xl text-[#f5ead5]">The Christmas <em className="not-italic gold-text">Collection</em></h2>
          <p className="mt-2 max-w-md text-sm text-gray-400">Made in small batches for the season. Order as many as you like, delivered in 3 to 5 days.</p>
        </div>
        <Tree className="hidden sm:block w-14 h-[70px] shrink-0 mt-1" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-5">
        {items.map(it => <button key={it.product_id} type="button" onClick={() => navigate('collection')}
          className="group text-left rounded-xl overflow-hidden border border-white/10 bg-black/30 hover:border-[#D4AF37]/50 transition-colors">
          <div className="aspect-[4/5] sm:aspect-[4/3] overflow-hidden bg-black">
            {it.image ? <img src={it.image} alt={it.label} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : null}
          </div>
          <div className="p-2.5 sm:p-4">
            <p className="text-[12px] sm:text-base text-gray-100 leading-tight">{it.name}</p>
            <p className="hidden sm:block mt-0.5 text-xs italic text-gray-500">{WHAT[it.product_id] || it.size}</p>
            <p className="mt-1 text-[12px] sm:text-sm gold-text">{inr(it.price)}{it.sold_out ? <span className="ml-1.5 text-[10px] text-gray-500 not-italic">· sold out</span> : null}</p>
          </div>
        </button>)}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => navigate('collection')} data-testid="xmas-banner-shop"
          className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] hover:bg-[#c5a030] px-5 py-3 text-sm uppercase tracking-[.2em] text-black transition-colors">
          Shop the collection <ArrowRight className="w-4 h-4" /></button>
        <a href="https://wa.me/919742668951?text=Hi%20Brew%21%20Christmas%20Collection" target="_blank" rel="noreferrer"
          className="text-sm text-gray-400 hover:text-[#D4AF37] underline-offset-4 hover:underline">or order on WhatsApp</a>
        <span className="text-[11px] text-gray-500">Prices include GST · delivery added like our tea</span>
      </div>
    </div>
  </section>;
}

// One line for the welcome screen, before they've entered the shop.
export function ChristmasRibbon() {
  if (!festive()) return null;
  return <a href="/christmas" data-testid="xmas-ribbon"
    className="group mb-5 flex items-center justify-center gap-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[.06] px-4 py-3 text-sm text-[#f0d58b] hover:bg-[#D4AF37]/[.12] transition-colors">
    <Tree className="w-4 h-5 shrink-0" /><span>Our <b className="font-normal text-[#f5ead5]">Christmas Collection</b> is here</span>
    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
  </a>;
}

// Snow on every customer page of the website (the welcome, the shop, the collection, the order and tracking pages), never
// on the owner's and team's apps. Placed once in the root layout.
const NO_SNOW = ['/ai', '/team', '/admin', '/owner-invoice'];
export function SeasonalSnow() {
  const path = usePathname() || '/';
  const [hash, setHash] = useState('');
  useEffect(() => { const f = () => setHash(window.location.hash || ''); f(); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  if (NO_SNOW.some(p => path === p || path.startsWith(p + '/')) || /^#(admin|ai)\b/.test(hash)) return null;
  return <Snowfall />;
}
