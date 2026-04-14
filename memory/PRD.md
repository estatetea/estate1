# Estate Tea - Product Requirements Document

## Original Problem Statement
E-commerce website for "Estate Tea" — black and gold theme, mobile-responsive. Features: scroll-based landing page, auto-location entry form, weather-based tea suggestions, cart system, Razorpay payment integration, checkout with T&Cs, payment verification popup, invoice sending via email/SMS.

## Core Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor)
- **Payments**: Razorpay Payment Buttons (embedded HTML)
- **Weather**: Open-Meteo API (FREE, no key needed, real-time data)
- **Geocoding**: Nominatim/OpenStreetMap (FREE, no key needed)
- **Email**: Resend (infrastructure ready, needs API key)
- **SMS**: Twilio (infrastructure ready, needs API keys)

## File Structure
```
/app/
├── backend/
│   ├── server.py (FastAPI - Open-Meteo weather, orders, razorpay, webhook, invoices)
│   ├── tests/
│   │   ├── test_api.py
│   │   ├── test_weather_openmeteo.py
│   │   └── test_webhook_invoice.py
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── public/index.html (viewport meta, Razorpay script)
    ├── src/
    │   ├── App.js (Routing, state, passes lat/lon to weather API)
    │   ├── App.css (Theme, animations, mobile fixes)
    │   ├── components/
    │   │   ├── EntryForm.jsx (Name-only, silent auto-locate via Nominatim)
    │   │   ├── WelcomeScreen.jsx (Fade transition)
    │   │   ├── MainStore.jsx (Products, real weather/dual suggestions, recipes)
    │   │   ├── RecipeModal.jsx (Step-by-step tea recipes)
    │   │   ├── Cart.jsx (Cart management)
    │   │   ├── Checkout.jsx (Order summary, Razorpay, payment success)
    │   │   ├── RazorpayButton.jsx (Embeds payment, detects success)
    │   │   └── PaymentSuccessModal.jsx (Confirmation + invoice email notice)
    │   └── index.css (Tailwind base)
    └── package.json
```

## Completed Features (as of Apr 14, 2026)
- [x] Black & gold theme, mobile-responsive (320px-1920px)
- [x] Scroll-based evaporation transition
- [x] Entry form - Name only
- [x] Silent auto-location (Nominatim reverse geocoding)
- [x] Welcome screen fade-in (2s)
- [x] **REAL weather data** via Open-Meteo (Bangalore 32.5°C, Shimla 16.5°C)
- [x] Weather-based recommendation with Recipe button (location granted)
- [x] Dual Hot/Cold tea options with Recipe buttons (location denied)
- [x] Recipe modal with step-by-step instructions + Pro Tip
- [x] Product variants: 250g (Rs.200) / 500g (Rs.400)
- [x] Cart with quantity controls
- [x] Checkout with Razorpay Payment Buttons
- [x] Payment success popup with "Invoice sent to your email" notice
- [x] Razorpay webhook endpoint (stores payments in MongoDB)
- [x] Invoice email/SMS infrastructure (needs API keys)
- [x] Mobile UI optimization (overflow-x fix, viewport meta)
- [x] T&Cs (Bangalore only, no refunds)

## API Endpoints
- `POST /api/weather` - Real weather via Open-Meteo (accepts place, optional lat/lon)
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `POST /api/create-razorpay-order` - Razorpay order
- `POST /api/razorpay/webhook` - Payment webhook
- `GET /api/invoice/status` - Email/SMS config status

## Required API Keys (Not Yet Configured)
- **Resend** (Email): https://resend.com → `RESEND_API_KEY`
- **Twilio** (SMS): https://www.twilio.com → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Razorpay Webhook**: Dashboard → Webhooks → `RAZORPAY_WEBHOOK_SECRET`

## Upcoming Tasks (P1)
- [ ] Configure Resend + Twilio API keys for live invoice sending
- [ ] Set up Razorpay webhook URL in dashboard

## Future Tasks (P2)
- [ ] Order status tracking / admin dashboard
