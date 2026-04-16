from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx
import razorpay
import hmac
import hashlib
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=True)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize Razorpay client
razorpay_client = razorpay.Client(
    auth=(os.environ['RAZORPAY_KEY_ID'], os.environ['RAZORPAY_KEY_SECRET'])
)

# Optional integrations (graceful if missing)
resend_available = False
twilio_available = False

resend_api_key = os.environ.get('RESEND_API_KEY')
if resend_api_key:
    import resend
    resend.api_key = resend_api_key
    resend_available = True

twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
twilio_token = os.environ.get('TWILIO_AUTH_TOKEN')
twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
if twilio_sid and twilio_token and twilio_phone:
    from twilio.rest import Client as TwilioClient
    twilio_client = TwilioClient(twilio_sid, twilio_token)
    twilio_available = True

app = FastAPI()
api_router = APIRouter(prefix="/api")

class WeatherRequest(BaseModel):
    place: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class WeatherResponse(BaseModel):
    place: str
    temperature: float
    condition: str
    tea_recommendation: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_age: int
    customer_place: str
    product_name: str
    variant: str
    price: int
    quantity: int = 1
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    customer_name: str
    customer_age: int = 0
    customer_place: str
    product_name: str
    variant: str
    price: int
    quantity: int = 1

class RazorpayOrderRequest(BaseModel):
    amount: int
    customer_name: str
    variant: str = ""

class RazorpayOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str

@api_router.get("/")
async def root():
    return {"message": "Estate Tea API"}

@api_router.post("/weather", response_model=WeatherResponse)
async def get_weather(request: WeatherRequest):
    """Fetch real weather data using Open-Meteo (free, no API key needed)"""
    place = request.place
    lat = request.latitude
    lon = request.longitude

    try:
        async with httpx.AsyncClient() as http_client:
            # Step 1: If no lat/lon, geocode the place name via Open-Meteo
            if lat is None or lon is None:
                geo_url = "https://geocoding-api.open-meteo.com/v1/search"
                geo_params = {"name": place, "count": 1, "language": "en"}
                geo_resp = await http_client.get(geo_url, params=geo_params, timeout=10)
                geo_resp.raise_for_status()
                geo_data = geo_resp.json()

                results = geo_data.get("results")
                if not results:
                    logging.warning(f"Open-Meteo geocoding found no results for '{place}', using fallback.")
                    raise ValueError("City not found")

                lat = results[0]["latitude"]
                lon = results[0]["longitude"]
                # Use the official name returned by geocoding for display
                place = results[0].get("name", place)

            # Step 2: Fetch current weather from Open-Meteo
            weather_url = "https://api.open-meteo.com/v1/forecast"
            weather_params = {
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,weather_code",
                "timezone": "auto"
            }
            weather_resp = await http_client.get(weather_url, params=weather_params, timeout=10)
            weather_resp.raise_for_status()
            weather_data = weather_resp.json()

            current = weather_data.get("current", {})
            temperature = round(current.get("temperature_2m", 25.0), 1)
            weather_code = current.get("weather_code", 0)

            # Map weather code to human-readable condition
            condition = _weather_code_to_condition(weather_code, temperature)

            # Tea recommendation based on real temperature
            tea_recommendation = _get_tea_recommendation(temperature)

            return WeatherResponse(
                place=place,
                temperature=temperature,
                condition=condition,
                tea_recommendation=tea_recommendation
            )

    except Exception as e:
        logging.warning(f"Open-Meteo weather error: {str(e)}. Using fallback.")
        # Fallback only if the real API completely fails
        return _fallback_weather(place)


def _weather_code_to_condition(code: int, temp: float) -> str:
    """Convert WMO weather code to readable condition"""
    if code == 0:
        return "Clear Sky"
    elif code in (1, 2, 3):
        return "Partly Cloudy"
    elif code in (45, 48):
        return "Foggy"
    elif code in (51, 53, 55, 56, 57):
        return "Drizzle"
    elif code in (61, 63, 65, 66, 67):
        return "Rainy"
    elif code in (71, 73, 75, 77):
        return "Snowy"
    elif code in (80, 81, 82):
        return "Showers"
    elif code in (85, 86):
        return "Snow Showers"
    elif code in (95, 96, 99):
        return "Thunderstorm"
    else:
        if temp < 15:
            return "Cold"
        elif temp < 25:
            return "Pleasant"
        elif temp < 30:
            return "Warm"
        else:
            return "Hot"


