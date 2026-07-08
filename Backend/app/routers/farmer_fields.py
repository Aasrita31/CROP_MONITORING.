from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import datetime
import uuid

from app.database.database import get_db
from app.models.digital_twin import FarmerField, Farmer
from app.services.geometry_service import geometry_service

router = APIRouter(prefix="/farmer-fields", tags=["Farmer Fields"])

from pydantic import BaseModel

class FarmerCreateRequest(BaseModel):
    name: str
    phone: str
    aadhaar: str
    address: str = None
    district: str = None
    gender: str = None

from app.auth.security import get_current_user
from app.models.user import User

def get_farmer_for_user(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == str(user.id)).first()
    if not farmer:
        profile = user.profile
        farmer = Farmer(
            id=str(user.id),
            user_id=user.id,
            name=profile.full_name if profile else "Farmer",
            email=user.email,
            phone=user.phone,
            village=profile.village if profile else None,
            district=profile.district if profile else None,
            state=profile.state if profile else None
        )
        db.add(farmer)
        db.commit()
        db.refresh(farmer)
    return farmer

@router.get("", response_model=List[Dict[str, Any]])
def get_fields(farmer: Farmer = Depends(get_farmer_for_user), db: Session = Depends(get_db)):
    fields = db.query(FarmerField).filter(FarmerField.farmer_id == farmer.id).all()
    
    result = []
    for f in fields:
        result.append({
            "id": f.id,
            "name": f.name,
            "polygon": f.polygon,
            "centroid": f.centroid,
            "areaAcres": f.area_acres,
            "areaHectares": f.area_hectares,
            "villageName": f.village_name,
            "districtName": f.district_name,
            "landStatus": f.land_status,
            "cropName": f.crop_name,
            "variety": f.variety,
            "sowingDate": f.sowing_date,
            "irrigationType": f.irrigation_type,
            "farmingType": f.farming_type,
            "createdAt": f.created_at.isoformat() if f.created_at else None
        })
    return result

@router.post("")
def create_field(payload: Dict[str, Any], farmer: Farmer = Depends(get_farmer_for_user), db: Session = Depends(get_db)):
    polygon = payload.get("polygon")
    centroid = geometry_service.calculate_centroid(polygon) if polygon else None
    
    field = FarmerField(
        id=payload.get("id", str(uuid.uuid4())),
        farmer_id=farmer.id,
        name=payload.get("name", "New Field"),
        polygon=polygon,
        centroid=centroid,
        area_acres=payload.get("areaAcres", 0.0),
        area_hectares=payload.get("areaHectares", 0.0),
        village_name=payload.get("villageName", ""),
        district_name=payload.get("districtName", ""),
        land_status=payload.get("landStatus", "sown"),
        crop_name=payload.get("cropName"),
        variety=payload.get("variety"),
        sowing_date=payload.get("sowingDate"),
        irrigation_type=payload.get("irrigationType"),
        farming_type=payload.get("farmingType")
    )
    
    db.add(field)
    db.commit()
    db.refresh(field)
    
    return {"message": "Field created successfully", "id": field.id}

@router.post("/detect-field")
def detect_field(payload: Dict[str, float] = Body(...), farmer: Farmer = Depends(get_farmer_for_user), db: Session = Depends(get_db)):
    lat = payload.get("lat")
    lon = payload.get("lon")
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Missing lat or lon")
        
    fields = db.query(FarmerField).filter(FarmerField.farmer_id == farmer.id).all()
    
    for f in fields:
        if f.polygon and geometry_service.point_in_polygon([lat, lon], f.polygon):
            return {"detected": True, "fieldId": f.id, "fieldName": f.name}
            
    return {"detected": False, "message": "Location is not inside any registered field"}

@router.delete("/{field_id}")
def delete_field(field_id: str, db: Session = Depends(get_db)):
    field = db.query(FarmerField).filter(FarmerField.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
        
    db.delete(field)
    db.commit()
    return {"message": "Field deleted successfully"}

@router.post("/register-farmer")
def register_farmer(payload: FarmerCreateRequest, db: Session = Depends(get_db)):
    aadhaar_clean = "".join(filter(str.isdigit, payload.aadhaar))
    if len(aadhaar_clean) != 12:
        raise HTTPException(status_code=400, detail="Aadhaar card number must be exactly 12 digits")

    existing_phone = db.query(Farmer).filter(Farmer.phone == payload.phone).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number is already registered")

    existing_aadhaar = db.query(Farmer).filter(Farmer.aadhaar == aadhaar_clean).first()
    if existing_aadhaar:
        raise HTTPException(status_code=400, detail="Aadhaar card number is already registered")

    farmer = Farmer(
        id=f"farmer-{uuid.uuid4()}",
        name=payload.name,
        phone=payload.phone,
        aadhaar=aadhaar_clean,
        address=payload.address,
        district=payload.district,
        gender=payload.gender
    )
    db.add(farmer)
    db.commit()
    db.refresh(farmer)

    return {"message": "Farmer registered successfully", "farmer_id": farmer.id}

@router.get("/farmer/{farmer_id}")
def get_farmer_details(farmer_id: str, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return {
        "id": farmer.id,
        "name": farmer.name,
        "phone": farmer.phone,
        "aadhaar": farmer.aadhaar,
        "address": farmer.address,
        "district": farmer.district,
        "gender": farmer.gender,
        "createdAt": farmer.created_at.isoformat() if farmer.created_at else None
    }
