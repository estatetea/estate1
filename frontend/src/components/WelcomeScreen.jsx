import { useEffect, useState } from "react";
import { Snowfall, FairyLights, Holly, Stars, festive } from "./Festive";

// Three hanging baubles on thin gold threads, swaying gently (Christmas only).
function Baubles() {
  const hang = [
    { left: "16%", len: 120, color: "#c8202f", size: 30, delay: "0s" },
    { left: "30%", len: 70, color: "#d4af37", size: 22, delay: ".6s" },
    { left: "70%", len: 95, color: "#1f8a4e", size: 26, delay: ".3s" },
    { left: "84%", len: 140, color: "#c8202f", size: 24, delay: ".9s" },
  ];
  return <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0">
    {hang.map((b, i) => <div key={i} className="et-bauble absolute top-0" style={{ left: b.left, animationDelay: b.delay }}>
      <div className="mx-auto w-px bg-gradient-to-b from-[#d4af37]/10 to-[#d4af37]/70" style={{ height: b.len }} />
      <svg viewBox="0 0 40 46" style={{ width: b.size, height: b.size * 1.15 }} className="-mt-1 block">
        <rect x="15" y="0" width="10" height="7" rx="1.5" fill="#d4af37" />
        <circle cx="20" cy="26" r="18" fill={b.color} />
        <path d="M4 24 Q20 30 36 24" stroke="#f3e3c0" strokeWidth="1.4" fill="none" opacity=".55" />
        <ellipse cx="13" cy="19" rx="4" ry="6" fill="#fff" opacity=".28" />
      </svg>
    </div>)}
  </div>;
}

const WelcomeScreen = ({ userName, onComplete }) => {
  const [opacity, setOpacity] = useState(0);
  const xmas = festive();

  useEffect(() => {
    // Fade in - slower and smoother
    const fadeIn = setTimeout(() => setOpacity(1), 200);

    // Keep visible for 2.5 seconds after fade in completes
    const startFadeOut = setTimeout(() => setOpacity(0), 2700);

    // Complete transition and move to store
    const complete = setTimeout(() => onComplete(), 3800);

    return () => {
      clearTimeout(fadeIn);
      clearTimeout(startFadeOut);
      clearTimeout(complete);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50 overflow-hidden">
      {xmas && <>
        {/* The same Christmas as the rest of the site: the red and green glow, stars, snow, lights, and baubles above the welcome */}
        <div aria-hidden="true" className="et-glow pointer-events-none absolute inset-0" />
        <Stars />
        <Snowfall />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[47]"><FairyLights /></div>
        <Baubles />
      </>}
      <div
        className="relative z-[46] text-center px-6"
        style={{
          opacity: opacity,
          transition: 'opacity 1s ease-in-out',
        }}
      >
        {xmas && <div className="mb-5 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#d4af37]/70" />
          <svg viewBox="0 0 20 20" className="h-5 w-5 et-star"><path d="M10 0 C10.8 7.2 12.8 9.2 20 10 C12.8 10.8 10.8 12.8 10 20 C9.2 12.8 7.2 10.8 0 10 C7.2 9.2 9.2 7.2 10 0Z" fill="#f3d88f" /></svg>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#d4af37]/70" />
        </div>}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-tight gold-text mb-6 fade-up">
          Welcome
        </h1>
        <p
          className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-wide"
          data-testid="welcome-username"
        >
          {userName}
        </p>
        {xmas && <div className="mt-8 flex flex-col items-center gap-3">
          <Holly className="h-8 w-11" />
          <p className="text-[11px] uppercase tracking-[.45em] text-[#e9cf8a]/90">Merry Christmas</p>
        </div>}
      </div>
    </div>
  );
};

export default WelcomeScreen;
