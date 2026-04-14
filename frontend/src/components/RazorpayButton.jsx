import { useEffect, useRef, useState } from 'react';

const RazorpayButton = ({ buttonId, onPaymentSuccess, onPaymentAttempted }) => {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const successFired = useRef(false);

  useEffect(() => {
    if (!buttonId || !containerRef.current) return;
    successFired.current = false;

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
      const observer = new MutationObserver(() => {
        if (successFired.current) return;
        const container = containerRef.current;
        if (!container) return;
        const text = (container.innerText || '').toLowerCase();

        // Detect Razorpay modal opened (button was clicked)
        if (text.includes('razorpay') || container.querySelector('iframe')) {
          if (onPaymentAttempted) onPaymentAttempted();
        }

        // Detect payment success
        if (
          text.includes('payment successful') ||
          text.includes('payment id') ||
          text.includes('thank you')
        ) {
          successFired.current = true;
          observer.disconnect();
          if (onPaymentSuccess) onPaymentSuccess();
        }
      });

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      });

      // Detect payment success via postMessage from Razorpay iframe
      const messageHandler = (event) => {
        if (successFired.current || !event.data) return;
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (
            data?.razorpay_payment_id ||
            data?.event === 'payment.success' ||
            data?.event === 'payment_success'
          ) {
            successFired.current = true;
            if (onPaymentSuccess) onPaymentSuccess();
          }
          // Detect modal interaction (attempted payment)
          if (data?.event === 'checkout.opened' || data?.event === 'modal.opened') {
            if (onPaymentAttempted) onPaymentAttempted();
          }
        } catch {
          if (typeof event.data === 'string') {
            if (event.data.includes('payment_success')) {
              successFired.current = true;
              if (onPaymentSuccess) onPaymentSuccess();
            }
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
  }, [buttonId, onPaymentSuccess, onPaymentAttempted]);

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
