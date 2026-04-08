import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const EntryForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    place: ""
  });

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

  return (
    <div className="hero-bg min-h-screen w-full flex items-center justify-center p-4">
      <div className="glass-surface rounded-2xl p-12 max-w-lg w-full fade-up">
        <div className="flex flex-col items-center mb-12">
          <img 
            src="https://customer-assets.emergentagent.com/job_c66468c3-ee7d-4745-ae1d-81e215b8ce47/artifacts/slk4bloz_Untitled%20%284%29.png" 
            alt="Estate Tea Logo" 
            className="w-32 h-32 mb-6"
          />
          <h1 className="text-5xl font-light tracking-tight gold-text">Estate Tea</h1>
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
    </div>
  );
};

export default EntryForm;