from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.database import Base

class Field(Base):
    __tablename__ = "fields"

    id = Column(String, primary_key=True, index=True) # e.g. "v1-f1"
    name = Column(String)
    village_id = Column(Integer, ForeignKey("villages.id"))
    coordinates = Column(JSON)  # List of coordinates (lat, lng) e.g. [[lat, lng], [lat, lng], ...]
    ndvi = Column(Float)
    health_score = Column(Integer)
    status = Column(String)  # "Healthy", "Water Stress", etc.
    color = Column(String)
    area = Column(Float)  # Area in ha
    growth_stage = Column(String)  # e.g. "Panicle Initiation"
    disease_risk = Column(String)  # "High" / "Low"
    yield_prediction = Column(String)  # "6.2 t/ha"
    recommendation = Column(String)

    village = relationship("Village", back_populates="fields")
    analyses = relationship("FieldAnalysis", back_populates="field", cascade="all, delete-orphan")

class FieldAnalysis(Base):
    __tablename__ = "field_analyses"

    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("fields.id"))
    analysis_date = Column(String)
    recommendation = Column(String)
    nitrogen = Column(Integer)
    phosphorus = Column(Integer)
    potassium = Column(Integer)
    crop_health_status = Column(String)
    disease_risk_probability = Column(Integer)
    water_stress_index = Column(Integer)

    field = relationship("Field", back_populates="analyses")
