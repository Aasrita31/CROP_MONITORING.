from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

from app.database.database import engine, Base, SessionLocal
from app.database.seeder import seed_data
import app.models
from app.routers import district, village, field, satellite, ndvi, health, dashboard, ml, tts, farmer_fields, farm_analytics
from app.routers import auth as auth_router
from app.routers import profile as profile_router
from app.routers import community as community_router
from app.routers import leaderboard as leaderboard_router
from app.routers import notifications as notifications_router

app = FastAPI(
    title="AgriTwin Intelligence Platform API",
    description="Scalable FastAPI digital twin backend with authentication, farmer identity, and community features",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://10.26.86.228:8080",
    ],
    allow_origin_regex="https://.*\\.ngrok-free\\.(dev|app)",
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
        
    # Start background scheduler
    from app.services.satellite_scheduler import start_scheduler
    start_scheduler()

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
app.include_router(tts.router, prefix="/api")
app.include_router(farmer_fields.router, prefix="/api")
app.include_router(farm_analytics.router, prefix="/api")

# New: Auth, Profile, Community, Leaderboard, Notifications
app.include_router(auth_router.router, prefix="/api")
app.include_router(profile_router.router, prefix="/api")
app.include_router(community_router.router, prefix="/api")
app.include_router(leaderboard_router.router, prefix="/api")
app.include_router(notifications_router.router, prefix="/api")

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
    import requests
    import datetime

    # Map district ID or name to weather data
    loc_name = "Tirupati Region"
    lat, lon = 13.6288, 79.4192 # default: Tirupati
    
    loc_lower = location.lower()
    if "east godavari" in loc_lower or location == "1":
        loc_name = "East Godavari"
        lat, lon = 16.9200, 81.8500
    elif "west godavari" in loc_lower or location == "2":
        loc_name = "West Godavari"
        lat, lon = 16.8200, 81.2500
    elif "krishna" in loc_lower or location == "3":
        loc_name = "Krishna"
        lat, lon = 16.4300, 80.9900
    elif "konaseema" in loc_lower or location == "4":
        loc_name = "Konaseema"
        lat, lon = 16.5900, 81.8700
    elif "nellore" in loc_lower or location == "5":
        loc_name = "Nellore"
        lat, lon = 14.4455, 79.9865
    else:
        loc_name = location.title()

    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto"
        res = requests.get(url, timeout=4)
        if res.status_code == 200:
            data = res.json()
            current_data = data.get("current", {})
            daily_data = data.get("daily", {})

            # Map daily forecast to match frontend structure
            forecast_days = []
            days_of_week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            for idx in range(min(7, len(daily_data.get("time", [])))):
                date_str = daily_data["time"][idx]
                try:
                    dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
                    day_name = dt.strftime("%a")
                    if idx == 0:
                        day_name = "Today"
                except:
                    day_name = days_of_week[idx % 7]
                
                temp_max = daily_data["temperature_2m_max"][idx]
                precip_prob = daily_data.get("precipitation_probability_max", [0]*7)[idx]
                
                # Determine icon and label based on precipitation probability
                if precip_prob > 60:
                    icon = "CloudRain"
                    label = "Rainy"
                elif precip_prob > 25:
                    icon = "CloudSun"
                    label = "Mostly Cloudy"
                else:
                    icon = "Sun"
                    label = "Sunny"
                    
                forecast_days.append({
                    "d": day_name,
                    "t": int(temp_max),
                    "icon": icon,
                    "label": label,
                    "rain": int(precip_prob)
                })

            current_temp = current_data.get("temperature_2m", 31.0)
            return {
                "forecast": forecast_days,
                "current": {
                    "wind": f"{current_data.get('wind_speed_10m', 12.0)} km/h",
                    "humidity": f"{current_data.get('relative_humidity_2m', 68.0)}%",
                    "soilTemp": f"{round(current_temp - 2.5)}°C",
                    "location": loc_name,
                    "temp": f"{current_temp}°C"
                }
            }
    except Exception as e:
        print("Open-Meteo fetch failed, falling back to static weather:", e)

    # Fallback to hardcoded mock weather in case of connection failure
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
