import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ChevronDown, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EntryForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    location: ""
  });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLocating, setIsLocating] = useState(false);

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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get city name
          const response = await axios.get(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=REDACTED_KEY`
          );
          
          if (response.data && response.data.length > 0) {
            const city = response.data[0].name;
            setFormData(prev => ({ ...prev, location: city }));
            toast.success(`Location detected: ${city}`);
          } else {
            toast.error("Could not determine your city");
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          toast.error("Failed to get location name");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please enter manually.");
        } else {
          toast.error("Unable to retrieve your location");
        }
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.location) {
      onSubmit({
        name: formData.name,
        place: formData.location
      });
    } else {
      toast.error("Please fill in all fields");
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden px-4" 
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
        className="hero-bg min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative" 
        data-testid="form-section"
        style={{
          opacity: Math.pow(scrollProgress, 1.5) * 1.2,
          transform: `translateY(${Math.max(0, (1 - scrollProgress) * 100)}px) scale(${0.9 + scrollProgress * 0.1})`,
          filter: `blur(${Math.max(0, (1 - scrollProgress) * 15)}px)`
        }}
      >
        <div className="glass-surface rounded-2xl p-6 sm:p-8 md:p-12 max-w-lg w-full">
          <div className="flex flex-col items-center mb-8 sm:mb-12">
            <img 
              src="https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png" 
              alt="Estate Tea Logo" 
              className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 logo-sharp"
            />
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight gold-text">Welcome</h2>
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-400 mt-3 sm:mt-4 text-center">Premium Tea Experience</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm uppercase tracking-widest text-gray-300">
                Name
              </Label>
              <Input
                id="name"
                data-testid="name-input"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-black/40 border-white/10 text-white focus:border-[#D4AF37] h-11 sm:h-12 text-base touch-manipulation"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs sm:text-sm uppercase tracking-widest text-gray-300">
                Location
              </Label>
              <div className="flex gap-2">
                <Input
                  id="location"
                  data-testid="location-input"
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="Enter city or use auto-detect"
                  className="bg-black/40 border-white/10 text-white focus:border-[#D4AF37] h-11 sm:h-12 text-base touch-manipulation flex-1"
                  required
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  data-testid="auto-locate-button"
                  className="bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 text-[#D4AF37] px-4 rounded-lg transition-colors disabled:opacity-50 touch-manipulation flex items-center gap-2"
                  title="Auto-detect location"
                >
                  {isLocating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline text-sm">Auto</span>
                </button>
              </div>
              <p className="text-xs text-gray-500">We'll use your location for personalized tea recommendations</p>
            </div>
            
            <button
              type="submit"
              data-testid="entry-submit-button"
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