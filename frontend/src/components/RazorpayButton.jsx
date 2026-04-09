import { useEffect, useRef } from 'react';

const RazorpayButton = ({ buttonId }) => {
  const formRef = useRef(null);
  const scriptRef = useRef(null);

  useEffect(() => {
    // Clear any existing content first
    if (formRef.current) {
      formRef.current.innerHTML = '';
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
    script.setAttribute('data-payment_button_id', buttonId);
    script.async = true;
    scriptRef.current = script;

    // Append to form
    if (formRef.current) {
      formRef.current.appendChild(script);
    }

    // Cleanup on unmount
    return () => {
      if (formRef.current && scriptRef.current) {
        try {
          formRef.current.removeChild(scriptRef.current);
        } catch (e) {
          // Script already removed
        }
      }
      if (formRef.current) {
        formRef.current.innerHTML = '';
      }
    };
  }, [buttonId]);

  return (
    <div className="razorpay-button-wrapper">
      <form ref={formRef} className="razorpay-payment-button">
        {/* Script will be inserted here */}
      </form>
    </div>
  );
};

export default RazorpayButton;
