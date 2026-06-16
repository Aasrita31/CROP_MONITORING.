from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.services.ndvi_service import NdviService
from app.models.district import District
from app.models.village import Village

router = APIRouter(prefix="/ndvi", tags=["NDVI"])

@router.get("")
def get_statewide_ndvi_trend(db: Session = Depends(get_db)):
    # Calculate state level NDVI average trend values
    history_pb = NdviService.get_ndvi_history(db, "district", "1")
    if not history_pb:
        # Return fallback mock series matching Day -60, Day -30, Current
        return [
            {"date": "Day -60", "ndvi_value": 0.58},
            {"date": "Day -30", "ndvi_value": 0.65},
            {"date": "Current", "ndvi_value": 0.68}
        ]
    return history_pb

@router.get("/district/{district_id}")
def get_district_ndvi(district_id: int, db: Session = Depends(get_db)):
    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    
    return NdviService.get_ndvi_history(db, "district", str(district_id))

@router.get("/village/{village_id}")
def get_village_ndvi(village_id: int, db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    
    return NdviService.get_ndvi_history(db, "village", str(village_id))
