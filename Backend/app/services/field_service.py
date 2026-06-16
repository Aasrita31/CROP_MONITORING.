from sqlalchemy.orm import Session
from app.models.field import Field, FieldAnalysis
from app.models.village import Village

class FieldService:
    @staticmethod
    def get_all_fields(db: Session):
        return db.query(Field).all()

    @staticmethod
    def get_field_by_id(db: Session, field_id: str):
        return db.query(Field).filter(Field.id == field_id).first()

    @staticmethod
    def get_fields_by_village(db: Session, village_id: int):
        return db.query(Field).filter(Field.village_id == village_id).all()

    @staticmethod
    def get_field_health_details(db: Session, field_id: str):
        field = db.query(Field).filter(Field.id == field_id).first()
        if not field:
            return None
        
        # Query analysis history or create a fallback using field attributes
        analysis = db.query(FieldAnalysis).filter(FieldAnalysis.field_id == field_id).first()
        
        # Determine realistic NPK values based on status
        n_val = 75 if field.status == "Healthy" else (55 if field.status == "Nutrient Stress" else 68)
        p_val = 70 if field.status == "Healthy" else (45 if field.status == "Nutrient Stress" else 62)
        k_val = 65 if field.status == "Healthy" else (35 if field.status == "Nutrient Stress" else 58)
        
        water_stress = "None"
        if field.status == "Water Stress":
            water_stress = "High"
        elif field.status == "Nutrient Stress":
            water_stress = "Low"
        
        disease_risk = "Low"
        if field.status == "Disease Risk":
            disease_risk = "High"

        return {
            "field_id": field.id,
            "health_score": field.health_score,
            "status": field.status,
            "disease_risk": disease_risk,
            "water_stress": water_stress,
            "npk": {
                "n": analysis.nitrogen if analysis else n_val,
                "p": analysis.phosphorus if analysis else p_val,
                "k": analysis.potassium if analysis else k_val
            },
            "recommendation": analysis.recommendation if analysis else field.recommendation
        }
