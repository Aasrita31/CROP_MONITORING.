from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import math
import random

app = FastAPI(
    title="AgriTwin API",
    description="AI Powered Farm Analytics Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Static Data
# -----------------------------

WEATHER_DAYS = [
    { "d": "Today", "t": 29, "icon": "Sun", "label": "Sunny", "rain": 0 },
    { "d": "Tue", "t": 28, "icon": "CloudSun", "label": "Partly cloudy", "rain": 10 },
    { "d": "Wed", "t": 26, "icon": "CloudRain", "label": "Light rain", "rain": 70 },
    { "d": "Thu", "t": 25, "icon": "CloudRain", "label": "Showers", "rain": 85 },
    { "d": "Fri", "t": 27, "icon": "CloudSun", "label": "Mostly sunny", "rain": 20 },
    { "d": "Sat", "t": 30, "icon": "Sun", "label": "Hot", "rain": 5 },
    { "d": "Sun", "t": 31, "icon": "Sun", "label": "Hot", "rain": 0 },
]

STATE_NDVI_DATA = {
    "pb": { "ndvi": 0.78, "crop": "Wheat", "acreage": "3.5M ha", "status": "Optimal", "moisture": 72 },
    "hr": { "ndvi": 0.74, "crop": "Wheat", "acreage": "2.1M ha", "status": "Optimal", "moisture": 68 },
    "mh": { "ndvi": 0.58, "crop": "Grapes & Cotton", "acreage": "4.2M ha", "status": "Mild Stress", "moisture": 48 },
    "ka": { "ndvi": 0.65, "crop": "Coffee & Rice", "acreage": "2.8M ha", "status": "Good", "moisture": 62 },
    "up": { "ndvi": 0.71, "crop": "Wheat & Sugarcane", "acreage": "9.2M ha", "status": "Good", "moisture": 65 },
    "rj": { "ndvi": 0.38, "crop": "Bajra & Mustard", "acreage": "5.1M ha", "status": "Water Stressed", "moisture": 28 },
    "mp": { "ndvi": 0.62, "crop": "Soybean & Wheat", "acreage": "7.8M ha", "status": "Good", "moisture": 55 },
    "gj": { "ndvi": 0.54, "crop": "Cotton & Groundnut", "acreage": "3.1M ha", "status": "Mild Stress", "moisture": 42 },
    "ap": { "ndvi": 0.64, "crop": "Rice & Maize", "acreage": "4.0M ha", "status": "Good", "moisture": 60 },
    "tn": { "ndvi": 0.66, "crop": "Rice & Coconut", "acreage": "2.2M ha", "status": "Good", "moisture": 63 },
    "wb": { "ndvi": 0.73, "crop": "Rice & Jute", "acreage": "5.5M ha", "status": "Optimal", "moisture": 74 },
    "as": { "ndvi": 0.76, "crop": "Tea & Rice", "acreage": "2.4M ha", "status": "Optimal", "moisture": 80 },
    "jh": { "ndvi": 0.59, "crop": "Rice & Maize", "acreage": "1.8M ha", "status": "Mild Stress", "moisture": 50 },
    "or": { "ndvi": 0.63, "crop": "Rice", "acreage": "3.2M ha", "status": "Good", "moisture": 65 },
    "br": { "ndvi": 0.61, "crop": "Wheat & Rice", "acreage": "3.8M ha", "status": "Good", "moisture": 58 },
    "ct": { "ndvi": 0.60, "crop": "Rice & Pulses", "acreage": "2.5M ha", "status": "Good", "moisture": 62 },
}

VIETNAM_FIELDS = [
    { "id": "A", "name": "Field A — North Block", "x": 4, "y": 6, "w": 26, "h": 30, "dominant": "healthy", "mix": { "healthy": 68, "nutrient": 14, "water": 8, "disease": 5, "pest": 5 }, "health": 92, "disease": 6, "npk": { "n": 82, "p": 71, "k": 65 }, "water": 78, "stage": "Flowering", "yield": 14.2, "harvestIn": 18, "rec": "Maintain current irrigation. Light foliar boron in 3 days." },
    { "id": "B", "name": "Field B — East Block", "x": 34, "y": 10, "w": 28, "h": 24, "dominant": "nutrient", "mix": { "healthy": 38, "nutrient": 42, "water": 8, "disease": 7, "pest": 5 }, "health": 74, "disease": 12, "npk": { "n": 58, "p": 49, "k": 38 }, "water": 64, "stage": "Fruit set", "yield": 11.6, "harvestIn": 24, "rec": "Apply potassium fertilizer (K₂SO₄) at 40 kg/acre this week." },
    { "id": "C", "name": "Field C — Central", "x": 32, "y": 40, "w": 30, "h": 28, "dominant": "water", "mix": { "healthy": 30, "nutrient": 12, "water": 40, "disease": 10, "pest": 8 }, "health": 68, "disease": 16, "npk": { "n": 70, "p": 62, "k": 55 }, "water": 41, "stage": "Vegetative", "yield": 9.8, "harvestIn": 31, "rec": "Drip irrigation 90 min today. Soil moisture critically low." },
    { "id": "D", "name": "Field D — South West", "x": 4, "y": 42, "w": 24, "h": 26, "dominant": "disease", "mix": { "healthy": 25, "nutrient": 15, "water": 12, "disease": 38, "pest": 10 }, "health": 58, "disease": 34, "npk": { "n": 64, "p": 55, "k": 60 }, "water": 70, "stage": "Flowering", "yield": 8.4, "harvestIn": 22, "rec": "Anthracnose risk high. Spray copper oxychloride at dusk." },
    { "id": "E", "name": "Field E — Ridge", "x": 66, "y": 8, "w": 30, "h": 32, "dominant": "healthy", "mix": { "healthy": 62, "nutrient": 12, "water": 10, "disease": 6, "pest": 10 }, "health": 87, "disease": 7, "npk": { "n": 78, "p": 68, "k": 72 }, "water": 74, "stage": "Fruit set", "yield": 13.1, "harvestIn": 20, "rec": "Healthy. Pest pheromone traps recommended on east edge." },
    { "id": "F", "name": "Field F — Greenhouse", "x": 66, "y": 44, "w": 30, "h": 24, "dominant": "pest", "mix": { "healthy": 40, "nutrient": 10, "water": 8, "disease": 8, "pest": 34 }, "health": 71, "disease": 9, "npk": { "n": 75, "p": 70, "k": 68 }, "water": 80, "stage": "Flowering", "yield": 12.3, "harvestIn": 19, "rec": "Mealybug colony detected. Release Cryptolaemus beetles." },
    { "id": "G", "name": "Field G — South", "x": 32, "y": 72, "w": 30, "h": 22, "dominant": "healthy", "mix": { "healthy": 58, "nutrient": 16, "water": 12, "disease": 6, "pest": 8 }, "health": 83, "disease": 8, "npk": { "n": 76, "p": 64, "k": 70 }, "water": 72, "stage": "Vegetative", "yield": 12.7, "harvestIn": 26, "rec": "Optimal. Continue current schedule." }
]

VIETNAM_INSIGHTS = [
    { "tone": "warn", "icon": "FlaskConical", "text": "Field B may require potassium fertilizer within 3 days.", "meta": "Confidence 94%" },
    { "tone": "alert", "icon": "Microscope", "text": "Anthracnose symptoms likely on Field D within 5 days.", "meta": "Disease model • LSTM" },
    { "tone": "info", "icon": "CloudRain", "text": "Rain expected in 48 hours — pause irrigation on C & G.", "meta": "ECMWF + local sensors" },
    { "tone": "good", "icon": "Wheat", "text": "Harvest window for Field A opens in 18 days (Dec 28).", "meta": "Yield: ~14.2 t/ha" },
    { "tone": "warn", "icon": "Bug", "text": "Mealybug pressure rising in Field F greenhouse zone.", "meta": "Trap data ↑ 38%" }
]

VIETNAM_FRUITS = [
    { "id": "A", "img": "fruitHealthy", "label": "Field A", "status": "healthy", "size": 100, "note": "Premium grade · 420g avg" },
    { "id": "B", "img": "fruitNutrient", "label": "Field B", "status": "nutrient", "size": 72, "note": "K deficient · 260g avg" },
    { "id": "C", "img": "fruitWater", "label": "Field C", "status": "water", "size": 78, "note": "Mild dehydration · 310g" },
    { "id": "D", "img": "fruitDisease", "label": "Field D", "status": "disease", "size": 66, "note": "Anthracnose · cull 18%" },
    { "id": "E", "img": "fruitHealthy", "label": "Field E", "status": "healthy", "size": 94, "note": "Grade A · 390g avg" },
    { "id": "F", "img": "fruitWater", "label": "Field F", "status": "pest", "size": 84, "note": "Mealybug scarring · 340g" }
]

def generate_vietnam_trend():
    trend = []
    for i in range(14):
        trend.append({
            "d": f"D{i + 1}",
            "health": 70 + round(math.sin(i / 2) * 6 + i * 0.6),
            "yield": 9.5 + math.sin(i / 3) * 0.8 + i * 0.18,
            "disease": 12 + round(math.cos(i / 2) * 4),
            "pest": 8 + round(math.sin(i / 1.6 + 1) * 3),
            "water": 320 - i * 6 + round(math.sin(i) * 10)
        })
    return trend

def generate_punjab_trend():
    trend = []
    for i in range(14):
        trend.append({
            "d": f"D{i + 1}",
            "health": 80 + round(math.sin(i / 2.5) * 5 + i * 0.5),
            "yield": 4.8 + math.sin(i / 3) * 0.4 + i * 0.08,
            "disease": 8 + round(math.cos(i / 2) * 3),
            "pest": 5 + round(math.sin(i / 2) * 2),
            "water": 120 - i * 2 + round(math.sin(i) * 5)
        })
    return trend

def generate_maharashtra_trend():
    trend = []
    for i in range(14):
        trend.append({
            "d": f"D{i + 1}",
            "health": 76 + round(math.sin(i / 2) * 4 + i * 0.4),
            "yield": 16.0 + math.sin(i / 3) * 1.0 + i * 0.15,
            "disease": 10 + round(math.cos(i / 2) * 5),
            "pest": 6 + round(math.sin(i / 2) * 2),
            "water": 230 - i * 3 + round(math.sin(i) * 8)
        })
    return trend

FARMS_DATA = {
    "pb": {
        "name": "Punjab Wheat Belt",
        "coordinates": "30.901°N · 75.857°E",
        "center": [30.901, 75.857],
        "crop": "Wheat",
        "backdrop": "punjabFarmImg",
        "cropUnit": "t/ha",
        "cropText": "Wheat Crop Quality",
        "cropSubtitle": "AI kernel analysis & grain size morphology",
        "kpis": [
            { "label": "Farm Health Score", "value": 89, "suffix": "/100", "tone": "healthy", "icon": "Leaf", "trend": "+4.1%", "spark": [72,74,78,80,82,85,86,88,89] },
            { "label": "Canopy NDVI", "value": 0.78, "suffix": " index", "tone": "healthy", "icon": "Sparkles", "trend": "+2.2%", "spark": [65,68,70,72,74,76,78] },
            { "label": "Predicted Yield", "value": 5.4, "suffix": " t/ha", "tone": "healthy", "icon": "TrendingUp", "trend": "+0.3 t", "decimals": 1, "spark": [48,50,52,53,54] },
            { "label": "Rust Risk", "value": 12, "suffix": "%", "tone": "disease", "icon": "Microscope", "trend": "−1.5%", "spark": [20,18,16,15,13,12] },
            { "label": "Soil Moisture", "value": 68, "suffix": "%", "tone": "water", "icon": "Droplets", "trend": "+5.4%", "spark": [55,58,62,65,68] },
            { "label": "Harvest Readiness", "value": 35, "suffix": "%", "tone": "healthy", "icon": "Wheat", "trend": "+6.0%", "spark": [15,20,25,30,35] },
            { "label": "Precipitation Risk", "value": 15, "suffix": "%", "tone": "nutrient", "icon": "CloudRain", "trend": "−0.8%", "spark": [20,18,17,15,15] }
        ],
        "fields": [
            { "id": "A", "name": "Field A — Ludhiana North", "x": 4, "y": 6, "w": 26, "h": 30, "dominant": "healthy", "mix": { "healthy": 75, "nutrient": 10, "water": 8, "disease": 4, "pest": 3 }, "health": 94, "disease": 4, "npk": { "n": 85, "p": 74, "k": 68 }, "water": 81, "stage": "Flag Leaf", "yield": 5.8, "harvestIn": 45, "rec": "Soil moisture optimal. Nitrogen fertilizer absorption at peak." },
            { "id": "B", "name": "Field B — Ludhiana East", "x": 34, "y": 10, "w": 28, "h": 24, "dominant": "nutrient", "mix": { "healthy": 45, "nutrient": 38, "water": 7, "disease": 5, "pest": 5 }, "health": 78, "disease": 8, "npk": { "n": 52, "p": 62, "k": 58 }, "water": 72, "stage": "Jointing", "yield": 4.9, "harvestIn": 52, "rec": "Urea split application of 25 kg/acre recommended before irrigation." },
            { "id": "C", "name": "Field C — Central Canal", "x": 32, "y": 40, "w": 30, "h": 28, "dominant": "healthy", "mix": { "healthy": 68, "nutrient": 12, "water": 10, "disease": 5, "pest": 5 }, "health": 86, "disease": 6, "npk": { "n": 78, "p": 70, "k": 65 }, "water": 75, "stage": "Flag Leaf", "yield": 5.5, "harvestIn": 48, "rec": "Maintain regular flow from secondary irrigation canal." },
            { "id": "D", "name": "Field D — Rust Affected", "x": 4, "y": 42, "w": 24, "h": 26, "dominant": "disease", "mix": { "healthy": 32, "nutrient": 12, "water": 12, "disease": 34, "pest": 10 }, "health": 62, "disease": 28, "npk": { "n": 70, "p": 60, "k": 62 }, "water": 74, "stage": "Tillering", "yield": 4.1, "harvestIn": 55, "rec": "Yellow Rust symptoms detected. Spray Propiconazole 25 EC at dusk." },
            { "id": "E", "name": "Field E — Ridge Block", "x": 66, "y": 8, "w": 30, "h": 32, "dominant": "healthy", "mix": { "healthy": 70, "nutrient": 10, "water": 10, "disease": 5, "pest": 5 }, "health": 91, "disease": 5, "npk": { "n": 80, "p": 72, "k": 70 }, "water": 78, "stage": "Flag Leaf", "yield": 5.6, "harvestIn": 44, "rec": "Excellent canopy development. No active stress factors." },
            { "id": "F", "name": "Field F — Tube-well Zone", "x": 66, "y": 44, "w": 30, "h": 24, "dominant": "water", "mix": { "healthy": 40, "nutrient": 15, "water": 32, "disease": 8, "pest": 5 }, "health": 73, "disease": 10, "npk": { "n": 68, "p": 65, "k": 60 }, "water": 48, "stage": "Jointing", "yield": 4.7, "harvestIn": 51, "rec": "Soil moisture low. Activate tube-well irrigation for 120 mins." },
            { "id": "G", "name": "Field G — Southern Block", "x": 32, "y": 72, "w": 30, "h": 22, "dominant": "healthy", "mix": { "healthy": 64, "nutrient": 14, "water": 10, "disease": 6, "pest": 6 }, "health": 85, "disease": 7, "npk": { "n": 75, "p": 68, "k": 66 }, "water": 72, "stage": "Tillering", "yield": 5.3, "harvestIn": 50, "rec": "Healthy growth. Continue scheduled monitoring." }
        ],
        "insights": [
            { "tone": "warn", "icon": "FlaskConical", "text": "Field B needs nitrogen top-dressing (Urea) within 2 days.", "meta": "Leaf color chart index 3.2" },
            { "tone": "alert", "icon": "Microscope", "text": "Yellow Rust spores detected in Field D. Spray Propiconazole immediately.", "meta": "Stripe rust model • 88% confidence" },
            { "tone": "info", "icon": "CloudRain", "text": "Light rain forecast in 48 hours. Postpone scheduled canal irrigation.", "meta": "IMD Ludhiana Regional Center" },
            { "tone": "good", "icon": "Wheat", "text": "Field A enters flag leaf stage. Yield potential looks excellent.", "meta": "Est. yield: 5.8 t/ha" },
            { "tone": "warn", "icon": "Droplets", "text": "Field F soil moisture drop. Water deficit rising.", "meta": "Telemetry sensors • 10m depth" }
        ],
        "qualityFruit": [
            { "id": "A", "img": "wheatEarImg", "label": "Field A", "status": "healthy", "size": 100, "note": "Grade A grains · 48 kernels/ear" },
            { "id": "E", "img": "wheatEarImg", "label": "Field E", "status": "healthy", "size": 92, "note": "Premium yield · 45 kernels/ear" },
            { "id": "B", "img": "wheatEarImg", "label": "Field B", "status": "nutrient", "size": 75, "note": "Nitrogen deficit · thin stems" },
            { "id": "C", "img": "wheatEarImg", "label": "Field C", "status": "healthy", "size": 82, "note": "Optimal size · standard filling" },
            { "id": "F", "img": "wheatEarImg", "label": "Field F", "status": "water", "size": 68, "note": "Water deficit · light shriveling" },
            { "id": "D", "img": "wheatEarImg", "label": "Field D", "status": "disease", "size": 60, "note": "Stripe rust · cull infected grains" }
        ],
        "charts": {
            "healthTrend": generate_punjab_trend()
        }
    },
    "mh": {
        "name": "Maharashtra Grape Orchards",
        "coordinates": "19.752°N · 75.714°E",
        "center": [19.752, 75.714],
        "crop": "Grapes",
        "backdrop": "maharashtraFarmImg",
        "cropUnit": "t/ha",
        "cropText": "Grape Quality Index",
        "cropSubtitle": "Canopy computer-vision cluster morphology",
        "kpis": [
            { "label": "Farm Health Score", "value": 81, "suffix": "/100", "tone": "healthy", "icon": "Leaf", "trend": "+1.5%", "spark": [78,79,80,80,81,81,82,82,81] },
            { "label": "Canopy NDVI", "value": 0.68, "suffix": " index", "tone": "healthy", "icon": "Sparkles", "trend": "+0.8%", "spark": [62,64,65,66,67,68,68] },
            { "label": "Predicted Yield", "value": 18.2, "suffix": " t/ha", "tone": "healthy", "icon": "TrendingUp", "trend": "+1.2 t", "decimals": 1, "spark": [168,172,175,179,182] },
            { "label": "Mildew Risk", "value": 24, "suffix": "%", "tone": "disease", "icon": "Microscope", "trend": "+6.2%", "spark": [12,14,17,19,22,24] },
            { "label": "Water Stress", "value": 38, "suffix": "%", "tone": "water", "icon": "Droplets", "trend": "−3.1%", "spark": [48,42,40,39,38] },
            { "label": "Harvest Readiness", "value": 18, "suffix": "%", "tone": "healthy", "icon": "Wheat", "trend": "+2.0%", "spark": [10,12,14,16,18] },
            { "label": "Weather Risk", "value": 28, "suffix": "%", "tone": "nutrient", "icon": "CloudSun", "trend": "+2.2%", "spark": [20,22,25,27,28] }
        ],
        "fields": [
            { "id": "A", "name": "Field A — Nashik Valley", "x": 4, "y": 6, "w": 26, "h": 30, "dominant": "healthy", "mix": { "healthy": 65, "nutrient": 15, "water": 10, "disease": 5, "pest": 5 }, "health": 88, "disease": 6, "npk": { "n": 78, "p": 72, "k": 75 }, "water": 72, "stage": "Fruit set", "yield": 19.5, "harvestIn": 65, "rec": "Optimal growth. Canopy pruning successfully finished." },
            { "id": "B", "name": "Field B — Table Grape", "x": 34, "y": 10, "w": 28, "h": 24, "dominant": "healthy", "mix": { "healthy": 60, "nutrient": 15, "water": 12, "disease": 7, "pest": 6 }, "health": 84, "disease": 8, "npk": { "n": 74, "p": 70, "k": 80 }, "water": 68, "stage": "Fruit set", "yield": 18.1, "harvestIn": 68, "rec": "Potassium levels ideal for sugars. Maintain irrigation." },
            { "id": "C", "name": "Field C — Cabernet Block", "x": 32, "y": 40, "w": 30, "h": 28, "dominant": "water", "mix": { "healthy": 35, "nutrient": 10, "water": 42, "disease": 8, "pest": 5 }, "health": 66, "disease": 10, "npk": { "n": 70, "p": 64, "k": 68 }, "water": 38, "stage": "Berry sizing", "yield": 15.4, "harvestIn": 72, "rec": "Severe water stress. Run drip irrigation system for 150 mins." },
            { "id": "D", "name": "Field D — Shiraz Block", "x": 4, "y": 42, "w": 24, "h": 26, "dominant": "healthy", "mix": { "healthy": 55, "nutrient": 15, "water": 15, "disease": 8, "pest": 7 }, "health": 80, "disease": 9, "npk": { "n": 72, "p": 68, "k": 76 }, "water": 64, "stage": "Fruit set", "yield": 17.5, "harvestIn": 70, "rec": "Continue routine micro-nutrient foliar spray program." },
            { "id": "E", "name": "Field E — Chardonnay Ridge", "x": 66, "y": 8, "w": 30, "h": 32, "dominant": "healthy", "mix": { "healthy": 62, "nutrient": 12, "water": 12, "disease": 7, "pest": 7 }, "health": 85, "disease": 8, "npk": { "n": 76, "p": 70, "k": 74 }, "water": 70, "stage": "Berry sizing", "yield": 18.7, "harvestIn": 64, "rec": "Healthy vineyard. Apply light nitrogen to support leaf canopy." },
            { "id": "F", "name": "Field F — Mildew Risk", "x": 66, "y": 44, "w": 30, "h": 24, "dominant": "disease", "mix": { "healthy": 30, "nutrient": 12, "water": 10, "disease": 38, "pest": 10 }, "health": 58, "disease": 36, "npk": { "n": 68, "p": 62, "k": 70 }, "water": 72, "stage": "Flowering", "yield": 14.8, "harvestIn": 75, "rec": "Downy Mildew detected. Spray copper-based fungicide immediately." },
            { "id": "G", "name": "Field G — Southern Block", "x": 32, "y": 72, "w": 30, "h": 22, "dominant": "healthy", "mix": { "healthy": 54, "nutrient": 16, "water": 14, "disease": 8, "pest": 8 }, "health": 78, "disease": 9, "npk": { "n": 71, "p": 65, "k": 72 }, "water": 65, "stage": "Flowering", "yield": 16.9, "harvestIn": 74, "rec": "Pruning recommended on lower vines to improve aeration." }
        ],
        "insights": [
            { "tone": "alert", "icon": "Microscope", "text": "High humidity triggers Downy Mildew alert on Field F.", "meta": "Fungicide spray needed immediately" },
            { "tone": "warn", "icon": "Droplets", "text": "Field C vineyard soil moisture below wilt point threshold.", "meta": "Drip line telemetry warning" },
            { "tone": "info", "icon": "CloudSun", "text": "Diurnal temp variation ideal next 5 days — grape sugars rising.", "meta": "Nashik Meteorological Stn" },
            { "tone": "good", "icon": "Wheat", "text": "Field A grape bunches show consistent berry size expansion.", "meta": "CV analysis confidence 91%" },
            { "tone": "warn", "icon": "FlaskConical", "text": "Field E leaf analysis shows early signs of magnesium deficit.", "meta": "Foliar MgSO4 spray recommended" }
        ],
        "qualityFruit": [
            { "id": "A", "img": "grapeClusterImg", "label": "Field A", "status": "healthy", "size": 100, "note": "Grade A bunches · 18mm berry avg" },
            { "id": "E", "img": "grapeClusterImg", "label": "Field E", "status": "healthy", "size": 94, "note": "Excellent size · 17.5mm berry avg" },
            { "id": "B", "img": "grapeClusterImg", "label": "Field B", "status": "healthy", "size": 90, "note": "Table grade · high sugar content" },
            { "id": "D", "img": "grapeClusterImg", "label": "Field D", "status": "healthy", "size": 88, "note": "Wine grade · optimal acidity" },
            { "id": "C", "img": "grapeClusterImg", "label": "Field C", "status": "water", "size": 72, "note": "Mild dehydration · small berries" },
            { "id": "F", "img": "grapeClusterImg", "label": "Field F", "status": "disease", "size": 55, "note": "Mildew scarring · cull infected clusters" }
        ],
        "charts": {
            "healthTrend": generate_maharashtra_trend()
        }
    },
    "vl": {
        "name": "Vinh Long Estate",
        "coordinates": "10.253°N · 105.971°E",
        "center": [10.253, 105.971],
        "crop": "Dragon Fruit",
        "backdrop": "satelliteImg",
        "cropUnit": "t/ha",
        "cropText": "Dragon Fruit Quality",
        "cropSubtitle": "Computer-vision derived fruit morphology",
        "kpis": [
            { "label": "Farm Health Score", "value": 84, "suffix": "/100", "tone": "healthy", "icon": "Leaf", "trend": "+3.2%", "spark": [60,62,65,68,70,73,75,78,80,82,84] },
            { "label": "Crop Quality Score", "value": 91, "suffix": "/100", "tone": "healthy", "icon": "Sparkles", "trend": "+1.8%", "spark": [82,84,85,86,86,88,89,90,90,91,91] },
            { "label": "Predicted Yield", "value": 12.4, "suffix": " t/ha", "tone": "healthy", "icon": "TrendingUp", "trend": "+0.6 t", "decimals": 1, "spark": [10,10.4,10.8,11.1,11.4,11.7,12,12.1,12.3,12.4,12.4] },
            { "label": "Disease Risk", "value": 18, "suffix": "%", "tone": "disease", "icon": "Microscope", "trend": "+4.1%", "spark": [10,11,12,13,14,15,16,17,17,18,18] },
            { "label": "Water Stress", "value": 27, "suffix": "%", "tone": "water", "icon": "Droplets", "trend": "−2.4%", "spark": [40,38,36,34,33,32,31,30,29,28,27] },
            { "label": "Harvest Readiness", "value": 62, "suffix": "%", "tone": "healthy", "icon": "Wheat", "trend": "+5.0%", "spark": [40,44,48,50,52,55,57,58,60,61,62] },
            { "label": "Weather Risk", "value": 22, "suffix": "%", "tone": "nutrient", "icon": "CloudSun", "trend": "+1.2%", "spark": [15,16,17,18,19,20,21,21,22,22,22] }
        ],
        "fields": VIETNAM_FIELDS,
        "insights": VIETNAM_INSIGHTS,
        "qualityFruit": VIETNAM_FRUITS,
        "charts": {
            "healthTrend": generate_vietnam_trend()
        }
    }
}

# -----------------------------
# Endpoints
# -----------------------------

@app.get("/api/farm/{stateId}", tags=["Farm Analytics"])
def get_farm_data(stateId: str):
    if stateId in FARMS_DATA:
        return FARMS_DATA[stateId]
    
    # Dynamic Fallback for states not explicitly defined
    crop_map = {
        "up": "Sugarcane",
        "ka": "Coffee",
        "hr": "Wheat",
        "gj": "Cotton",
        "rj": "Mustard",
        "mp": "Soybean",
        "ap": "Rice",
        "tn": "Coconut",
        "wb": "Jute",
        "as": "Tea",
        "jh": "Maize",
        "or": "Rice",
        "br": "Rice",
        "ct": "Pulses"
    }
    
    crop = crop_map.get(stateId, "Unknown Crop")
    state_name = stateId.upper()
    
    fallback_data = {
        "name": f"{state_name} Farm Region",
        "coordinates": "Unknown",
        "center": [20.0, 78.0],
        "crop": crop,
        "backdrop": "satelliteImg",
        "cropUnit": "t/ha",
        "cropText": f"{crop} Quality Index",
        "cropSubtitle": "AI generated baseline morphology",
        "kpis": [
            { "label": "Farm Health Score", "value": 75, "suffix": "/100", "tone": "healthy", "icon": "Leaf", "trend": "+1.0%", "spark": [70,71,72,73,74,75] },
            { "label": "Canopy NDVI", "value": 0.60, "suffix": " index", "tone": "healthy", "icon": "Sparkles", "trend": "+0.5%", "spark": [0.55, 0.58, 0.60] },
            { "label": "Predicted Yield", "value": 8.5, "suffix": " t/ha", "tone": "healthy", "icon": "TrendingUp", "trend": "+0.2 t", "decimals": 1, "spark": [8.0, 8.2, 8.5] },
            { "label": "Disease Risk", "value": 20, "suffix": "%", "tone": "disease", "icon": "Microscope", "trend": "-2%", "spark": [25, 22, 20] },
            { "label": "Water Stress", "value": 45, "suffix": "%", "tone": "water", "icon": "Droplets", "trend": "+5%", "spark": [30, 35, 45] },
            { "label": "Harvest Readiness", "value": 40, "suffix": "%", "tone": "healthy", "icon": "Wheat", "trend": "+10%", "spark": [10, 20, 30, 40] },
            { "label": "Weather Risk", "value": 15, "suffix": "%", "tone": "nutrient", "icon": "CloudSun", "trend": "0%", "spark": [15, 15, 15] }
        ],
        "fields": [
            { "id": "A", "name": f"Field A — {state_name} Main Block", "x": 30, "y": 30, "w": 40, "h": 40, "dominant": "healthy", "mix": { "healthy": 70, "nutrient": 10, "water": 10, "disease": 5, "pest": 5 }, "health": 85, "disease": 8, "npk": { "n": 75, "p": 70, "k": 65 }, "water": 70, "stage": "Vegetative", "yield": 8.5, "harvestIn": 60, "rec": "Continue routine monitoring. Conditions are nominal." }
        ],
        "insights": [
            { "tone": "info", "icon": "CloudSun", "text": "Basic monitoring active for this region.", "meta": "Baseline model" }
        ],
        "qualityFruit": [
            { "id": "A", "img": "wheatEarImg", "label": "Field A", "status": "healthy", "size": 100, "note": "Standard quality expected" }
        ],
        "charts": {
            "healthTrend": generate_punjab_trend() # Mock trend
        }
    }
    return fallback_data

@app.get("/api/weather/{location}", tags=["Weather"])
def get_weather(location: str):
    return {
        "forecast": WEATHER_DAYS,
        "current": {
            "wind": "9 km/h",
            "humidity": "55%",
            "soilTemp": "23°C",
            "location": location,
            "temp": "32°C"
        }
    }

@app.get("/api/national/ndvi", tags=["National Monitor"])
def get_national_ndvi():
    return STATE_NDVI_DATA

# -----------------------------
# AI Chat
# -----------------------------

class ChatMessage(BaseModel):
    text: str

CHAT_HISTORY = {
    "pb": [
        { "who": "ai", "text": "Good morning ☀️ AgriTwin has synced the 10m Sentinel-2 satellite feed for Punjab Wheat Belt. Selected crop profile: Wheat." },
        { "who": "me", "text": "Why is Field D highlighted in red?" },
        { "who": "ai", "text": "Stripe rust symptoms detected in 34% of Field D. Spectral signature reveals early fungal spore colonization. Spray Propiconazole 25 EC at 200 ml/acre within 24 hours to prevent lodging." }
    ],
    "mh": [
        { "who": "ai", "text": "Good morning ☀️ AgriTwin has synced the 10m Sentinel-2 satellite feed for Maharashtra Grape Orchards. Selected crop profile: Grapes." },
        { "who": "me", "text": "What is the status of Field F?" },
        { "who": "ai", "text": "High humidity and cool nights have triggered a Downy Mildew risk of 36% in Field F. I recommend canopy leaf thinning to improve aeration, and a precautionary copper-based organic spray." }
    ],
    "vl": [
        { "who": "ai", "text": "Good morning ☀️ AgriTwin has synced the 10m Sentinel-2 satellite feed for Vinh Long Estate. Selected crop profile: Dragon Fruit." },
        { "who": "me", "text": "Why is Field B health dropping?" },
        { "who": "ai", "text": "Leaf-tissue NDVI shows potassium deficiency in 42% of Field B. Recommend K₂SO₄ 40 kg/acre within 3 days. Expected recovery: 11 days." }
    ]
}

@app.get("/api/ai/chat/{farmId}", tags=["AI Assistant"])
def get_chat_history(farmId: str):
    if farmId not in CHAT_HISTORY:
        # Provide a default
        return [
            { "who": "ai", "text": f"Good morning! I am ready to assist you with your farm {farmId}." }
        ]
    return CHAT_HISTORY[farmId]

@app.post("/api/ai/chat/{farmId}", tags=["AI Assistant"])
def post_chat_message(farmId: str, message: ChatMessage):
    # Simulated AI response
    responses = [
        "I've updated the growth models with your latest parameters.",
        "Based on satellite telemetry, soil moisture is holding steady.",
        "That's a great question. The recent temperature drops might slow down vegetative growth slightly.",
        "I have scheduled an automated drone survey for that sector tomorrow morning."
    ]
    return {
        "reply": {
            "who": "ai",
            "text": random.choice(responses)
        }
    }

@app.post("/api/farm/{farmId}/field", tags=["Farm Management"])
def add_farm_field(farmId: str):
    return {"message": "Field added successfully"}
