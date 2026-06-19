# Estate Tea - Product Requirements Document

## Problem Statement
E-commerce website for "Estate Tea" tea business. Black and gold theme, mobile-responsive, premium aesthetic. Features include a cinematic landing page, weather-based tea suggestions, Razorpay payment integration, and admin dashboard.

## Core Requirements
- Black and gold theme, mobile-responsive, classy aesthetic
- Cinematic landing page with video, logo transitions, particle animation, and entry form
- Weather-based tea suggestions using real-time Open-Meteo data
- Shopping cart with 250g/500g variants, 5% GST (CGST + SGST)
- Razorpay payment integration (Standard checkout)
- Admin dashboard for managing products, reviews, and orders

## Architecture
- Frontend: Next.js 16 (React 19), Tailwind CSS, Framer Motion
- Backend: FastAPI (Emergent preview) / Next.js API Routes (Vercel)
- Database: MongoDB (Motor/Mongoose)
- Integrations: Open-Meteo (Weather), Razorpay (Payments)

## Key Pages/Components
| Component | Purpose |
|-----------|---------|
| EntryForm.jsx | Cinematic landing: Logo → Video → Tea grains → Entry form |
| MainStore.jsx | Products, Weather suggestions, Slideshow, Testimonials |
| Checkout.jsx | Cart summary, Razorpay payment |
| AdminDashboard.jsx | Product/Order/Review management (/#admin) |

## Completed Features (as of Jun 2026)
- [x] Cinematic video landing page (Logo smooth fade in/out → Video first frame as bg + "Get Started" → Click plays video fully → Video ends → Page slides downward with grain particles fading → Entry form revealed)
- [x] Auto-location detection (silent geolocation + Nominatim reverse geocoding)
- [x] Weather-based tea suggestions via Open-Meteo
- [x] Store with product listings (250g/500g), Ken Burns slideshow, tea powder background
- [x] Cart system with 5% GST calculation
- [x] Razorpay Standard Checkout integration
- [x] Admin Dashboard (/#admin) — manage products, orders, reviews
- [x] Font Size Toggle (accessibility)
- [x] Testimonials auto-advancing slideshow
- [x] Mobile-responsive (iOS zoom fix, viewport handling)
- [x] Migrated from Vite/React to Next.js App Router for Vercel deployment

## Upcoming Tasks (P1)
- [ ] Build Hampers page (dropdown exists, currently "Coming Soon" toast)
- [ ] Build Wedding Favours page (dropdown exists, currently "Coming Soon" toast)

## Future/Backlog (P2)
- [ ] WhatsApp Business integration for payment confirmations (deferred by user)
- [ ] Order status tracking with delivery updates
- [ ] Twilio/Resend invoice notifications (blocked on user providing keys)
- [ ] Server-side admin auth for enhanced security

## API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/weather | POST | Open-Meteo weather data |
| /api/orders | GET/POST | Order CRUD |
| /api/create-razorpay-order | POST | Create Razorpay order |
| /api/verify-payment | POST | Verify Razorpay payment |
| /api/testimonials | GET/POST | Testimonials |
| /api/admin/login | POST | Admin authentication |
| /api/admin/products | GET/PUT | Product management |
| /api/admin/orders | GET | Order management |

## DB Schema
- orders: { name, variant, quantity, price, total, location, date, razorpay_order_id, razorpay_payment_id }
- testimonials: { id, user_name, text, rating, created_at }

## Key Notes
- Vercel deployment via GitHub (Next.js API routes)
- Emergent preview uses FastAPI backend on port 8001
- Admin password: stored in test_credentials.md
- Razorpay live keys should NOT be in source code for GitHub push
