from fastapi import FastAPI, APIRouter, HTTPException
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize Razorpay client
razorpay_client = razorpay.Client(
    auth=(os.environ['RAZORPAY_KEY_ID'], os.environ['RAZORPAY_KEY_SECRET'])
)

app = FastAPI()
api_router = APIRouter(prefix="/api")

class WeatherRequest(BaseModel):
    place: str

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
    customer_age: int
    customer_place: str
    product_name: str
    variant: str
    price: int
    quantity: int = 1

class RazorpayOrderRequest(BaseModel):
    amount: int
    customer_name: str
    customer_phone: str
    customer_address: str

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
    """Fetch real weather data from OpenWeatherMap API with fallback to consistent mock data"""
    place = request.place
    api_key = os.environ.get('OPENWEATHER_API_KEY')
    
    # Try to fetch real weather data
    if api_key:
        try:
            async with httpx.AsyncClient() as http_client:
                # Get coordinates for the place using Geocoding API
                geo_url = f"http://api.openweathermap.org/geo/1.0/direct"
                geo_params = {
                    "q": place,
                    "limit": 1,
                    "appid": api_key
                }
                geo_response = await http_client.get(geo_url, params=geo_params, timeout=10)
                geo_response.raise_for_status()
                geo_data = geo_response.json()
                
                if not geo_data:
                    # Location not found, fall back to mock data
                    pass
                else:
                    lat = geo_data[0]['lat']
                    lon = geo_data[0]['lon']
                    
                    # Get weather data using coordinates
                    weather_url = f"https://api.openweathermap.org/data/2.5/weather"
                    weather_params = {
                        "lat": lat,
                        "lon": lon,
                        "appid": api_key,
                        "units": "metric"
                    }
                    weather_response = await http_client.get(weather_url, params=weather_params, timeout=10)
                    weather_response.raise_for_status()
                    weather_data = weather_response.json()
                    
                    temperature = round(weather_data['main']['temp'], 1)
                    
                    # Determine condition and tea recommendation based on temperature
                    if temperature < 15:
                        condition = "Cold"
                        tea_recommendation = "Hot Estate Classic with ginger and honey - perfect for cold weather warmth"
                    elif temperature < 25:
                        condition = "Pleasant"
                        tea_recommendation = "Hot Estate Premium with cardamom - ideal for pleasant temperatures"
                    elif temperature < 30:
                        condition = "Warm"
                        tea_recommendation = "Iced Estate Tea with mint and lemon - refreshing for warm weather"
                    else:
                        condition = "Hot"
                        tea_recommendation = "Cold Brew Estate Tea with ice and a hint of lime - stay cool in the heat"
                    
                    return WeatherResponse(
                        place=place,
                        temperature=temperature,
                        condition=condition,
                        tea_recommendation=tea_recommendation
                    )
        except Exception as e:
            # Log error and fall back to consistent mock data
            logging.warning(f"Weather API error: {str(e)}. Using fallback data.")
    
    # Fallback to consistent mock data (based on city hash for consistency)
    place_lower = place.lower()
    
    # Use hash to generate consistent temperature for each city
    city_hash = sum(ord(c) for c in place_lower) % 100
    
    # Predefined consistent temperatures for common cities
    city_temps = {
        'mumbai': 31.0,
        'delhi': 28.5,
        'bangalore': 24.0,
        'chennai': 32.0,
        'kolkata': 29.5,
        'hyderabad': 30.0,
        'pune': 26.5,
        'jaipur': 27.0,
        'shimla': 12.0,
        'goa': 30.5,
        'ahmedabad': 31.5,
        'surat': 30.0,
        'lucknow': 26.0,
        'kanpur': 27.5,
        'nagpur': 28.0,
        'indore': 27.0,
        'thane': 30.5,
        'bhopal': 26.5,
        'visakhapatnam': 29.0,
        'patna': 28.0
    }
    
    # Check for known cities
    temperature = None
    for city, temp in city_temps.items():
        if city in place_lower:
            temperature = temp
            break
    
    # If not found, generate consistent temp based on hash
    if temperature is None:
        temperature = round(15 + (city_hash / 100) * 20, 1)  # Range: 15-35°C
    
    # Determine condition and tea recommendation
    if temperature < 15:
        condition = "Cold"
        tea_recommendation = "Hot Estate Classic with ginger and honey - perfect for cold weather warmth"
    elif temperature < 25:
        condition = "Pleasant"
        tea_recommendation = "Hot Estate Premium with cardamom - ideal for pleasant temperatures"
    elif temperature < 30:
        condition = "Warm"
        tea_recommendation = "Iced Estate Tea with mint and lemon - refreshing for warm weather"
    else:
        condition = "Hot"
        tea_recommendation = "Cold Brew Estate Tea with ice and a hint of lime - stay cool in the heat"
    
    return WeatherResponse(
        place=place,
        temperature=temperature,
        condition=condition,
        tea_recommendation=tea_recommendation
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
        # Create Razorpay order
        order_data = {
            "amount": request.amount * 100,  # Convert to paise
            "currency": "INR",
            "payment_capture": 1,
            "notes": {
                "customer_name": request.customer_name,
                "customer_phone": request.customer_phone,
                "customer_address": request.customer_address
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