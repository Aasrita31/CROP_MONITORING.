from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.services.field_service import FieldService
from app.services.ndvi_service import NdviService
from app.schemas.response_models import FieldBase, FieldHealthResponse, FieldNDVIResponse
from typing import List

router = APIRouter(prefix="/fields", tags=["Fields"])

@router.get("", response_model=List[FieldBase])
def get_fields(db: Session = Depends(get_db)):
    return FieldService.get_all_fields(db)

@router.get("/{field_id}", response_model=FieldBase)
def get_field(field_id: str, db: Session = Depends(get_db)):
    field = FieldService.get_field_by_id(db, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field

@router.get("/{field_id}/health", response_model=FieldHealthResponse)
def get_field_health(field_id: str, db: Session = Depends(get_db)):
    health_details = FieldService.get_field_health_details(db, field_id)
    if not health_details:
        raise HTTPException(status_code=404, detail="Field health details not found")
    return health_details

@router.get("/{field_id}/ndvi", response_model=FieldNDVIResponse)
def get_field_ndvi_history(field_id: str, db: Session = Depends(get_db)):
    field = FieldService.get_field_by_id(db, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    history = NdviService.get_ndvi_history(db, "field", field_id)
    return {
        "field_id": field_id,
        "ndvi": field.ndvi,
        "history": history
    }
