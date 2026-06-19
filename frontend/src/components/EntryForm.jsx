import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const VIDEO_URL = "https://customer-assets.emergentagent.com/job_tea-estate-store/artifacts/z2zc6gmx_opening%20page.mp4";
const LOGO_URL = "https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png";

const EntryForm = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [phase, setPhase] = useState("logo"); // logo → ready → video → blackout → form
  const [logoVisible, setLogoVisible] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [pourGrains, setPourGrains] = useState(false);
  const [settleGrains, setSettleGrains] = useState(false);
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
        setTimeout(() => triggerBlackout(), 3000);
      });
    }
  };

  const triggerBlackout = useCallback(() => {
    if (transitioned.current) return;
    transitioned.current = true;
    // Video fades out → black screen with pour grains
    setPhase("blackout");
    setPourGrains(true);
    // After grains fall on black for a moment, fade the form in
    setTimeout(() => {
      setPhase("form");
      setSettleGrains(true);
      setTimeout(() => setFormVisible(true), 300);
    }, 1800);
    // Pour grains fade out
    setTimeout(() => setPourGrains(false), 5000);
    // Settle grains linger longer then fade
    setTimeout(() => setSettleGrains(false), 6500);
  }, []);

  const handleVideoEnded = useCallback(() => {
    triggerBlackout();
  }, [triggerBlackout]);

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
    <div className="relative w-full h-screen h-[100dvh] overflow-hidden bg-[#0a0a0a]" data-testid="entry-wrapper">

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes pourFall {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          30% { opacity: 0.9; }
          70% { opacity: 0.6; }
          100% { transform: translateY(105vh) translateX(var(--drift)) rotate(var(--spin)); opacity: 0; }
        }
        @keyframes pourFade {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 0; }
        }
        @keyframes settleFall {
          0% { transform: translateY(0) translateX(0); opacity: 0.7; }
          50% { opacity: 0.4; }
          100% { transform: translateY(70vh) translateX(var(--drift)); opacity: 0; }
        }
        @keyframes settleFade {
          0% { opacity: 1; }
          40% { opacity: 0.7; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* ── Pour grains: concentrated stream from center-right, matching video ── */}
      {pourGrains && (
        <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden"
          style={{ animation: 'pourFade 4.5s ease-out 0.5s forwards' }}
        >
          {Array.from({ length: 80 }).map((_, i) => {
            // Concentrated around center (45-60%), matching the pouch pour location
            const x = 42 + Math.random() * 20;
            const delay = Math.random() * 1.5;
            const size = 1.5 + Math.random() * 3;
            // Tight drift — grains fall mostly straight like a pour stream
            const drift = (Math.random() - 0.5) * 18;
            const duration = 1.6 + Math.random() * 1.2;
            const spin = 120 + Math.random() * 240;
            return (
              <div
                key={`p-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${x}%`,
                  top: '-4px',
                  width: `${size}px`,
                  height: `${size}px`,
                  background: `hsl(${25 + Math.random() * 15}, ${40 + Math.random() * 30}%, ${8 + Math.random() * 18}%)`,
                  animation: `pourFall ${duration}s ease-in ${delay}s forwards`,
                  '--drift': `${drift}px`,
                  '--spin': `${spin}deg`,
                }}
              />
            );
          })}
          {/* Wider scatter — a few grains that drift outward from the stream */}
          {Array.from({ length: 25 }).map((_, i) => {
            const x = 30 + Math.random() * 40;
            const delay = 0.3 + Math.random() * 1.8;
            const size = 1 + Math.random() * 2;
            const drift = (Math.random() - 0.5) * 50;
            const duration = 2.2 + Math.random() * 1.5;
            const spin = Math.random() * 360;
            return (
              <div
                key={`ps-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${x}%`,
                  top: '-4px',
                  width: `${size}px`,
                  height: `${size}px`,
                  background: `hsl(${28 + Math.random() * 12}, ${35 + Math.random() * 20}%, ${12 + Math.random() * 15}%)`,
                  animation: `pourFall ${duration}s ease-in ${delay}s forwards`,
                  '--drift': `${drift}px`,
                  '--spin': `${spin}deg`,
                  opacity: 0.6,
                }}
              />
            );
          })}
        </div>
      )}

      {/* ── Settle grains: lighter, slower, on the form page ── */}
      {settleGrains && (
        <div className="fixed inset-0 z-[150] pointer-events-none overflow-hidden"
          style={{ animation: 'settleFade 4s ease-out 1s forwards' }}
        >
          {Array.from({ length: 18 }).map((_, i) => {
            const x = 25 + Math.random() * 50;
            const delay = Math.random() * 2;
            const size = 1 + Math.random() * 2;
            const drift = (Math.random() - 0.5) * 25;
            const duration = 3 + Math.random() * 2.5;
            return (
              <div
                key={`s-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${x}%`,
                  top: '-4px',
                  width: `${size}px`,
                  height: `${size}px`,
                  background: `hsl(${30 + Math.random() * 10}, ${30 + Math.random() * 25}%, ${14 + Math.random() * 14}%)`,
                  animation: `settleFall ${duration}s ease-out ${delay}s forwards`,
                  '--drift': `${drift}px`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* ── Video layer ── */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: showVideo ? 1 : 0,
          transition: 'opacity 1.2s ease-out',
        }}
        src={VIDEO_URL}
        preload="auto"
        muted
        playsInline
        onEnded={handleVideoEnded}
        data-testid="hero-video"
      />
      {/* Subtle overlay on video */}
      <div
        className="absolute inset-0 bg-black/15"
        style={{ opacity: showVideo ? 1 : 0, transition: 'opacity 1.2s' }}
      />

      {/* ── Logo (during logo phase) ── */}
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

      {/* ── "Get Started" button (during ready phase) ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-end pb-16 sm:pb-24 z-20"
        data-testid="hero-section"
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

      {/* ── Form (fades in over black + grains) ── */}
      <div
        className="absolute inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        style={{
          opacity: formVisible ? 1 : 0,
          transition: 'opacity 1.5s ease-in',
          pointerEvents: (phase === "form") ? 'auto' : 'none',
        }}
        data-testid="form-section"
      >
        {/* Subtle background texture behind form */}
        <div className="absolute inset-0 hero-bg" style={{
          opacity: formVisible ? 1 : 0,
          transition: 'opacity 2s ease-in',
        }} />

        <div
          className="rounded-2xl p-5 sm:p-8 md:p-12 max-w-lg w-full border border-white/10 relative z-10"
          style={{
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            opacity: formVisible ? 1 : 0,
            transform: formVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1.2s ease 0.3s, transform 1.2s ease 0.3s',
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
      </div>
    </div>
  );
};

export default EntryForm;
