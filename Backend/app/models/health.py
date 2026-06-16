from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database.database import Base

class HealthMetrics(Base):
    __tablename__ = "health_metrics"

    id = Column(Integer, primary_key=True, index=True)
    target_type = Column(String)  # "district", "village", "field"
    target_id = Column(String)
    health_score = Column(Integer)
    disease_risk = Column(Integer)
    water_stress = Column(Integer)
    yield_prediction = Column(Float)
    date = Column(String)

class YieldPrediction(Base):
    __tablename__ = "yield_predictions"

    id = Column(Integer, primary_key=True, index=True)
    target_type = Column(String)  # "district", "village", "field"
    target_id = Column(String)
    predicted_yield = Column(Float)
    confidence = Column(Float)
    date = Column(String)

class Alerts(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    severity = Column(String)  # "info", "warn", "alert", "good"
    title = Column(String)
    message = Column(String)
    target_type = Column(String)  # "district", "village", "field"
    target_id = Column(String)
    date = Column(String)
