# Estate Tea - Product Requirements Document

## Original Problem Statement
E-commerce website for "Estate Tea" — black and gold theme, mobile-responsive. Features: scroll-based landing page, auto-location entry form, weather-based tea suggestions, cart system, Razorpay payment integration, checkout with T&Cs, full-page payment success/failure screens, invoice sending via email/SMS.

## Core Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor)
- **Payments**: Razorpay Payment Buttons (embedded HTML)
- **Weather**: Open-Meteo API (FREE, no key, real-time)
- **Geocoding**: Nominatim/OpenStreetMap (FREE, no key)
- **Email**: Resend (infrastructure ready, needs API key)
- **SMS**: Twilio (infrastructure ready, needs API keys)

## File Structure
```
/app/
├── backend/
│   ├── server.py
│   ├── tests/
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.js (Routing + state)
    │   ├── App.css (Theme, animations)
    │   ├── components/
    │   │   ├── EntryForm.jsx (Name-only, auto-locate via Nominatim)
    │   │   ├── WelcomeScreen.jsx (Fade transition)
    │   │   ├── MainStore.jsx (Products, real weather/dual options, recipes)
    │   │   ├── RecipeModal.jsx (Step-by-step recipes)
    │   │   ├── Cart.jsx (Cart management)
    │   │   ├── Checkout.jsx (Razorpay buttons, navigates to result pages)
    │   │   ├── RazorpayButton.jsx (Payment detection)
    │   │   ├── PaymentSuccess.jsx (Full-page success + invoice notice)
    │   │   └── PaymentFailed.jsx (Full-page failure + empathetic message)
    │   └── index.css
    └── package.json
```

## Completed Features (as of Apr 14, 2026)
- [x] Black & gold theme, mobile-responsive (320px-1920px)
- [x] Scroll-based evaporation transition
- [x] Entry form - Name only, silent auto-locate
- [x] Real weather via Open-Meteo (no API key needed)
- [x] Weather-based recommendation with Recipe button
- [x] Dual Hot/Cold options with Recipe buttons (location denied)
- [x] Recipe modal with Pro Tip
- [x] Product variants: 250g (Rs.200) / 500g (Rs.400)
- [x] Cart with quantity controls
- [x] Checkout with Razorpay Payment Buttons
- [x] **Full-page Payment Success** — checkmark, order details, "Invoice sent to your email", "Shop Again"
- [x] **Full-page Payment Failed** — empathetic message, "Try Again", "Back to Store"
- [x] "Payment didn't go through?" link on checkout after interaction
- [x] Razorpay webhook endpoint (stores payments in MongoDB)
- [x] Invoice email/SMS infrastructure (needs API keys)
- [x] T&Cs (Bangalore only, no refunds)

## Routes
- `/` — Landing page + entry form
- `/store` — Product store with weather suggestions
- `/cart` — Shopping cart
- `/checkout` — Payment with Razorpay
- `/payment-success` — Full-page success confirmation
- `/payment-failed` — Full-page failure with retry

## API Endpoints
- `POST /api/weather` — Real weather via Open-Meteo
- `POST /api/orders` — Create order
- `GET /api/orders` — List orders
- `POST /api/razorpay/webhook` — Payment webhook
- `GET /api/invoice/status` — Email/SMS config status

## Required API Keys (Not Yet Configured)
- **Resend** (Email): https://resend.com → `RESEND_API_KEY`
- **Twilio** (SMS): https://www.twilio.com → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Razorpay Webhook**: Dashboard → Webhooks → `RAZORPAY_WEBHOOK_SECRET`

## Upcoming Tasks (P1)
- [ ] Configure Resend + Twilio API keys for live invoice sending
- [ ] Set up Razorpay webhook URL in dashboard

## Future Tasks (P2)
- [ ] Order status tracking / admin dashboard
