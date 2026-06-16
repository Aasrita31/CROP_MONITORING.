from sqlalchemy.orm import Session
from app.models.ndvi import NDVIData
from typing import List

class NdviService:
    @staticmethod
    def get_ndvi_history(db: Session, target_type: str, target_id: str):
        records = db.query(NDVIData).filter(
            NDVIData.target_type == target_type,
            NDVIData.target_id == str(target_id)
        ).all()
        
        # Format for Recharts
        return [{"date": r.date, "ndvi_value": r.ndvi_value} for r in records]

    @staticmethod
    def get_all_ndvi_records(db: Session):
        return db.query(NDVIData).all()
