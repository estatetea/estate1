# Estate Tea - Product Requirements Document

## Original Problem Statement
E-commerce website for "Estate Tea" — black and gold theme, mobile-responsive. Features: scroll-based landing page, auto-location entry form, weather-based tea suggestions, cart system, Razorpay payment integration with automatic redirect, checkout with T&Cs, full-page payment success/failure screens.

## Core Architecture
- **Framework**: Next.js 16 (App Router, single-page SPA pattern)
- **Styling**: Tailwind CSS + Shadcn UI
- **Backend API**: Next.js API Routes (in `/src/app/api/`)
- **Database**: MongoDB (via `mongodb` Node.js driver)
- **Payments**: Razorpay Standard Checkout (checkout.js) with JS callbacks
- **Weather**: Open-Meteo API (FREE, no key, real-time)
- **Geocoding**: Nominatim/OpenStreetMap (FREE, no key)
- **Python Backend**: Still exists at `/app/backend/` for Emergent preview (routes /api/* to port 8001)

## Deployment
- **Vercel**: `next build && next start` — single project deployment
- **Env Vars needed on Vercel**: MONGO_URL, DB_NAME, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

## File Structure
```
/app/frontend/
├── src/
│   ├── app/
│   │   ├── layout.js (Root layout)
│   │   ├── page.js (SPA: all state + routing via useState)
│   │   ├── globals.css (All styles)
│   │   └── api/ (Next.js API Routes)
│   │       ├── weather/route.js
│   │       ├── orders/route.js
│   │       ├── create-razorpay-order/route.js
│   │       ├── verify-payment/route.js
│   │       ├── razorpay/webhook/route.js
│   │       └── invoice/status/route.js
│   ├── components/
│   │   ├── ui/ (Shadcn components)
│   │   ├── EntryForm.jsx
│   │   ├── WelcomeScreen.jsx
│   │   ├── MainStore.jsx (slideshow, weather, products, dropdowns)
│   │   ├── Cart.jsx
│   │   ├── Checkout.jsx (Razorpay Standard Checkout)
│   │   ├── PaymentSuccess.jsx
│   │   ├── PaymentFailed.jsx
│   │   ├── RecipeModal.jsx
│   │   └── RazorpayButton.jsx
│   └── lib/
│       ├── utils.js (Shadcn utils)
│       └── mongodb.js (MongoDB connection)
├── next.config.js
├── tailwind.config.js
└── package.json
```

## Completed
- [x] Landing page with scroll-based evaporation transition
- [x] Entry form with silent auto-location (Name only)
- [x] Welcome screen fade-in transition
- [x] Weather-based tea suggestions (Open-Meteo)
- [x] Dual Hot/Cold options when location denied
- [x] Recipe modals for both options
- [x] Image slideshow (3 product images, crossfade)
- [x] Categories (Tea, Hampers) and Services (Wedding Favours) dropdowns
- [x] Clean minimal product layout with variant selection
- [x] 5% GST (CGST 2.5% + SGST 2.5%) on checkout
- [x] Cart + Checkout with delivery details form
- [x] Razorpay Standard Checkout (Live keys)
- [x] Full-page payment success/failure screens
- [x] Page exit transition (fade-to-black)
- [x] **Migrated from CRA to Next.js** for Vercel deployment (Apr 2026)

## Upcoming Tasks (P1)
- [ ] Build dedicated Hampers and Wedding Favours pages
- [ ] Configure Resend + Twilio API keys for live invoice sending

## Future Tasks (P2)
- [ ] Order status tracking / admin dashboard
