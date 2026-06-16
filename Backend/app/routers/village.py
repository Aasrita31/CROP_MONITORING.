from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.village import Village
from app.models.field import Field
from app.models.district import District
from app.schemas.response_models import (
    VillageBase, FieldBase, VillageSearchRequest, 
    VillageSearchResponse, VillageAnalysisResult
)
from typing import List, Dict, Any
import requests

router = APIRouter(prefix="/villages", tags=["Villages"])
search_router = APIRouter(prefix="/village", tags=["Village Search"])
analysis_router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.get("", response_model=List[VillageBase])
def get_villages(db: Session = Depends(get_db)):
    return db.query(Village).all()

@router.get("/{village_id}", response_model=VillageBase)
def get_village(village_id: int, db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    return village

@router.get("/{village_id}/fields", response_model=List[FieldBase])
def get_village_fields(village_id: int, db: Session = Depends(get_db)):
    fields = db.query(Field).filter(Field.village_id == village_id).all()
    return fields

@router.get("/{village_id}/analysis")
def get_village_analysis(village_id: int, db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    
    # Fetch fields under this village to compute analytics
    fields = db.query(Field).filter(Field.village_id == village_id).all()
    total_area = sum(f.area for f in fields)
    
    # Calculate health statuses distribution
    status_counts = {"Healthy": 0, "Nutrient Stress": 0, "Water Stress": 0, "Disease Risk": 0, "Pest Risk": 0}
    for f in fields:
        status_counts[f.status] = status_counts.get(f.status, 0) + 1
        
    return {
        "village_id": village.id,
        "name": village.name,
        "ndvi": village.ndvi,
        "health_score": village.health,
        "total_fields": len(fields),
        "total_area_ha": round(total_area, 2),
        "disease_risk": village.disease_risk,
        "water_stress": village.water_stress,
        "harvest_readiness": village.harvest_ready,
        "status_distribution": status_counts
    }

@search_router.post("/search", response_model=VillageSearchResponse)
def search_village(payload: VillageSearchRequest, db: Session = Depends(get_db)):
    village_name = payload.village.strip()
    
    # 1. Search database first
    village = db.query(Village).filter(Village.name.ilike(f"%{village_name}%")).first()
    if village:
        district = db.query(District).filter(District.id == village.district_id).first()
        dist_name = district.name if district else "Unknown District"
        return {
            "district": dist_name,
            "latitude": village.lat,
            "longitude": village.lng
        }
        
    # 2. OSM Nominatim dynamic geocoding
    try:
        headers = {"User-Agent": "AgriTwin-Crop-Monitor/1.0"}
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={requests.utils.quote(village_name)}+Andhra+Pradesh&limit=1"
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if data:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                display_name = data[0]["display_name"]
                
                district_name = "Krishna" # Default
                for d in ["East Godavari", "West Godavari", "Krishna", "Konaseema", "Nellore", "Guntur", "Prakasam", "Chittoor", "Anantapur", "Kurnool", "Kadapa", "Visakhapatnam", "Srikakulam", "Vizianagaram"]:
                    if d.lower() in display_name.lower():
                        district_name = d
                        break
                return {
                    "district": district_name,
                    "latitude": lat,
                    "longitude": lon
                }
    except Exception as e:
        print(f"Nominatim geocoding failed: {e}")
        
    # 3. Fallback to Vijayawada center coordinates
    return {
        "district": "Krishna",
        "latitude": 16.5,
        "longitude": 80.6
    }

@analysis_router.get("/village", response_model=VillageAnalysisResult)
def get_analysis_village(name: str = None, village_id: int = None, db: Session = Depends(get_db)):
    village = None
    if village_id:
        village = db.query(Village).filter(Village.id == village_id).first()
    elif name:
        village = db.query(Village).filter(Village.name.ilike(f"%{name}%")).first()
        
    if village:
        y_val = 5.8
        try:
            y_val = float(village.yield_pred.split(' ')[0])
        except:
            pass
            
        risk_val = 12
        try:
            cleaned = village.disease_risk.replace('Low (', '').replace('Moderate (', '').replace('High (', '').replace('Severe (', '').replace('%)', '')
            risk_val = int(cleaned)
        except:
            pass

        stress_val = 15
        if village.water_stress == "None":
            stress_val = 8
        elif village.water_stress == "Low":
            stress_val = 18
        elif village.water_stress == "Moderate":
            stress_val = 35
        else:
            stress_val = 78

        return {
            "ndvi": village.ndvi,
            "healthScore": village.health,
            "diseaseRisk": risk_val,
            "waterStress": stress_val,
            "yieldPrediction": y_val
        }
        
    return {
        "ndvi": 0.68,
        "healthScore": 82,
        "diseaseRisk": 15,
        "waterStress": 22,
        "yieldPrediction": 5.4
    }
