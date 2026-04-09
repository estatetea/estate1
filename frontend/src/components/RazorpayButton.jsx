import { useEffect, useRef, useState } from 'react';

const RazorpayButton = ({ buttonId }) => {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!buttonId || !containerRef.current) {
      return;
    }

    try {
      // Clear any existing content
      containerRef.current.innerHTML = '';

      // Create a unique form for this button
      const form = document.createElement('form');
      form.className = 'razorpay-payment-button-form';
      
      // Create and configure script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
      script.setAttribute('data-payment_button_id', buttonId);
      script.async = true;
      
      // Handle script load errors
      script.onerror = () => {
        setError('Failed to load payment button');
      };

      // Append script to form
      form.appendChild(script);
      
      // Append form to container
      containerRef.current.appendChild(form);

      // Cleanup function
      return () => {
        try {
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      };
    } catch (err) {
      console.error('RazorpayButton error:', err);
      setError('Error loading payment button');
    }
  }, [buttonId]);

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4 border border-red-400/20 rounded">
        {error}. Please refresh the page.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="razorpay-button-wrapper">
      {/* Razorpay button will be injected here */}
    </div>
  );
};

export default RazorpayButton;
