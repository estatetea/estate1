import { useEffect, useRef, useState } from 'react';

const RazorpayButton = ({ buttonId, onPaymentSuccess }) => {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!buttonId || !containerRef.current) return;

    try {
      containerRef.current.innerHTML = '';

      const form = document.createElement('form');
      form.className = 'razorpay-payment-button-form';
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
      script.setAttribute('data-payment_button_id', buttonId);
      script.async = true;
      
      script.onerror = () => setError('Failed to load payment button');
      form.appendChild(script);
      containerRef.current.appendChild(form);

      // Detect payment success via MutationObserver
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          const container = containerRef.current;
          if (!container) return;
          const text = container.innerText || '';
          if (
            text.toLowerCase().includes('payment successful') ||
            text.toLowerCase().includes('payment id') ||
            text.toLowerCase().includes('thank you')
          ) {
            observer.disconnect();
            if (onPaymentSuccess) onPaymentSuccess();
            break;
          }
        }
      });

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      });

      // Detect payment success via postMessage from Razorpay iframe
      const messageHandler = (event) => {
        if (!event.data) return;
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (
            data?.razorpay_payment_id ||
            data?.event === 'payment.success' ||
            data?.event === 'payment_success'
          ) {
            if (onPaymentSuccess) onPaymentSuccess();
          }
        } catch {
          // Not JSON - check string content
          if (typeof event.data === 'string' && event.data.includes('payment_success')) {
            if (onPaymentSuccess) onPaymentSuccess();
          }
        }
      };
      window.addEventListener('message', messageHandler);

      return () => {
        observer.disconnect();
        window.removeEventListener('message', messageHandler);
        try {
          if (containerRef.current) containerRef.current.innerHTML = '';
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      };
    } catch (err) {
      console.error('RazorpayButton error:', err);
      setError('Error loading payment button');
    }
  }, [buttonId, onPaymentSuccess]);

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
