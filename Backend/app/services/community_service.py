from sqlalchemy.orm import Session
from typing import Optional
import random

from app.models.digital_twin import FarmerField, FieldMetric
from app.models.community import FarmMetrics, Leaderboard, VillageAnalytics
from app.models.user import User, FarmerProfile


def compute_health_rating(score: int) -> tuple[str, str]:
    """Convert 0-100 health score to rating label."""
    if score >= 90:
        return "Excellent", "excellent"
    elif score >= 75:
        return "Good", "good"
    elif score >= 55:
        return "Moderate", "moderate"
    elif score >= 35:
        return "Poor", "poor"
    else:
        return "Critical", "critical"


def compute_yield_rating(yield_str: Optional[str]) -> tuple[int, str]:
    """Convert yield prediction to 1-5 star rating."""
    if not yield_str:
        return 3, "Average"
    try:
        value = float(yield_str.split()[0])
    except (ValueError, IndexError):
        return 3, "Average"

    if value >= 6.0:
        return 5, "Excellent"
    elif value >= 5.0:
        return 4, "Good"
    elif value >= 4.0:
        return 3, "Average"
    elif value >= 3.0:
        return 2, "Needs Improvement"
    else:
        return 1, "Poor"


def get_community_farms(db: Session, village: Optional[str] = None, district: Optional[str] = None):
    """Get visible farms for community view."""
    query = db.query(FarmerField)

    if village:
        query = query.filter(FarmerField.village_name.ilike(f"%{village}%"))
    elif district:
        query = query.filter(FarmerField.district_name.ilike(f"%{district}%"))

    farms = query.all()
    results = []

    for farm in farms:
        # Get latest metrics
        metric = db.query(FieldMetric).filter(
            FieldMetric.field_id == farm.id
        ).order_by(FieldMetric.calculated_at.desc()).first()

        health_score = metric.health_score if metric else random.randint(40, 95)
        ndvi = metric.ndvi if metric else round(random.uniform(0.3, 0.9), 2)

        rating_label, rating_tone = compute_health_rating(health_score)
        yield_stars, yield_label = compute_yield_rating(
            metric.yield_prediction if metric else None
        )

        # Determine map color
        if health_score >= 75:
            color = "green"
        elif health_score >= 50:
            color = "yellow"
        else:
            color = "red"

        results.append({
            "id": farm.id,
            "name": farm.name,
            "crop": farm.crop_name or "Paddy",
            "variety": farm.variety or "Unknown",
            "area_acres": farm.area_acres or 0,
            "village": farm.village_name,
            "district": farm.district_name,
            "centroid": farm.centroid,
            "polygon": farm.polygon,
            "health_score": health_score,
            "health_rating": rating_label,
            "health_tone": rating_tone,
            "ndvi": ndvi,
            "growth_stage": farm.land_status or "Growing",
            "water_status": "Adequate" if ndvi > 0.6 else ("Moderate" if ndvi > 0.4 else "Stressed"),
            "yield_rating": yield_stars,
            "yield_label": yield_label,
            "harvest_estimate": "15-20 days" if ndvi > 0.7 else "30+ days",
            "ai_summary": f"Farm health is {rating_label.lower()}. NDVI at {ndvi:.2f}.",
            "color": color,
            "irrigation_type": farm.irrigation_type or "Canal",
        })

    return results


