# Estate Tea - Product Requirements Document

## Original Problem Statement
E-commerce website for "Estate Tea" — black and gold theme, mobile-responsive. Features: scroll-based landing page, auto-location entry form, weather-based tea suggestions, cart system, Razorpay payment integration with automatic redirect, checkout with T&Cs, full-page payment success/failure screens, invoice sending via email/SMS.

## Core Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor)
- **Payments**: Razorpay Standard Checkout (checkout.js) with JS callbacks
- **Weather**: Open-Meteo API (FREE, no key, real-time)
- **Geocoding**: Nominatim/OpenStreetMap (FREE, no key)
- **Email**: Resend (infrastructure ready, needs API key)
- **SMS**: Twilio (infrastructure ready, needs API keys)

## Payment Flow
1. User clicks **"PAY ₹X"** on checkout
2. Backend creates Razorpay order → returns order_id + key
3. Razorpay Standard Checkout modal opens (branded gold theme)
4. **Success**: `handler` callback → "Redirecting you back..." → `/payment-success` with order details + payment ID
5. **Failure**: `payment.failed` event → `/payment-failed` with empathetic retry message
6. **Dismissed**: `modal.ondismiss` → `/payment-failed`
7. Backend verifies payment signature + stores in MongoDB

## File Structure
```
/app/
├── backend/
│   ├── server.py (weather, orders, razorpay checkout, verify-payment, webhook, invoices)
│   ├── tests/
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.js (Routing + state)
    │   ├── components/
    │   │   ├── EntryForm.jsx (Name-only, auto-locate)
    │   │   ├── WelcomeScreen.jsx (Fade transition)
    │   │   ├── MainStore.jsx (Products, real weather/dual options, recipes)
    │   │   ├── RecipeModal.jsx (Step-by-step recipes)
    │   │   ├── Cart.jsx (Cart management)
    │   │   ├── Checkout.jsx (Razorpay Standard Checkout, auto-redirect)
    │   │   ├── PaymentSuccess.jsx (Full-page success + invoice notice + payment ID)
    │   │   └── PaymentFailed.jsx (Full-page failure + empathetic message)
    │   └── index.css
    └── package.json
```

## API Endpoints
- `POST /api/weather` — Real weather via Open-Meteo
- `POST /api/orders` — Create order
- `POST /api/create-razorpay-order` — Create Razorpay order (returns order_id, key_id)
- `POST /api/verify-payment` — Verify Razorpay payment signature
- `POST /api/razorpay/webhook` — Payment webhook
- `GET /api/invoice/status` — Email/SMS config status

## Required API Keys (Not Yet Configured)
- **Resend** (Email): https://resend.com → `RESEND_API_KEY`
- **Twilio** (SMS): https://www.twilio.com → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Razorpay Webhook**: Dashboard → Webhooks → `RAZORPAY_WEBHOOK_SECRET`

## Completed (Latest)
- [x] Image slideshow on store page — smooth crossfade between 3 product images, auto-advance, dot indicators (Apr 2026)
- [x] Clean minimal product layout — removed side product image, centered variant/quantity selection (Apr 2026)
- [x] Page exit transition — smooth fade-to-black when navigating to checkout (Apr 2026)
- [x] Header nav dropdowns — "Categories" (Tea, Hampers) and "Services" (Wedding Favours) (Apr 2026)

## Upcoming Tasks (P1)
- [ ] Build separate pages for Hampers and Wedding Favours (when ready)
- [ ] Configure Resend + Twilio API keys for live invoice sending
- [ ] Set up Razorpay webhook URL in dashboard

## Future Tasks (P2)
- [ ] Order status tracking / admin dashboard
