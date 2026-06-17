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
from app.services.sentinel_service import SentinelService
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
    # 1. Resolve location
    location = None
    if name:
        location = SentinelService.get_village_location(name)
    elif village_id:
        village = db.query(Village).filter(Village.id == village_id).first()
        if village:
            location = SentinelService.get_village_location(village.name)
            
    if not location:
        location = SentinelService.get_village_location("Kadiyam")

    # 2. Fetch Bands
    bands = SentinelService.fetch_sentinel2_bands(location['boundingbox'])
    
    # 3. Calculate NDVI
    from app.services.ndvi_service import NdviService
    ndvi_array = NdviService.calculate_ndvi(bands['b4'], bands['b8'])
    
    # 4. Generate Metrics
    metrics = NdviService.get_village_metrics(ndvi_array)
    
    # Estimate yield based on health score (e.g. 100 health = ~7.5 t/ha, 0 = ~1.0 t/ha)
    yield_pred = round(1.0 + (metrics['health_score'] / 100.0) * 6.5, 1)

    return {
        "ndvi": metrics['avg_ndvi'],
        "healthScore": metrics['health_score'],
        "diseaseRisk": metrics['critical_pct'] + (metrics['water_stress_pct'] * 0.5), # heuristic
        "waterStress": metrics['water_stress_pct'] + (metrics['critical_pct'] * 0.2), # heuristic
        "yieldPrediction": yield_pred
    }
