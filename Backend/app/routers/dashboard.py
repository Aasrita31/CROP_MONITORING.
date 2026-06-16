from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.services.dashboard_service import DashboardService
from app.services.health_service import HealthService
from app.schemas.response_models import DashboardOverview, AlertResponse, VillageComparison, HealthSummaryResponse
from typing import List

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/overview", response_model=DashboardOverview)
def get_dashboard_overview(db: Session = Depends(get_db)):
    return DashboardService.get_overview_stats(db)

@router.get("/rice-bowl-index", response_model=HealthSummaryResponse)
def get_rice_bowl_index(db: Session = Depends(get_db)):
    # This matches the HealthSummaryResponse structure for consistency
    return HealthService.get_health_summary(db)

@router.get("/alerts", response_model=List[AlertResponse])
def get_dashboard_alerts(db: Session = Depends(get_db)):
    return DashboardService.get_alerts(db)

@router.get("/comparison", response_model=List[VillageComparison])
def get_village_comparison(db: Session = Depends(get_db)):
    return DashboardService.get_village_comparison(db)