def _get_tea_recommendation(temperature: float) -> str:
    """Get tea recommendation based on temperature"""
    if temperature < 15:
        return "Hot Estate Classic with ginger and honey — perfect for cold weather warmth"
    elif temperature < 25:
        return "Hot Estate Premium with cardamom — ideal for this pleasant weather"
    elif temperature < 30:
        return "Iced Estate Tea with mint and lemon — refreshing for warm weather"
    else:
        return "Cold Brew Estate Tea with ice and a hint of lime — stay cool in the heat"


def _fallback_weather(place: str) -> WeatherResponse:
    """Fallback mock weather when API is unreachable"""
    place_lower = place.lower()
    city_temps = {
        'mumbai': 31.0, 'delhi': 28.5, 'bangalore': 24.0,
        'chennai': 32.0, 'kolkata': 29.5, 'hyderabad': 30.0,
        'pune': 26.5, 'jaipur': 27.0, 'shimla': 12.0, 'goa': 30.5,
    }
    temperature = None
    for city, temp in city_temps.items():
        if city in place_lower:
            temperature = temp
            break
    if temperature is None:
        city_hash = sum(ord(c) for c in place_lower) % 100
        temperature = round(15 + (city_hash / 100) * 20, 1)

    return WeatherResponse(
        place=place,
        temperature=temperature,
        condition="Pleasant" if temperature < 25 else ("Warm" if temperature < 30 else "Hot"),
        tea_recommendation=_get_tea_recommendation(temperature)
    )

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    """Create a new order"""
    order_obj = Order(**order_data.model_dump())
    
    doc = order_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.orders.insert_one(doc)
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders(skip: int = 0, limit: int = 50):
    """Get orders with pagination"""
    # Enforce maximum limit to prevent excessive data fetching
    limit = min(limit, 100)
    
    orders = await db.orders.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    for order in orders:
        if isinstance(order['timestamp'], str):
            order['timestamp'] = datetime.fromisoformat(order['timestamp'])
    
    return orders

@api_router.post("/create-razorpay-order", response_model=RazorpayOrderResponse)
async def create_razorpay_order(request: RazorpayOrderRequest):
    """Create a Razorpay order"""
    try:
        order_data = {
            "amount": request.amount * 100,
            "currency": "INR",
            "payment_capture": 1,
            "notes": {
                "customer_name": request.customer_name,
                "variant": request.variant
            }
        }
        
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        return RazorpayOrderResponse(
            order_id=razorpay_order['id'],
            amount=request.amount,
            currency="INR",
            key_id=os.environ['RAZORPAY_KEY_ID']
        )
    except Exception as e:
        logging.error(f"Razorpay order creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")


