import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

const EntryForm = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const locationAttempted = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const progress = Math.min(scrollY / viewportHeight, 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-trigger location detection when form becomes visible
  useEffect(() => {
    if (scrollProgress > 0.8 && !locationAttempted.current) {
      locationAttempted.current = true;
      handleGetLocation();
    }
  }, [scrollProgress]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use Open-Meteo geocoding (free, no key needed)
          const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${latitude}&longitude=${longitude}&count=1`
          );
          // Open-Meteo doesn't support reverse geocoding directly, so use a fallback
          // Use Nominatim (OpenStreetMap) for reverse geocoding - free, no key
          const revResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`
          );
          const revData = await revResponse.json();
          const city = revData?.address?.city || revData?.address?.town || revData?.address?.village || revData?.address?.state_district || "Your Location";
          setDetectedLocation({ name: city, latitude, longitude });
          toast.success(`Location detected: ${city}`);
        } catch (error) {
          console.error("Geocoding error:", error);
          // Still store lat/lon even if city name fails
          setDetectedLocation({ name: "Your Location", latitude, longitude });
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
      },
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

  const scrollToForm = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth"
    });
  };

  return (
    <div className="w-full">
      {/* Hero Section - Evaporating Logo */}
      <section 
        className="h-screen h-[100dvh] w-full bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden px-4" 
        data-testid="hero-section"
        style={{
          opacity: Math.pow(1 - scrollProgress, 2),
          filter: `blur(${scrollProgress * 20}px)`,
          transform: `scale(${1 + scrollProgress * 0.3}) translateY(${-scrollProgress * 100}px)`,
          pointerEvents: scrollProgress > 0.5 ? 'none' : 'auto'
        }}
      >
        <div 
          className="fade-up"
          style={{
            opacity: 1 - scrollProgress * 1.5
          }}
        >
          <img 
            src="https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png" 
            alt="Estate Tea Logo" 
            className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 logo-sharp"
          />
        </div>
        
        {/* Scroll Indicator */}
        <button
          onClick={scrollToForm}
          className="absolute bottom-8 sm:bottom-12 animate-bounce cursor-pointer touch-manipulation"
          data-testid="scroll-hint"
          style={{ 
            opacity: Math.max(0, 1 - scrollProgress * 3),
            transform: `translateY(${scrollProgress * 50}px)`
          }}
        >
          <ChevronDown className="w-7 h-7 sm:w-8 sm:h-8 text-[#D4AF37]" />
        </button>
      </section>

      {/* Entry Form Section - Materializing */}
      <section 
        className="hero-bg min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 relative" 
        data-testid="form-section"
        style={{
          opacity: Math.pow(scrollProgress, 1.5) * 1.2,
          transform: `translateY(${Math.max(0, (1 - scrollProgress) * 100)}px) scale(${0.9 + scrollProgress * 0.1})`,
          filter: `blur(${Math.max(0, (1 - scrollProgress) * 15)}px)`
        }}
      >
        <div className="glass-surface rounded-2xl p-5 sm:p-8 md:p-12 max-w-lg w-full my-auto">
          <div className="flex flex-col items-center mb-6 sm:mb-12">
            <img 
              src="https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png" 
              alt="Estate Tea Logo" 
              className="w-16 h-16 sm:w-24 sm:h-24 mb-3 sm:mb-6 logo-sharp"
            />
            <h2 className="text-2xl sm:text-4xl font-light tracking-tight gold-text">Welcome</h2>
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-400 mt-2 sm:mt-4 text-center">Premium Tea Experience</p>
          </div>
          
          <form className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm uppercase tracking-widest text-gray-300">
                Your Name
              </Label>
              <Input
                id="name"
                data-testid="name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="bg-black/40 border-white/10 text-white focus:border-[#D4AF37] h-11 sm:h-12 text-base touch-manipulation"
              />
            </div>

            {/* Location status indicator */}
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
              className="w-full bg-[#D4AF37] hover:bg-[#FDE047] active:bg-[#FDE047] text-black font-light uppercase tracking-[0.2em] py-3.5 sm:py-4 rounded-lg transition-colors mt-6 sm:mt-8 text-sm sm:text-base touch-manipulation"
            >
              Enter Store
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default EntryForm;