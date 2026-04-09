import { useEffect, useState } from "react";

const WelcomeScreen = ({ userName, onComplete }) => {
  const [opacity, setOpacity] = useState(0);

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
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50">
      <div 
        className="text-center px-6"
        style={{
          opacity: opacity,
          transition: 'opacity 1s ease-in-out',
        }}
      >
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-tight gold-text mb-6 fade-up">
          Welcome
        </h1>
        <p 
          className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-wide"
          data-testid="welcome-username"
        >
          {userName}
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
