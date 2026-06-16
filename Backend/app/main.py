from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

from app.database.database import engine, Base, SessionLocal
from app.database.seeder import seed_data
import app.models
from app.routers import district, village, field, satellite, ndvi, health, dashboard, ml

app = FastAPI(
    title="Andhra Pradesh Paddy Crop Monitoring Platform API",
    description="Scalable FastAPI digital twin backend for paddy crop monitoring in AP",
    version="2.0.0"
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup DB initialization & seeding
@app.on_event("startup")
def on_startup():
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Run seeder
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()

# Include Routers with /api prefix
app.include_router(district.router, prefix="/api")
app.include_router(village.router, prefix="/api")
app.include_router(village.search_router, prefix="/api")
app.include_router(village.analysis_router, prefix="/api")
app.include_router(field.router, prefix="/api")
app.include_router(satellite.router, prefix="/api")
app.include_router(ndvi.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(ml.router, prefix="/api")

# ------------------------------------------------------------------
# Weather & AI Assistant Backwards Compatibility Endpoints
# ------------------------------------------------------------------

WEATHER_DAYS = [
    { "d": "Today", "t": 31, "icon": "Sun", "label": "Sunny", "rain": 0 },
    { "d": "Wed", "t": 32, "icon": "CloudSun", "label": "Mostly Sunny", "rain": 10 },
    { "d": "Thu", "t": 30, "icon": "CloudRain", "label": "Light Rain", "rain": 40 },
    { "d": "Fri", "t": 28, "icon": "CloudRain", "label": "Thundershowers", "rain": 80 },
    { "d": "Sat", "t": 29, "icon": "CloudSun", "label": "Partly Cloudy", "rain": 25 },
    { "d": "Sun", "t": 32, "icon": "Sun", "label": "Sunny", "rain": 0 },
    { "d": "Mon", "t": 33, "icon": "Sun", "label": "Hot & Sunny", "rain": 5 },
]

@app.get("/api/weather/{location}", tags=["Weather"])
def get_weather(location: str):
    # Map district ID or name to weather data
    loc_name = "Vijayawada Region"
    if location == "1":
        loc_name = "East Godavari"
    elif location == "2":
        loc_name = "West Godavari"
    elif location == "3":
        loc_name = "Krishna"
    elif location == "4":
        loc_name = "Konaseema"
    elif location == "5":
        loc_name = "Nellore"
        
    return {
        "forecast": WEATHER_DAYS,
        "current": {
            "wind": "12 km/h",
            "humidity": "68%",
            "soilTemp": "28°C",
            "location": loc_name,
            "temp": "31°C"
        }
    }

class ChatMessage(BaseModel):
    text: str

CHAT_HISTORY = {
    "1": [
        { "who": "ai", "text": "Good morning ☀️ synced 10m Sentinel-2 satellite feed for East Godavari Paddy monitoring. Crop: Paddy (Rice)." },
        { "who": "me", "text": "What is the status of Field A?" },
        { "who": "ai", "text": "Field A (Kadiyam) is in optimal condition with an average NDVI of 0.82. Growth stage: Panicle Initiation. No active stress detected." }
    ],
    "5": [
        { "who": "ai", "text": "Good morning ☀️ synced 10m Sentinel-2 satellite feed for Nellore Paddy monitoring. Crop: Paddy (Rice)." },
        { "who": "me", "text": "Why is Indukurpet showing low NDVI?" },
        { "who": "ai", "text": "Indukurpet Region is experiencing severe water stress. Average NDVI is 0.40. Active disease blast spores have been predicted in 80% of fields. I recommend copper oxychloride spray and immediate canal water release." }
    ]
}

@app.get("/api/ai/chat/{farmId}", tags=["AI Assistant"])
def get_chat_history(farmId: str):
    if farmId not in CHAT_HISTORY:
        # Provide a default context for other districts
        return [
            { "who": "ai", "text": f"Good morning! I am ready to assist you with AP Paddy Crop Monitoring diagnostics for sector {farmId}." }
        ]
    return CHAT_HISTORY[farmId]

@app.post("/api/ai/chat/{farmId}", tags=["AI Assistant"])
def post_chat_message(farmId: str, message: ChatMessage):
    responses = [
        "Urea top-dressing is recommended to elevate nitrogen metrics across stressed blocks.",
        "Based on NDVI diagnostics, the harvest window for East Godavari is optimal in 20 days.",
        "Leaf telemetry indicates slight moisture stress. Running drip lines for 90 mins is recommended.",
        "Fungal alert: Please schedule fungicide spray for Nellore fields to prevent spread of blast."
    ]
    return {
        "reply": {
            "who": "ai",
            "text": random.choice(responses)
        }
    }
