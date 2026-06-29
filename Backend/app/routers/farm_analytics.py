from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.digital_twin import (
    FarmerField, FieldMetric, SatelliteHistory, WeatherHistory,
    SoilHistory, CropHistory, AIRecommendations, FarmTimeline
)

router = APIRouter(prefix="/farms/{field_id}", tags=["Farm Analytics"])

def get_field_or_404(db: Session, field_id: str):
    field = db.query(FarmerField).filter(FarmerField.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Farm not found")
    return field

@router.get("/analytics")
def get_farm_analytics(field_id: str, db: Session = Depends(get_db)):
    field = get_field_or_404(db, field_id)
    # Get the latest metric
    metric = db.query(FieldMetric).filter(FieldMetric.field_id == field_id).order_by(FieldMetric.calculated_at.desc()).first()
    if not metric:
        return {"ndvi": 0, "ndmi": 0, "evi": 0, "savi": 0, "health_score": 0}
    return {
        "ndvi": metric.ndvi,
        "ndmi": metric.ndmi,
        "evi": metric.evi,
        "savi": metric.savi,
        "health_score": metric.health_score,
        "health_status": metric.health_status,
        "calculated_at": metric.calculated_at
    }

@router.get("/history")
def get_farm_history(field_id: str, db: Session = Depends(get_db)):
    field = get_field_or_404(db, field_id)
    metrics = db.query(FieldMetric).filter(FieldMetric.field_id == field_id).order_by(FieldMetric.calculated_at.asc()).limit(30).all()
    
    dates = []
    ndvi_trend = []
    ndmi_trend = []
    health_trend = []
    for m in metrics:
        dates.append(m.calculated_at.strftime("%Y-%m-%d"))
        ndvi_trend.append(m.ndvi or 0)
        ndmi_trend.append(m.ndmi or 0)
        health_trend.append(m.health_score or 0)
        
    return {
        "dates": dates,
        "ndvi_trend": ndvi_trend,
        "ndmi_trend": ndmi_trend,
        "health_trend": health_trend
    }

@router.get("/weather")
def get_farm_weather(field_id: str, db: Session = Depends(get_db)):
    field = get_field_or_404(db, field_id)
    weather = db.query(WeatherHistory).filter(WeatherHistory.field_id == field_id).order_by(WeatherHistory.date.desc()).first()
    if not weather:
        # Default mock weather if scheduler hasn't run
        return {
            "temperature": 31.0,
            "humidity": 68.0,
            "wind_speed": 12.5,
            "solar_radiation": 4.5,
            "rain_probability": 10.0,
            "date": None
        }
    return {
        "temperature": weather.temperature,
        "humidity": weather.humidity,
        "wind_speed": weather.wind_speed,
        "solar_radiation": weather.solar_radiation,
        "rain_probability": weather.rain_probability,
        "date": weather.date
    }

@router.get("/soil")
def get_farm_soil(field_id: str, db: Session = Depends(get_db)):
    field = get_field_or_404(db, field_id)
    soil = db.query(SoilHistory).filter(SoilHistory.field_id == field_id).order_by(SoilHistory.date.desc()).first()
    if not soil:
        # Default mock soil
        return {
            "organic_carbon": 0.8,
            "nitrogen": 120,
            "phosphorus": 45,
            "potassium": 210,
            "ph": 6.8,
            "salinity": 1.2,
            "date": None
        }
    return {
        "organic_carbon": soil.organic_carbon,
        "nitrogen": soil.nitrogen,
        "phosphorus": soil.phosphorus,
        "potassium": soil.potassium,
        "ph": soil.ph,
        "salinity": soil.salinity,
        "date": soil.date
    }

@router.get("/ai")
def get_farm_ai(field_id: str, db: Session = Depends(get_db)):
    field = get_field_or_404(db, field_id)
    ai = db.query(AIRecommendations).filter(AIRecommendations.field_id == field_id).order_by(AIRecommendations.date.desc()).first()
    if not ai:
        return {
            "disease_risk": 15.0,
            "pest_risk": 10.0,
            "water_stress_alert": False,
            "recommendation": "Maintain current irrigation and fertilizer schedule.",
            "date": None
        }
    return {
        "disease_risk": ai.disease_risk,
        "pest_risk": ai.pest_risk,
        "water_stress_alert": ai.water_stress_alert,
        "recommendation": ai.recommendation,
        "date": ai.date
    }

@router.get("/timeline")
def get_farm_timeline(field_id: str, db: Session = Depends(get_db)):
    field = get_field_or_404(db, field_id)
    events = db.query(FarmTimeline).filter(FarmTimeline.field_id == field_id).order_by(FarmTimeline.event_date.asc()).all()
    if not events:
        # Generate default timeline from sowing date if it exists
        return [
            {
                "event_name": "Farm Registered",
                "event_date": field.created_at.strftime("%Y-%m-%d") if field.created_at else "Unknown",
                "status": "completed",
                "description": "Digital boundary mapped successfully."
            }
        ]
    return [
        {
            "event_name": e.event_name,
            "event_date": e.event_date.strftime("%Y-%m-%d"),
            "status": e.status,
            "description": e.description
        } for e in events
    ]
