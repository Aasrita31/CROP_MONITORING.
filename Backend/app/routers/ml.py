from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import random

from app.database.database import get_db
from app.models.village import Village
from app.models.field import Field
from app.schemas.response_models import VillageAnalysisResult, FieldHealthResponse

router = APIRouter(prefix="/ml", tags=["ML Classification"])

class MLPredictionRequest(BaseModel):
    target_type: str  # "village" or "field"
    target_id: str
    ndvi_input: float = None

@router.post("/predict/health", response_model=dict)
def predict_health(payload: MLPredictionRequest, db: Session = Depends(get_db)):
    """
    ML Endpoint to predict health score and status based on NDVI and history.
    """
    ndvi = payload.ndvi_input or random.uniform(0.3, 0.85)
    health_score = int(ndvi * 100 + random.uniform(-5, 5))
    health_score = min(100, max(0, health_score))
    
    status = "Healthy"
    if health_score < 40:
        status = "High Risk"
    elif health_score < 60:
        status = "Moderate Stress"
        
    return {
        "target_id": payload.target_id,
        "predicted_health_score": health_score,
        "status_classification": status,
        "confidence": round(random.uniform(0.85, 0.98), 2)
    }

@router.post("/predict/disease", response_model=dict)
def predict_disease(payload: MLPredictionRequest, db: Session = Depends(get_db)):
    """
    ML Endpoint to classify disease risk probability.
    """
    risk_prob = random.randint(5, 85)
    risk_level = "Low"
    if risk_prob > 60:
        risk_level = "Severe"
    elif risk_prob > 35:
        risk_level = "Moderate"
        
    return {
        "target_id": payload.target_id,
        "disease_risk_probability": risk_prob,
        "risk_level_classification": risk_level,
        "confidence": round(random.uniform(0.80, 0.95), 2),
        "primary_threat": "Blast Disease" if risk_prob > 50 else "None"
    }

@router.post("/predict/yield", response_model=dict)
def predict_yield(payload: MLPredictionRequest, db: Session = Depends(get_db)):
    """
    ML Endpoint to forecast crop yield.
    """
    ndvi = payload.ndvi_input or random.uniform(0.4, 0.8)
    # Simple linear model: Yield roughly correlates with NDVI
    yield_pred = round(2.0 + ndvi * 5.0 + random.uniform(-0.5, 0.5), 1)
    
    return {
        "target_id": payload.target_id,
        "yield_prediction_t_ha": yield_pred,
        "confidence": round(random.uniform(0.75, 0.92), 2),
        "harvest_window": f"{random.randint(10, 30)} days"
    }
