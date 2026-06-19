import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const VIDEO_URL = "https://customer-assets.emergentagent.com/job_tea-estate-store/artifacts/z2zc6gmx_opening%20page.mp4";
const LOGO_URL = "https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png";

const EntryForm = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [phase, setPhase] = useState("logo"); // logo → ready → video → descending → abyss → arriving → form
  const [logoVisible, setLogoVisible] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [translateY, setTranslateY] = useState("0");
  const [transitionDuration, setTransitionDuration] = useState("0s");
  const [streamActive, setStreamActive] = useState(false);
  const [wispsActive, setWispsActive] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const locationAttempted = useRef(false);
  const videoRef = useRef(null);
  const transitioned = useRef(false);

  // Phase 1: Logo fades in/out
  useEffect(() => {
    const t1 = setTimeout(() => setLogoVisible(true), 200);
    const t2 = setTimeout(() => setLogoVisible(false), 1900);
    const t3 = setTimeout(() => setPhase("ready"), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Preload video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLoaded = () => setVideoReady(true);
    video.addEventListener("loadeddata", onLoaded);
    video.load();
    return () => video.removeEventListener("loadeddata", onLoaded);
  }, []);

  const handleGetStarted = () => {
    setPhase("video");
    if (!locationAttempted.current) {
      locationAttempted.current = true;
      handleGetLocation();
    }
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        setTimeout(() => triggerDescent(), 3000);
      });
    }
  };

  const triggerDescent = useCallback(() => {
    if (transitioned.current) return;
    transitioned.current = true;

    // Stage 1: Descend from video into the abyss
    setPhase("descending");
    setStreamActive(true);
    setTransitionDuration("2.2s");
    setTranslateY("-100vh");

    // Stage 2: Arrived at abyss — hold while grains fall
    setTimeout(() => {
      setPhase("abyss");
    }, 2200);

    // Stage 3: Descend from abyss into the form
    setTimeout(() => {
      setPhase("arriving");
      setWispsActive(true);
      setTransitionDuration("2.8s");
      setTranslateY("-200vh");
    }, 4500);

    // Stage 4: Arrived at form — fade it in
    setTimeout(() => {
      setPhase("form");
      setStreamActive(false);
      setTimeout(() => setFormVisible(true), 200);
    }, 7000);

    // Wisps linger then fade
    setTimeout(() => setWispsActive(false), 10000);
  }, []);

  const handleVideoEnded = useCallback(() => {
    triggerDescent();
  }, [triggerDescent]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const revResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`
          );
          const revData = await revResponse.json();
          const city = revData?.address?.city || revData?.address?.town || revData?.address?.village || revData?.address?.state_district || "Your Location";
          setDetectedLocation({ name: city, latitude, longitude });
          toast.success(`Location detected: ${city}`);
        } catch {
          setDetectedLocation({ name: "Your Location", latitude, longitude });
        } finally {
          setIsLocating(false);
        }
      },
      () => { setIsLocating(false); },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    onSubmit({
      name: name.trim(),
      place: detectedLocation ? detectedLocation.name : null,
      latitude: detectedLocation ? detectedLocation.latitude : null,
      longitude: detectedLocation ? detectedLocation.longitude : null
    });
  };

  const showVideo = (phase === "ready" || phase === "video") && videoReady;

  return (
    <div className="overflow-hidden h-screen h-[100dvh] bg-[#0C0B0A]" data-testid="entry-wrapper">

      <style>{`
        @keyframes streamPour {
          0% { transform: translateY(0) translateX(0); opacity: 1; }
          40% { opacity: 1; }
          75% { opacity: 0.8; }
          100% { transform: translateY(100vh) translateX(var(--drift)); opacity: 0.1; }
        }
        @keyframes streamDust {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.9; }
          50% { opacity: 0.6; }
          100% { transform: translateY(100vh) translateX(var(--drift)) rotate(var(--spin)); opacity: 0; }
        }
        @keyframes streamContainerFade {
          0% { opacity: 1; }
          60% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes wispDrift {
          0% { transform: translateY(0) translateX(0); opacity: 0.4; }
          60% { opacity: 0.15; }
          100% { transform: translateY(50vh) translateX(var(--drift)); opacity: 0; }
        }
        @keyframes wispContainerFade {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* ═══ Grain stream — thick, visible, matching video colors ═══ */}
      {streamActive && (
        <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden"
          style={{ animation: 'streamContainerFade 6s ease-out 1s forwards' }}
        >
          {/* Core stream: dense thick column at 30-38% from left */}
          {Array.from({ length: 100 }).map((_, i) => {
            const teaColors = ['#2A1F17','#31241B','#35281E','#3C2C22','#3E2E22','#4B3B2F','#3E2E22','#35281E'];
            const highlightColors = ['#6A4C2C','#7A5C34','#5A3F25'];
            const isHighlight = Math.random() < 0.15;
            const color = isHighlight
              ? highlightColors[Math.floor(Math.random() * highlightColors.length)]
              : teaColors[Math.floor(Math.random() * teaColors.length)];
            const x = 31 + Math.random() * 7;
            const delay = Math.random() * 2.5;
            const size = 3 + Math.random() * 5;
            const h = size * (0.6 + Math.random() * 0.8);
            const drift = -14 + Math.random() * 12;
            const duration = 1.2 + Math.random() * 0.8;
            return (
              <div
                key={`c-${i}`}
                className="absolute"
                style={{
                  left: `${x}%`,
                  top: '-4px',
                  width: `${size}px`,
                  height: `${h}px`,
                  borderRadius: '40%',
                  background: color,
                  animation: `streamPour ${duration}s ease-in ${delay}s forwards`,
                  '--drift': `${drift}px`,
                }}
              />
            );
          })}
          {/* Scatter: grains that break away from the main column */}
          {Array.from({ length: 50 }).map((_, i) => {
            const teaColors = ['#2A1F17','#35281E','#3C2C22','#4B3B2F','#31241B'];
            const color = teaColors[Math.floor(Math.random() * teaColors.length)];
            const x = 26 + Math.random() * 18;
            const delay = 0.2 + Math.random() * 3;
            const size = 2 + Math.random() * 4;
            const drift = -35 + Math.random() * 40;
            const duration = 1.8 + Math.random() * 1.5;
            const spin = (Math.random() - 0.5) * 200;
            return (
              <div
                key={`sc-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${x}%`,
                  top: '-4px',
                  width: `${size}px`,
                  height: `${size}px`,
                  background: color,
                  animation: `streamDust ${duration}s ease-in ${delay}s forwards`,
                  '--drift': `${drift}px`,
                  '--spin': `${spin}deg`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* ═══ Wisps: last particles dissolving ═══ */}
      {wispsActive && (
        <div className="fixed inset-0 z-[150] pointer-events-none overflow-hidden"
          style={{ animation: 'wispContainerFade 5s ease-out 2s forwards' }}
        >
          {Array.from({ length: 14 }).map((_, i) => {
            const teaColors = ['#2A1F17','#35281E','#3C2C22','#4B3B2F'];
            const color = teaColors[Math.floor(Math.random() * teaColors.length)];
            const x = 28 + Math.random() * 18;
            const delay = Math.random() * 4;
            const size = 2 + Math.random() * 3;
            const drift = -20 + Math.random() * 25;
            const duration = 5 + Math.random() * 4;
            return (
              <div
                key={`w-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${x}%`,
                  top: '-2px',
                  width: `${size}px`,
                  height: `${size}px`,
                  background: color,
                  animation: `wispDrift ${duration}s ease-out ${delay}s forwards`,
                  '--drift': `${drift}px`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* ═══ Elevator container — 3 stacked full-screen sections ═══ */}
      <div
        className="will-change-transform"
        style={{
          transform: `translateY(${translateY})`,
          transition: `transform ${transitionDuration} cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        {/* ── Section 1: Hero (video + logo + button) ── */}
        <div className="h-screen h-[100dvh] bg-[#0C0B0A] relative overflow-hidden" data-testid="hero-section">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: showVideo ? 1 : 0,
              transition: 'opacity 0.8s ease-out',
            }}
            src={VIDEO_URL}
            preload="auto"
            muted
            playsInline
            onEnded={handleVideoEnded}
            data-testid="hero-video"
          />

          {/* Logo */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <img
              src={LOGO_URL}
              alt="Estate Tea Logo"
              className="w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 logo-sharp"
              style={{
                opacity: phase === "logo" && logoVisible ? 1 : 0,
                transition: 'opacity 1.5s ease-in-out',
              }}
            />
          </div>

          {/* Button */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-end pb-16 sm:pb-24 z-20"
            style={{
              opacity: phase === "ready" ? 1 : 0,
              transform: phase === "ready" ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s ease, transform 0.8s ease',
              pointerEvents: phase === "ready" ? 'auto' : 'none',
            }}
          >
            <button
              onClick={handleGetStarted}
              className="px-8 sm:px-10 py-3 sm:py-4 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black uppercase tracking-[0.3em] text-xs sm:text-sm font-light rounded-lg transition-all duration-300 touch-manipulation backdrop-blur-sm bg-black/20"
              data-testid="get-started-button"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* ── Section 2: The Abyss (pure black void) ── */}
        <div className="h-screen h-[100dvh] bg-[#0C0B0A] relative" data-testid="abyss-section" />

        {/* ── Section 3: Login Form ── */}
        <section
          className="hero-bg min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 relative"
          data-testid="form-section"
        >
          <div
            className="rounded-2xl p-5 sm:p-8 md:p-12 max-w-lg w-full border border-white/10 relative z-10"
            style={{
              background: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              opacity: formVisible ? 1 : 0,
              transform: formVisible ? 'translateY(0)' : 'translateY(15px)',
              transition: 'opacity 1.5s ease 0.3s, transform 1.5s ease 0.3s',
            }}
          >
            <div className="flex flex-col items-center mb-6 sm:mb-12">
              <img src={LOGO_URL} alt="Estate Tea Logo" className="w-16 h-16 sm:w-24 sm:h-24 mb-3 sm:mb-6 logo-sharp" />
              <h2 className="text-2xl sm:text-4xl font-light tracking-tight text-[#D4AF37] drop-shadow-[0_0_12px_rgba(212,175,55,0.3)]">Welcome</h2>
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-300 mt-2 sm:mt-4 text-center">Premium Tea Experience</p>
            </div>

            <form className="space-y-5 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm uppercase tracking-widest text-gray-200">Your Name</Label>
                <Input
                  id="name"
                  data-testid="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-black/60 border-white/20 text-white placeholder-gray-400 focus:border-[#D4AF37] h-11 sm:h-12 text-base touch-manipulation"
                />
              </div>

              {isLocating && (
                <div className="flex items-center gap-3 px-4 py-3 bg-black/30 border border-white/10 rounded-lg" data-testid="location-detecting">
                  <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                  <span className="text-sm text-gray-400">Detecting your location...</span>
                </div>
              )}
              {detectedLocation && !isLocating && (
                <div className="flex items-center gap-2 px-4 py-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg" data-testid="location-detected">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                  <span className="text-sm text-[#D4AF37]">{detectedLocation.name}</span>
                </div>
              )}

              <button
                type="button"
                data-testid="entry-submit-button"
                onClick={handleSubmit}
                className="w-full bg-[#D4AF37] hover:bg-[#c5a030] active:bg-[#b89528] text-black font-light uppercase tracking-[0.2em] py-3.5 sm:py-4 rounded-lg transition-colors mt-6 sm:mt-8 text-sm sm:text-base touch-manipulation"
              >
                Enter Store
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EntryForm;
