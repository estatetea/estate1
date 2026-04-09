import { useEffect, useState } from "react";

const WelcomeScreen = ({ userName, onComplete }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Fade in
    setTimeout(() => setOpacity(1), 100);
    
    // Start fade out after 2 seconds
    setTimeout(() => setOpacity(0), 2000);
    
    // Complete transition after fade out
    setTimeout(() => onComplete(), 2800);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50">
      <div 
        className="text-center"
        style={{
          opacity: opacity,
          transform: `scale(${opacity})`,
          transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
        }}
      >
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-tight gold-text mb-4">
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