@api_router.post("/verify-payment")
async def verify_payment(request: Request):
    """Verify Razorpay payment after checkout"""
    body = await request.json()
    razorpay_payment_id = body.get("razorpay_payment_id")
    razorpay_order_id = body.get("razorpay_order_id")
    razorpay_signature = body.get("razorpay_signature")

    if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
        raise HTTPException(status_code=400, detail="Missing payment details")

    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })

        # Payment verified — store it
        payment_record = {
            "payment_id": razorpay_payment_id,
            "order_id": razorpay_order_id,
            "status": "verified",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payments.insert_one(payment_record)

        return {"verified": True, "payment_id": razorpay_payment_id}
    except razorpay.errors.SignatureVerificationError:
        return {"verified": False, "error": "Invalid payment signature"}


# --- Invoice Helpers ---

def generate_invoice_html(payment_data: dict) -> str:
    """Generate HTML invoice email"""
    amount = payment_data.get('amount', 0) / 100  # paise to rupees
    payment_id = payment_data.get('id', 'N/A')
    email = payment_data.get('email', 'N/A')
    contact = payment_data.get('contact', 'N/A')
    method = payment_data.get('method', 'N/A')
    created_at = datetime.now(timezone.utc).strftime('%d %b %Y, %I:%M %p')

    return f"""
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #f5f5f0; padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #D4AF37; font-weight: 300; font-size: 28px; margin: 0;">Estate Tea</h1>
        <p style="color: #888; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">Order Confirmation</p>
      </div>
      <div style="border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 25px 0; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 13px;">Payment ID</td>
            <td style="padding: 8px 0; text-align: right; color: #D4AF37; font-size: 13px;">{payment_id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 13px;">Amount Paid</td>
            <td style="padding: 8px 0; text-align: right; color: #fff; font-size: 18px; font-weight: 300;">₹{amount:.0f}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 13px;">Payment Method</td>
            <td style="padding: 8px 0; text-align: right; color: #ccc; font-size: 13px;">{method.upper()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 13px;">Date</td>
            <td style="padding: 8px 0; text-align: right; color: #ccc; font-size: 13px;">{created_at}</td>
          </tr>
        </table>
      </div>
      <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <p style="color: #D4AF37; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 12px 0;">Estate Premium Tea</p>
        <p style="color: #ccc; font-size: 14px; margin: 0; line-height: 1.6;">Your order has been confirmed. Delivery within 3-5 business days to Bangalore addresses.</p>
      </div>
      <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
        Thank you for choosing Estate Tea.<br/>For queries, reach out to us directly.
      </p>
    </div>
    """


def generate_invoice_sms(payment_data: dict) -> str:
    """Generate SMS invoice text"""
    amount = payment_data.get('amount', 0) / 100
    payment_id = payment_data.get('id', 'N/A')
    return (
        f"Estate Tea - Payment Confirmed!\n"
        f"Amount: Rs.{amount:.0f}\n"
        f"Payment ID: {payment_id}\n"
        f"Delivery: 3-5 days (Bangalore)\n"
        f"Thank you for your purchase!"
    )


async def send_invoice_email(email: str, payment_data: dict):
    """Send invoice email via Resend"""
    if not resend_available:
        logging.warning("Resend not configured - skipping email invoice")
        return False
    try:
        sender = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
        params = {
            "from": sender,
            "to": [email],
            "subject": "Estate Tea - Order Confirmation & Invoice",
            "html": generate_invoice_html(payment_data)
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Invoice email sent to {email}: {result}")
        return True
    except Exception as e:
        logging.error(f"Failed to send invoice email: {e}")
        return False


async def send_invoice_sms(phone: str, payment_data: dict):
    """Send invoice SMS via Twilio"""
    if not twilio_available:
        logging.warning("Twilio not configured - skipping SMS invoice")
        return False
    try:
        # Ensure Indian number format
        if not phone.startswith('+'):
            phone = '+91' + phone.lstrip('0')
        message = await asyncio.to_thread(
            twilio_client.messages.create,
            body=generate_invoice_sms(payment_data),
            from_=twilio_phone,
            to=phone
        )
        logging.info(f"Invoice SMS sent to {phone}: {message.sid}")
        return True
    except Exception as e:
        logging.error(f"Failed to send invoice SMS: {e}")
        return False


# --- Razorpay Webhook ---

@api_router.post("/razorpay/webhook")
async def razorpay_webhook(request: Request):
    """Handle Razorpay payment webhooks - sends invoice on successful payment"""
    body = await request.body()
    
    # Verify webhook signature if secret is configured
    webhook_secret = os.environ.get('RAZORPAY_WEBHOOK_SECRET')
    if webhook_secret:
        signature = request.headers.get('x-razorpay-signature', '')
        expected = hmac.new(
            webhook_secret.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event = payload.get('event', '')
    logging.info(f"Razorpay webhook received: {event}")

    if event in ('payment.captured', 'payment_link.paid'):
        payment = payload.get('payload', {}).get('payment', {}).get('entity', {})
        
        if not payment:
            return {"status": "ignored", "reason": "no payment entity"}

        email = payment.get('email')
        contact = payment.get('contact')

        # Store payment record
        payment_record = {
            "payment_id": payment.get('id'),
            "amount": payment.get('amount', 0) / 100,
            "currency": payment.get('currency', 'INR'),
            "email": email,
            "contact": contact,
            "method": payment.get('method'),
            "status": payment.get('status'),
            "event": event,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payments.insert_one(payment_record)

        # Send invoices (non-blocking, don't fail webhook)
        if email:
            asyncio.create_task(send_invoice_email(email, payment))
        if contact:
            asyncio.create_task(send_invoice_sms(contact, payment))

        return {"status": "ok", "event": event}

    return {"status": "ignored", "event": event}


@api_router.get("/invoice/status")
async def invoice_status():
    """Check which invoice services are configured"""
    return {
        "email_configured": resend_available,
        "sms_configured": twilio_available,
        "email_provider": "Resend" if resend_available else None,
        "sms_provider": "Twilio" if twilio_available else None
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()