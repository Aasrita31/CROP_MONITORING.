from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.services.health_service import HealthService
from app.models.village import Village
from app.schemas.response_models import HealthSummaryResponse

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/summary", response_model=HealthSummaryResponse)
def get_health_summary(db: Session = Depends(get_db)):
    return HealthService.get_health_summary(db)

@router.get("/village/{village_id}")
def get_village_health_metrics(village_id: int, db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    
    return HealthService.get_health_metrics(db, "village", str(village_id))