def get_village_analytics(db: Session, village: Optional[str] = None, district: Optional[str] = None):
    """Compute aggregated village-level analytics."""
    query = db.query(FarmerField)

    if village:
        query = query.filter(FarmerField.village_name.ilike(f"%{village}%"))
    elif district:
        query = query.filter(FarmerField.district_name.ilike(f"%{district}%"))

    farms = query.all()

    if not farms:
        return {
            "registered_farmers": 0,
            "registered_farms": 0,
            "total_area": 0,
            "crop_distribution": {},
            "avg_ndvi": 0,
            "avg_evi": 0,
            "avg_ndmi": 0,
            "avg_savi": 0,
            "avg_soil_moisture": 0,
            "avg_yield_rating": 0,
            "disease_distribution": {},
            "water_stress": "N/A",
            "most_common_irrigation": "N/A",
            "village_health_score": 0,
        }

    # Gather metrics for all farms
    total_area = sum(f.area_acres or 0 for f in farms)
    farmer_ids = set(f.farmer_id for f in farms)
    crops = {}
    irrigations = {}
    ndvis = []
    health_scores = []

    for farm in farms:
        crop = farm.crop_name or "Paddy"
        crops[crop] = crops.get(crop, 0) + 1

        irr = farm.irrigation_type or "Canal"
        irrigations[irr] = irrigations.get(irr, 0) + 1

        metric = db.query(FieldMetric).filter(
            FieldMetric.field_id == farm.id
        ).order_by(FieldMetric.calculated_at.desc()).first()

        if metric:
            if metric.ndvi is not None:
                ndvis.append(metric.ndvi)
            if metric.health_score is not None:
                health_scores.append(metric.health_score)

    avg_ndvi = round(sum(ndvis) / len(ndvis), 3) if ndvis else 0.55
    avg_health = round(sum(health_scores) / len(health_scores)) if health_scores else 60

    # Mock some indices based on NDVI
    avg_evi = round(avg_ndvi * 0.85, 3)
    avg_ndmi = round(avg_ndvi * 0.7, 3)
    avg_savi = round(avg_ndvi * 0.9, 3)
    avg_soil_moisture = round(avg_ndvi * 70, 1)

    most_common_irrigation = max(irrigations, key=irrigations.get) if irrigations else "Canal"

    return {
        "registered_farmers": len(farmer_ids),
        "registered_farms": len(farms),
        "total_area": round(total_area, 1),
        "crop_distribution": crops,
        "avg_ndvi": avg_ndvi,
        "avg_evi": avg_evi,
        "avg_ndmi": avg_ndmi,
        "avg_savi": avg_savi,
        "avg_soil_moisture": avg_soil_moisture,
        "avg_yield_rating": round(avg_ndvi * 5, 1),
        "disease_distribution": {"Low Risk": len(farms) - 2, "Moderate": 1, "High": 1} if len(farms) > 2 else {},
        "water_stress": "Low" if avg_ndvi > 0.6 else ("Moderate" if avg_ndvi > 0.4 else "High"),
        "most_common_irrigation": most_common_irrigation,
        "village_health_score": avg_health,
    }


def get_leaderboard(db: Session, category: str = "health"):
    """Get top farms for a given category."""
    farms = db.query(FarmerField).limit(50).all()
    entries = []

    for farm in farms:
        metric = db.query(FieldMetric).filter(
            FieldMetric.field_id == farm.id
        ).order_by(FieldMetric.calculated_at.desc()).first()

        health_score = metric.health_score if metric else random.randint(40, 90)
        ndvi = metric.ndvi if metric else round(random.uniform(0.3, 0.9), 2)

        # Compute score by category
        if category == "health":
            score = health_score
        elif category == "ndvi":
            score = round(ndvi * 100, 1)
        elif category == "water":
            score = round(ndvi * 90, 1)  # Simplified
        elif category == "sustainability":
            score = round((health_score * 0.4 + ndvi * 100 * 0.6), 1)
        else:
            score = health_score

        # Assign badges
        badges = []
        if health_score >= 90:
            badges.append("Healthy Farm Champion")
        if ndvi >= 0.8:
            badges.append("AI Smart Farm")
        if score >= 80:
            badges.append("Water Saver")

        entries.append({
            "farm_id": farm.id,
            "farm_name": farm.name,
            "farmer_id": farm.farmer_id,
            "village": farm.village_name,
            "district": farm.district_name,
            "crop": farm.crop_name or "Paddy",
            "score": score,
            "health_score": health_score,
            "ndvi": ndvi,
            "badges": badges,
        })

    # Sort by score descending
    entries.sort(key=lambda x: x["score"], reverse=True)

    # Assign ranks
    for i, entry in enumerate(entries):
        entry["rank"] = i + 1

    return entries[:20]  # Top 20
