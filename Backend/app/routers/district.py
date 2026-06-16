from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.district import District
from app.models.village import Village
from app.schemas.response_models import DistrictBase, DistrictSummary
from typing import List

router = APIRouter(prefix="/districts", tags=["Districts"])

@router.get("", response_model=List[DistrictBase])
def get_districts(db: Session = Depends(get_db)):
    return db.query(District).all()

@router.get("/{district_id}", response_model=DistrictBase)
def get_district(district_id: int, db: Session = Depends(get_db)):
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    return district

@router.get("/{district_id}/summary", response_model=DistrictSummary)
def get_district_summary(district_id: int, db: Session = Depends(get_db)):
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    
    villages = db.query(Village).filter(Village.district_id == district_id).all()
    avg_ndvi = sum(v.ndvi for v in villages) / len(villages) if villages else 0.0
    
    return {
        "id": district.id,
        "name": district.name,
        "average_ndvi": round(avg_ndvi, 2),
        "paddy_area": district.area,
        "yield_forecast": district.yield_prediction,
        "disease_risk": district.risk
    }
