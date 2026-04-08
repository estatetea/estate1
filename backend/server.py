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
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

@api_router.get("/")
async def root():
    return {"message": "Estate Tea API"}

@api_router.post("/weather", response_model=WeatherResponse)
async def get_weather(request: WeatherRequest):
    """Mock weather endpoint that simulates temperature based on location"""
    place = request.place.lower()
    
    # Simulate temperatures based on common city patterns
    temp_ranges = {
        'mumbai': (25, 35),
        'delhi': (15, 40),
        'bangalore': (18, 28),
        'chennai': (25, 38),
        'kolkata': (20, 35),
        'hyderabad': (20, 35),
        'pune': (18, 32),
        'jaipur': (15, 40),
        'shimla': (5, 20),
        'goa': (25, 33)
    }
    
    # Default temperature range
    temp_min, temp_max = 15, 35
    
    # Check if place matches known cities
    for city, (min_t, max_t) in temp_ranges.items():
        if city in place:
            temp_min, temp_max = min_t, max_t
            break
    
    temperature = round(random.uniform(temp_min, temp_max), 1)
    
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
        place=request.place,
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