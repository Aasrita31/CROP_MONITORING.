from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, DateTime, Boolean
from sqlalchemy.orm import relationship
import datetime
from app.database.database import Base

class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, default="Demo Farmer")
    phone = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    fields = relationship("FarmerField", back_populates="farmer", cascade="all, delete-orphan")

class FarmerField(Base):
    __tablename__ = "farmer_fields"

    id = Column(String, primary_key=True, index=True)
    farmer_id = Column(String, ForeignKey("farmers.id"))
    name = Column(String, index=True)
    polygon = Column(JSON)  # List of [lat, lon] pairs
    centroid = Column(JSON)  # [lat, lon]
    area_acres = Column(Float)
    area_hectares = Column(Float)
    village_name = Column(String)
    district_name = Column(String)
    land_status = Column(String)  # "sown", "barren"
    crop_name = Column(String, nullable=True)
    variety = Column(String, nullable=True)
    sowing_date = Column(String, nullable=True)
    irrigation_type = Column(String, nullable=True)
    farming_type = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farmer = relationship("Farmer", back_populates="fields")
    metrics = relationship("FieldMetric", back_populates="field", cascade="all, delete-orphan")
    satellite_history = relationship("SatelliteHistory", back_populates="field", cascade="all, delete-orphan")
    weather_history = relationship("WeatherHistory", back_populates="field", cascade="all, delete-orphan")
    soil_history = relationship("SoilHistory", back_populates="field", cascade="all, delete-orphan")
    crop_history = relationship("CropHistory", back_populates="field", cascade="all, delete-orphan")
    ai_recommendations = relationship("AIRecommendations", back_populates="field", cascade="all, delete-orphan")
    timeline_events = relationship("FarmTimeline", back_populates="field", cascade="all, delete-orphan")

class FieldMetric(Base):
    __tablename__ = "field_metrics"

    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("farmer_fields.id"))
    ndvi = Column(Float, nullable=True)
    ndmi = Column(Float, nullable=True)
    evi = Column(Float, nullable=True)
    savi = Column(Float, nullable=True)
    health_score = Column(Integer, nullable=True)
    health_status = Column(String, nullable=True)  # Healthy, Stressed, etc.
    disease_risk = Column(String, nullable=True)
    yield_prediction = Column(String, nullable=True)
    recommendation = Column(String, nullable=True)
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow)

    field = relationship("FarmerField", back_populates="metrics")

class SatelliteHistory(Base):
    __tablename__ = "satellite_history"

    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("farmer_fields.id"))
    acquisition_date = Column(DateTime)
    cloud_cover = Column(Float)
    ndvi_mean = Column(Float)
    ndmi_mean = Column(Float)
    image_url = Column(String, nullable=True)

    field = relationship("FarmerField", back_populates="satellite_history")

class WeatherHistory(Base):
    __tablename__ = "weather_history"
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("farmer_fields.id"))
    date = Column(DateTime, default=datetime.datetime.utcnow)
    temperature = Column(Float)
    humidity = Column(Float)
    wind_speed = Column(Float)
    solar_radiation = Column(Float)
    rain_probability = Column(Float)
    field = relationship("FarmerField", back_populates="weather_history")

class SoilHistory(Base):
    __tablename__ = "soil_history"
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("farmer_fields.id"))
    date = Column(DateTime, default=datetime.datetime.utcnow)
    organic_carbon = Column(Float)
    nitrogen = Column(Float)
    phosphorus = Column(Float)
    potassium = Column(Float)
    ph = Column(Float)
    salinity = Column(Float)
    field = relationship("FarmerField", back_populates="soil_history")

class CropHistory(Base):
    __tablename__ = "crop_history"
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("farmer_fields.id"))
    date = Column(DateTime, default=datetime.datetime.utcnow)
    stage = Column(String)
    days_after_sowing = Column(Integer)
    health_score = Column(Integer)
    yield_prediction = Column(Float)
    field = relationship("FarmerField", back_populates="crop_history")

class AIRecommendations(Base):
    __tablename__ = "ai_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("farmer_fields.id"))
    date = Column(DateTime, default=datetime.datetime.utcnow)
    disease_risk = Column(Float)
    pest_risk = Column(Float)
    water_stress_alert = Column(Boolean)
    recommendation = Column(String)
    field = relationship("FarmerField", back_populates="ai_recommendations")

class FarmTimeline(Base):
    __tablename__ = "farm_timeline"
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(String, ForeignKey("farmer_fields.id"))
    event_date = Column(DateTime)
    event_name = Column(String)
    status = Column(String)
    description = Column(String)
    field = relationship("FarmerField", back_populates="timeline_events")

class Notifications(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(String, ForeignKey("farmers.id"))
    field_id = Column(String, ForeignKey("farmer_fields.id"), nullable=True)
    type = Column(String)
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
