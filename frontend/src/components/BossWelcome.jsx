'use client';
import { Crown, Gift, LayoutDashboard, MessageCircle } from 'lucide-react';

// The boss, signed in with his own WhatsApp number: a proper welcome at the top of the page, with his shortcuts.
const partOfDay = () => {
  const h = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()));
  return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function BossWelcome({ navigate }) {
  const btn = 'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm transition-colors touch-manipulation';
  return <section aria-label="Welcome back, boss" data-testid="boss-welcome"
    className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#1d170c] via-[#110f0b] to-[#0a0a0a] px-6 py-10 sm:px-12 sm:py-14 mb-8 sm:mb-12 fade-up">
    <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
    <p className="flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-[.3em] text-[#D4AF37]"><Crown className="h-4 w-4" />{partOfDay()}</p>
    <h1 className="mt-3 font-light text-4xl sm:text-6xl leading-tight text-[#f3e7c4]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Welcome back, boss</h1>
    <p className="mt-3 max-w-xl text-sm sm:text-base text-gray-400">This is the website exactly as your customers see it. Aegis is a tap away whenever you need him.</p>
    <div className="mt-7 flex flex-wrap gap-3">
      <button type="button" onClick={() => window.dispatchEvent(new Event('estate:open-aegis'))} className={`${btn} bg-[#D4AF37] text-black hover:bg-[#e2c35a]`}><MessageCircle className="h-4 w-4" />Ask Aegis</button>
      <button type="button" onClick={() => navigate('collection')} className={`${btn} border border-[#D4AF37]/35 text-[#E9CF8A] hover:bg-[#D4AF37]/[.08]`}><Gift className="h-4 w-4" />Christmas collection</button>
      <button type="button" onClick={() => { window.location.assign('/#ai'); window.location.reload(); }} className={`${btn} border border-white/15 text-gray-300 hover:border-[#D4AF37]/35`}><LayoutDashboard className="h-4 w-4" />Owner web app</button>
    </div>
  </section>;
}
