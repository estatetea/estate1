import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const VIDEO_URL = "https://customer-assets.emergentagent.com/job_tea-estate-store/artifacts/z2zc6gmx_opening%20page.mp4";
const LOGO_URL = "https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png";
const VIDEO_DURATION = 5.04;
const TRANSITION_START = 3.2; // seconds before end to start grain transition

const EntryForm = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [phase, setPhase] = useState("logo"); // logo → ready → video → transition → form
  const [logoVisible, setLogoVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [videoFading, setVideoFading] = useState(false);
  const [grainsActive, setGrainsActive] = useState(false);
  const [grainsFading, setGrainsFading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const locationAttempted = useRef(false);
  const videoRef = useRef(null);
  const transitionStarted = useRef(false);

  // Phase 1: Logo fades in then out → Phase 2: Ready with button
  useEffect(() => {
    const t1 = setTimeout(() => setLogoVisible(true), 300);
    const t2 = setTimeout(() => setLogoVisible(false), 2500);
    const t3 = setTimeout(() => {
      setPhase("ready");
      setButtonVisible(true);
    }, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Preload video on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  const handleGetStarted = () => {
    setPhase("video");
    setButtonVisible(false);
    // Start location detection during video
    if (!locationAttempted.current) {
      locationAttempted.current = true;
      handleGetLocation();
    }
    // Play the video
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // If video can't play, skip directly to form after a delay
        setTimeout(() => startTransition(), 2000);
      });
    }
  };

  const startTransition = useCallback(() => {
    if (transitionStarted.current) return;
    transitionStarted.current = true;
    setGrainsActive(true);
    setVideoFading(true);

    // After grains have been falling for a bit, start fading them and show form
    setTimeout(() => {
      setPhase("form");
      setGrainsFading(true);
      setTimeout(() => setFormVisible(true), 200);
    }, 1800);

    // Fully remove grains after they fade
    setTimeout(() => {
      setGrainsActive(false);
      setGrainsFading(false);
    }, 4000);
  }, []);

  // Monitor video progress to trigger transition near end
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || transitionStarted.current) return;
    const remaining = videoRef.current.duration - videoRef.current.currentTime;
    if (remaining <= TRANSITION_START) {
      startTransition();
    }
  }, [startTransition]);

  // Fallback: if video ends without triggering transition
  const handleVideoEnded = useCallback(() => {
    if (!transitionStarted.current) {
      startTransition();
    }
  }, [startTransition]);

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

  // Falling tea grains overlay
  const renderGrains = () => {
    if (!grainsActive) return null;
    return (
      <div
        className="fixed inset-0 z-[200] pointer-events-none overflow-hidden"
        style={{
          opacity: grainsFading ? 0 : 1,
          transition: 'opacity 2s ease-out',
        }}
      >
        {Array.from({ length: 90 }).map((_, i) => {
          const x = 10 + Math.random() * 80;
          const delay = Math.random() * 1.2;
          const size = 1.5 + Math.random() * 3;
          const drift = (Math.random() - 0.5) * 40;
          const duration = 1.8 + Math.random() * 1.5;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${x}%`,
                top: '-4px',
                width: `${size}px`,
                height: `${size}px`,
                background: `hsl(${28 + Math.random() * 15}, ${45 + Math.random() * 30}%, ${12 + Math.random() * 20}%)`,
                animation: `grainFall ${duration}s ease-in ${delay}s forwards`,
                '--drift': `${drift}px`,
              }}
            />
          );
        })}
        <style>{`
          @keyframes grainFall {
            0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
            70% { opacity: 0.8; }
            100% { transform: translateY(110vh) translateX(var(--drift)) rotate(360deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  };

  // Phase: Form
  if (phase === "form") {
    return (
      <div className="w-full">
        {renderGrains()}
        <section
          className="hero-bg min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 relative"
          data-testid="form-section"
        >
          <div
            className="rounded-2xl p-5 sm:p-8 md:p-12 max-w-lg w-full my-auto border border-white/10 transition-all duration-1000"
            style={{
              background: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              opacity: formVisible ? 1 : 0,
              transform: formVisible ? 'translateY(0)' : 'translateY(30px)',
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
    );
  }

  // Phases: logo, ready, video
  return (
    <div className="w-full h-screen h-[100dvh] bg-[#0a0a0a] relative overflow-hidden" data-testid="hero-section">
      {/* Tea grain transition overlay */}
      {renderGrains()}

      {/* Video — hidden until "Get Started" is clicked */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms]"
        style={{ opacity: phase === "video" && !videoFading ? 1 : 0 }}
        src={VIDEO_URL}
        preload="auto"
        muted
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
      />
      {/* Subtle dark overlay on video */}
      <div
        className="absolute inset-0 bg-black/20 transition-opacity duration-[1500ms]"
        style={{ opacity: phase === "video" && !videoFading ? 1 : 0 }}
      />

      {/* Logo — fades in then fades out */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <img
          src={LOGO_URL}
          alt="Estate Tea Logo"
          className="w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 logo-sharp transition-opacity duration-[1200ms]"
          style={{ opacity: phase === "logo" && logoVisible ? 1 : 0 }}
        />
      </div>

      {/* Get Started button — appears after logo phase */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-end pb-16 sm:pb-24 z-20 transition-all duration-700"
        style={{ opacity: buttonVisible ? 1 : 0, transform: buttonVisible ? 'translateY(0)' : 'translateY(20px)', pointerEvents: buttonVisible ? 'auto' : 'none' }}
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
  );
};

export default EntryForm;
