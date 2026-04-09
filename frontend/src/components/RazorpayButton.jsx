import { useEffect, useRef } from 'react';

const RazorpayButton = ({ buttonId }) => {
  const formRef = useRef(null);

  useEffect(() => {
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
    script.setAttribute('data-payment_button_id', buttonId);
    script.async = true;

    // Append to form
    if (formRef.current) {
      formRef.current.appendChild(script);
    }

    // Cleanup
    return () => {
      if (formRef.current && script.parentNode) {
        formRef.current.removeChild(script);
      }
    };
  }, [buttonId]);

  return (
    <form ref={formRef} className="razorpay-payment-button">
      {/* Script will be inserted here */}
    </form>
  );
};

export default RazorpayButton;
