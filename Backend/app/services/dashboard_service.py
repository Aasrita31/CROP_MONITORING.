from sqlalchemy.orm import Session
from app.models.district import District
from app.models.village import Village
from app.models.field import Field
from app.models.health import Alerts

class DashboardService:
    @staticmethod
    def get_overview_stats(db: Session):
        districts_count = db.query(District).count()
        villages_count = db.query(Village).count()
        fields_count = db.query(Field).count()
        total_area = sum(f.area for f in db.query(Field).all())
        
        fields = db.query(Field).all()
        avg_health = sum(f.health_score for f in fields) / len(fields) if fields else 0.0

        return {
            "districts_count": districts_count,
            "villages_count": villages_count,
            "fields_count": fields_count,
            "total_area_ha": round(total_area, 1),
            "avg_health_score": round(avg_health, 1)
        }

    @staticmethod
    def get_alerts(db: Session):
        return db.query(Alerts).order_by(Alerts.id.desc()).all()

    @staticmethod
    def get_village_comparison(db: Session):
        villages = db.query(Village).all()
        comparison = []
        for v in villages:
            dist_name = "Unknown"
            district = db.query(District).filter(District.id == v.district_id).first()
            if district:
                dist_name = district.name
            
            comparison.append({
                "id": v.id,
                "name": v.name,
                "district": dist_name,
                "ndvi": v.ndvi,
                "health": v.health,
                "diseaseRisk": v.disease_risk,
                "waterStress": v.water_stress,
                "harvestReady": v.harvest_ready,
                "yieldPred": v.yield_pred
            })
        return comparison
