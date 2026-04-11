# Estate Tea - Product Requirements Document

## Original Problem Statement
E-commerce website for "Estate Tea" — black and gold theme, mobile-responsive. Features: scroll-based landing page, auto-location entry form, weather-based tea suggestions, cart system, Razorpay payment integration, checkout with T&Cs, payment verification popup, invoice sending via email/SMS.

## Core Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor)
- **Payments**: Razorpay Payment Buttons (embedded HTML)
- **Weather**: OpenWeatherMap API (MOCKED - API key returns 401)
- **Email**: Resend (infrastructure ready, needs API key)
- **SMS**: Twilio (infrastructure ready, needs API keys)

## File Structure
```
/app/
├── backend/
│   ├── server.py (FastAPI - weather, orders, razorpay, webhook, invoices)
│   ├── tests/
│   │   ├── test_api.py
│   │   └── test_webhook_invoice.py
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.js (Routing, state management)
    │   ├── App.css (Theme, animations)
    │   ├── components/
    │   │   ├── EntryForm.jsx (Name-only form, silent auto-locate)
    │   │   ├── WelcomeScreen.jsx (Fade transition)
    │   │   ├── MainStore.jsx (Products, weather/dual suggestions, recipe buttons)
    │   │   ├── RecipeModal.jsx (Step-by-step tea recipes)
    │   │   ├── Cart.jsx (Cart management)
    │   │   ├── Checkout.jsx (Order summary, Razorpay buttons, payment success)
    │   │   ├── RazorpayButton.jsx (Embeds payment script, detects success)
    │   │   └── PaymentSuccessModal.jsx (Post-payment confirmation popup)
    │   └── index.css (Tailwind base)
    └── package.json
```

## Completed Features (as of Apr 11, 2026)
- [x] Black & gold theme, mobile-responsive
- [x] Scroll-based evaporation transition on landing page
- [x] Entry form - Name only (location input removed)
- [x] Silent auto-location via browser Geolocation API
- [x] Welcome screen fade-in transition (2s)
- [x] Weather-based single recommendation (when location granted) with Recipe button
- [x] Dual Hot/Cold tea options (when location denied) with Recipe buttons
- [x] Recipe modal with step-by-step instructions and Pro Tip
- [x] Product variants: 250g (Rs.200) / 500g (Rs.400)
- [x] Cart with quantity controls
- [x] Checkout page with Razorpay Payment Buttons
- [x] Payment success popup (MutationObserver + postMessage detection)
- [x] Razorpay webhook endpoint (stores payments in MongoDB)
- [x] Invoice email infrastructure via Resend (needs API key)
- [x] Invoice SMS infrastructure via Twilio (needs API keys)
- [x] Specific T&Cs (Bangalore only, no refunds)
- [x] Mock weather fallback (real API key broken)

## API Endpoints
- `POST /api/weather` - Returns weather data (mocked fallback)
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `POST /api/create-razorpay-order` - Create Razorpay order
- `POST /api/razorpay/webhook` - Razorpay payment webhook
- `GET /api/invoice/status` - Check email/SMS configuration

## Razorpay Button IDs
- 250g: `pl_SbQMIgFUp1d0QU`
- 500g: `pl_SbQNxw8mVG2fr4`

## Required API Keys (Not Yet Configured)
- **Resend** (Email): Sign up at https://resend.com → API Keys → Create (starts with `re_...`). Add to backend .env as `RESEND_API_KEY`
- **Twilio** (SMS): Sign up at https://www.twilio.com → Get Account SID, Auth Token, Phone Number. Add to backend .env as `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Razorpay Webhook**: In Razorpay Dashboard → Settings → Webhooks → Add webhook URL: `{your-domain}/api/razorpay/webhook`. Add secret to backend .env as `RAZORPAY_WEBHOOK_SECRET`

## Known Mocks
- Weather API: Mock data based on city hash (real key returns 401)
- Email/SMS: Infrastructure ready but not configured (graceful degradation)

## Upcoming Tasks (P1)
- [ ] Configure Resend API key for email invoices
- [ ] Configure Twilio for SMS invoices
- [ ] Set up Razorpay webhook URL in dashboard

## Future Tasks (P2)
- [ ] Order status tracking / admin dashboard
- [ ] Email notifications for order updates
