import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ChevronDown } from "lucide-react";

const EntryForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    place: ""
  });
  const [scrollProgress, setScrollProgress] = useState(0);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.age && formData.place) {
      onSubmit({
        name: formData.name,
        age: parseInt(formData.age),
        place: formData.place
      });
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
        className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden" 
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
            className="w-72 h-72 md:w-96 md:h-96 logo-sharp"
          />
        </div>
        
        {/* Scroll Indicator */}
        <button
          onClick={scrollToForm}
          className="absolute bottom-12 animate-bounce cursor-pointer"
          data-testid="scroll-hint"
          style={{ 
            opacity: Math.max(0, 1 - scrollProgress * 3),
            transform: `translateY(${scrollProgress * 50}px)`
          }}
        >
          <ChevronDown className="w-8 h-8 text-[#D4AF37]" />
        </button>
      </section>

      {/* Entry Form Section - Materializing */}
      <section 
        className="hero-bg min-h-screen w-full flex items-center justify-center p-4 relative" 
        data-testid="form-section"
        style={{
          opacity: Math.pow(scrollProgress, 1.5) * 1.2,
          transform: `translateY(${Math.max(0, (1 - scrollProgress) * 100)}px) scale(${0.9 + scrollProgress * 0.1})`,
          filter: `blur(${Math.max(0, (1 - scrollProgress) * 15)}px)`
        }}
      >
        <div className="glass-surface rounded-2xl p-12 max-w-lg w-full">
          <div className="flex flex-col items-center mb-12">
            <img 
              src="https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png" 
              alt="Estate Tea Logo" 
              className="w-24 h-24 mb-6 logo-sharp"
            />
            <h2 className="text-4xl font-light tracking-tight gold-text">Welcome</h2>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-400 mt-4">Premium Tea Experience</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm uppercase tracking-widest text-gray-300">
                Name
              </Label>
              <Input
                id="name"
                data-testid="name-input"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-black/40 border-white/10 text-white focus:border-[#D4AF37] h-12"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age" className="text-sm uppercase tracking-widest text-gray-300">
                Age
              </Label>
              <Input
                id="age"
                data-testid="age-input"
                type="number"
                value={formData.age}
                onChange={(e) => handleChange("age", e.target.value)}
                className="bg-black/40 border-white/10 text-white focus:border-[#D4AF37] h-12"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="place" className="text-sm uppercase tracking-widest text-gray-300">
                Place
              </Label>
              <Input
                id="place"
                data-testid="place-input"
                type="text"
                value={formData.place}
                onChange={(e) => handleChange("place", e.target.value)}
                className="bg-black/40 border-white/10 text-white focus:border-[#D4AF37] h-12"
                required
              />
            </div>
            
            <button
              type="submit"
              data-testid="entry-submit-button"
              className="w-full bg-[#D4AF37] hover:bg-[#FDE047] text-black font-light uppercase tracking-[0.2em] py-4 rounded-lg transition-colors mt-8"
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