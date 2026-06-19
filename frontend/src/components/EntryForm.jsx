import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const VIDEO_URL = "https://customer-assets.emergentagent.com/job_tea-estate-store/artifacts/z2zc6gmx_opening%20page.mp4";
const LOGO_URL = "https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png";
const POUR_STARTS = 3.0; // seconds into video when hand starts pouring
const DESCENT_TRIGGER = POUR_STARTS + 1.0; // 1 second after pour begins

const EntryForm = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [phase, setPhase] = useState("logo"); // logo → ready → video → descending → form
  const [logoVisible, setLogoVisible] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [translateY, setTranslateY] = useState("0");
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
        // Fallback if video can't play
        setTimeout(() => triggerDescent(), 3000);
      });
    }
  };

  const triggerDescent = useCallback(() => {
    if (transitioned.current) return;
    transitioned.current = true;
    setPhase("descending");
    setTranslateY("-100vh");
    // Form fades in after descent completes
    setTimeout(() => {
      setPhase("form");
      setTimeout(() => setFormVisible(true), 150);
    }, 2500);
  }, []);

  // Trigger descent at the right moment during the video
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || transitioned.current) return;
    if (videoRef.current.currentTime >= DESCENT_TRIGGER) {
      triggerDescent();
    }
  }, [triggerDescent]);

  // Fallback if video ends without triggering
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

  const showVideo = (phase === "ready" || phase === "video" || phase === "descending") && videoReady;

  return (
    <div className="overflow-hidden h-screen h-[100dvh] bg-[#0C0B0A]" data-testid="entry-wrapper">
      {/* Elevator container — 2 stacked sections */}
      <div
        className="will-change-transform"
        style={{
          transform: `translateY(${translateY})`,
          transition: phase === "descending" ? 'transform 2.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      >
        {/* ── Section 1: Hero ── */}
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
            onTimeUpdate={handleTimeUpdate}
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

        {/* ── Section 2: Login Form ── */}
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
