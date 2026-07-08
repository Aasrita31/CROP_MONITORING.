from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.auth.security import get_optional_user
from app.models.user import User
from app.services.community_service import get_community_farms, get_village_analytics

router = APIRouter(prefix="/community", tags=["Community"])


@router.get("/farms")
def list_community_farms(
    village: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """List visible community farms, optionally filtered by village/district."""
    farms = get_community_farms(db, village=village, district=district)
    return farms


@router.get("/farms/{farm_id}")
def get_farm_detail(
    farm_id: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """Get details of a specific community farm."""
    from app.models.digital_twin import FarmerField, FieldMetric
    from app.services.community_service import compute_health_rating, compute_yield_rating

    farm = db.query(FarmerField).filter(FarmerField.id == farm_id).first()
    if not farm:
        return {"error": "Farm not found"}

    metric = db.query(FieldMetric).filter(
        FieldMetric.field_id == farm.id
    ).order_by(FieldMetric.calculated_at.desc()).first()

    health_score = metric.health_score if metric else 60
    ndvi = metric.ndvi if metric else 0.55
    rating_label, rating_tone = compute_health_rating(health_score)
    yield_stars, yield_label = compute_yield_rating(
        metric.yield_prediction if metric else None
    )

    return {
        "id": farm.id,
        "name": farm.name,
        "crop": farm.crop_name or "Paddy",
        "variety": farm.variety or "Unknown",
        "area_acres": farm.area_acres or 0,
        "village": farm.village_name,
        "district": farm.district_name,
        "centroid": farm.centroid,
        "polygon": farm.polygon,
        "sowing_date": farm.sowing_date,
        "irrigation_type": farm.irrigation_type,
        "health_score": health_score,
        "health_rating": rating_label,
        "ndvi": ndvi,
        "growth_stage": farm.land_status or "Growing",
        "water_status": "Adequate" if ndvi > 0.6 else "Moderate",
        "yield_rating": yield_stars,
        "yield_label": yield_label,
        "harvest_estimate": "15-20 days" if ndvi > 0.7 else "30+ days",
        "ai_summary": f"Farm health is {rating_label.lower()} with NDVI {ndvi:.2f}. {metric.recommendation if metric and metric.recommendation else ''}",
    }


@router.get("/village-dashboard")
def village_dashboard(
    village: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """Get aggregated village-level analytics dashboard."""
    return get_village_analytics(db, village=village, district=district)


@router.get("/search")
def search_community(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    """Search farmers, farms, villages, crops."""
    from app.models.digital_twin import FarmerField, Farmer
    from app.models.user import FarmerProfile

    results = {"farmers": [], "farms": [], "villages": []}
    q_lower = f"%{q.lower()}%"

    # Search farms
    farms = db.query(FarmerField).filter(
        FarmerField.name.ilike(q_lower) |
        FarmerField.village_name.ilike(q_lower) |
        FarmerField.crop_name.ilike(q_lower) |
        FarmerField.district_name.ilike(q_lower)
    ).limit(20).all()

    for f in farms:
        results["farms"].append({
            "id": f.id,
            "name": f.name,
            "village": f.village_name,
            "district": f.district_name,
            "crop": f.crop_name,
            "centroid": f.centroid,
        })

    # Search farmer profiles
    profiles = db.query(FarmerProfile).filter(
        FarmerProfile.full_name.ilike(q_lower) |
        FarmerProfile.village.ilike(q_lower) |
        FarmerProfile.district.ilike(q_lower)
    ).limit(10).all()

    for p in profiles:
        results["farmers"].append({
            "id": p.id,
            "name": p.full_name,
            "village": p.village,
            "district": p.district,
        })

    return results
