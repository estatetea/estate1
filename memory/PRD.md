# Estate Tea - Product Requirements Document

## Original Problem Statement
Create an e-commerce website for a tea business called "Estate Tea". Black and gold theme, mobile-responsive. Features: scroll-based landing page, entry form, weather-based tea suggestions, cart system, Razorpay payment integration, checkout page with specific T&Cs.

## Core Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor)
- **Payments**: Razorpay Payment Buttons (embedded HTML)
- **Weather**: OpenWeatherMap API (MOCKED - API key returns 401)

## File Structure
```
/app/
├── backend/
│   ├── server.py (FastAPI - weather mock, orders, razorpay)
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.js (Routing, state management)
    │   ├── components/
    │   │   ├── EntryForm.jsx (Name-only form, silent auto-locate)
    │   │   ├── WelcomeScreen.jsx (Fade transition)
    │   │   ├── MainStore.jsx (Products, weather/dual suggestions, recipe buttons)
    │   │   ├── RecipeModal.jsx (Step-by-step tea recipes)
    │   │   ├── Cart.jsx (Cart management)
    │   │   ├── Checkout.jsx (Delivery details, T&C)
    │   │   └── RazorpayButton.jsx (Embeds payment script)
    │   ├── App.css (Theme, animations)
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
- [x] Specific T&Cs (Bangalore only, no refunds)
- [x] Mock weather fallback (real API key broken)

## Razorpay Button IDs
- 250g: `pl_SbQMIgFUp1d0QU`
- 500g: `pl_SbQNxw8mVG2fr4`

## API Endpoints
- `POST /api/weather` - Returns weather data (mocked fallback)
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `POST /api/create-razorpay-order` - Create Razorpay order (if needed)

## Known Mocks
- Weather API: Returns consistent mock data based on city hash (real OpenWeatherMap key returns 401)

## Upcoming Tasks (P1)
- [ ] Post-payment Thank You / confirmation page
- [ ] Razorpay webhooks for secure backend order verification

## Future Tasks (P2)
- [ ] Email notifications for completed orders
- [ ] Order status tracking

## Monitoring
- Razorpay script loading may trigger ORB errors in preview iframe environments
