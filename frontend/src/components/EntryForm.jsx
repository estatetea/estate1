import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const VIDEO_URL = "https://customer-assets.emergentagent.com/job_tea-estate-store/artifacts/z2zc6gmx_opening%20page.mp4";
const LOGO_URL = "https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png";

const EntryForm = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [phase, setPhase] = useState("logo"); // logo → ready → video → abyss → form
  const [logoVisible, setLogoVisible] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [wispsActive, setWispsActive] = useState(false);
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
        setTimeout(() => triggerAbyss(), 3000);
      });
    }
  };

  const triggerAbyss = useCallback(() => {
    if (transitioned.current) return;
    transitioned.current = true;
    // Immediate: video fades to black, stream continues
    setPhase("abyss");
    setStreamActive(true);
    // Stream pours into the void for a while, then thins out
    // At ~3s: stream fades, last wisps remain
    setTimeout(() => setWispsActive(true), 2200);
    setTimeout(() => setStreamActive(false), 3800);
    // At ~3.5s: form starts emerging from the darkness
    setTimeout(() => {
      setPhase("form");
      setTimeout(() => setFormVisible(true), 200);
    }, 3500);
    // Wisps linger over the form, then dissolve
    setTimeout(() => setWispsActive(false), 7000);
  }, []);

  const handleVideoEnded = useCallback(() => {
    triggerAbyss();
  }, [triggerAbyss]);

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
    <div className="relative w-full h-screen h-[100dvh] overflow-hidden bg-[#050403]" data-testid="entry-wrapper">

      <style>{`
        @keyframes streamCore {
          0% { transform: translateY(0) translateX(0); opacity: 1; }
          15% { opacity: 1; }
          85% { opacity: 0.7; }
          100% { transform: translateY(110vh) translateX(var(--drift)); opacity: 0; }
        }
        @keyframes streamScatter {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.8; }
          40% { opacity: 0.5; }
          100% { transform: translateY(110vh) translateX(var(--drift)) rotate(var(--spin)); opacity: 0; }
        }
        @keyframes streamFade {
          0% { opacity: 1; }
          70% { opacity: 0.6; }
          100% { opacity: 0; }
        }
        @keyframes wispFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0.5; }
          60% { opacity: 0.25; }
          100% { transform: translateY(60vh) translateX(var(--drift)); opacity: 0; }
        }
        @keyframes wispFade {
          0% { opacity: 1; }
          40% { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* ═══ STREAM: Tight center pour continuing from video ═══ */}
      {streamActive && (
        <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden"
          style={{ animation: 'streamFade 3.5s ease-out 0.3s forwards' }}
        >
          {/* Core stream — very tight, dead center, matches video pour */}
          {Array.from({ length: 70 }).map((_, i) => {
            // Dead center: 48-52% — the packet opening
            const x = 48 + Math.random() * 4;
            const delay = Math.random() * 0.8;
            const size = 1 + Math.random() * 2.5;
            const drift = (Math.random() - 0.5) * 8;
            const duration = 1.3 + Math.random() * 0.8;
            return (
              <div
                key={`c-${i}`}
                className="absolute"
                style={{
                  left: `${x}%`,
                  top: '-2px',
                  width: `${size}px`,
                  height: `${size * (0.8 + Math.random() * 0.6)}px`,
                  borderRadius: '50%',
                  background: `hsl(${22 + Math.random() * 8}, ${25 + Math.random() * 20}%, ${4 + Math.random() * 10}%)`,
                  animation: `streamCore ${duration}s ease-in ${delay}s forwards`,
                  '--drift': `${drift}px`,
                }}
              />
            );
          })}
          {/* Inner scatter — grains that bounce off the main stream */}
          {Array.from({ length: 45 }).map((_, i) => {
            const x = 45 + Math.random() * 10;
            const delay = 0.1 + Math.random() * 1.2;
            const size = 1 + Math.random() * 2;
            const drift = (Math.random() - 0.5) * 25;
            const duration = 1.5 + Math.random() * 1.2;
            const spin = (Math.random() - 0.5) * 300;
            return (
              <div
                key={`is-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${x}%`,
                  top: '-2px',
                  width: `${size}px`,
                  height: `${size}px`,
                  background: `hsl(${20 + Math.random() * 10}, ${20 + Math.random() * 25}%, ${6 + Math.random() * 12}%)`,
                  animation: `streamScatter ${duration}s ease-in ${delay}s forwards`,
                  '--drift': `${drift}px`,
                  '--spin': `${spin}deg`,
                }}
              />
            );
          })}
          {/* Outer dust — fine particles that float outward */}
          {Array.from({ length: 20 }).map((_, i) => {
            const x = 40 + Math.random() * 20;
            const delay = 0.4 + Math.random() * 2;
            const size = 0.8 + Math.random() * 1.5;
            const drift = (Math.random() - 0.5) * 60;
            const duration = 2.5 + Math.random() * 1.5;
            const spin = Math.random() * 360;
            return (
              <div
                key={`od-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${x}%`,
                  top: '-2px',
                  width: `${size}px`,
                  height: `${size}px`,
                  background: `hsl(${25 + Math.random() * 8}, ${15 + Math.random() * 20}%, ${8 + Math.random() * 10}%)`,
                  animation: `streamScatter ${duration}s ease-in ${delay}s forwards`,
                  '--drift': `${drift}px`,
                  '--spin': `${spin}deg`,
                  opacity: 0.4,
                }}
              />
            );
          })}
        </div>
      )}

      {/* ═══ WISPS: Last few grains dissolving in the abyss ═══ */}
      {wispsActive && (
        <div className="fixed inset-0 z-[150] pointer-events-none overflow-hidden"
          style={{ animation: 'wispFade 4s ease-out 1.5s forwards' }}
        >
          {Array.from({ length: 12 }).map((_, i) => {
            const x = 43 + Math.random() * 14;
            const delay = Math.random() * 3;
            const size = 0.8 + Math.random() * 1.8;
            const drift = (Math.random() - 0.5) * 35;
            const duration = 4 + Math.random() * 3;
            return (
              <div
                key={`w-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${x}%`,
                  top: '-2px',
                  width: `${size}px`,
                  height: `${size}px`,
                  background: `hsl(${24 + Math.random() * 8}, ${18 + Math.random() * 15}%, ${6 + Math.random() * 10}%)`,
                  animation: `wispFloat ${duration}s ease-out ${delay}s forwards`,
                  '--drift': `${drift}px`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* ═══ Video layer ═══ */}
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

      {/* ═══ Logo ═══ */}
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

      {/* ═══ "Get Started" button ═══ */}
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

      {/* ═══ Form (emerges from the darkness) ═══ */}
      <div
        className="absolute inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        style={{
          opacity: formVisible ? 1 : 0,
          transition: 'opacity 1.8s ease-in',
          pointerEvents: phase === "form" ? 'auto' : 'none',
        }}
        data-testid="form-section"
      >
        <div className="absolute inset-0 hero-bg" style={{
          opacity: formVisible ? 1 : 0,
          transition: 'opacity 2.5s ease-in',
        }} />

        <div
          className="rounded-2xl p-5 sm:p-8 md:p-12 max-w-lg w-full border border-white/10 relative z-10"
          style={{
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            opacity: formVisible ? 1 : 0,
            transform: formVisible ? 'translateY(0)' : 'translateY(15px)',
            transition: 'opacity 1.5s ease 0.4s, transform 1.5s ease 0.4s',
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
