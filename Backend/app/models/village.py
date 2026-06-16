from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"))
    lat = Column(Float)
    lng = Column(Float)
    ndvi = Column(Float)
    health = Column(Integer)
    disease_risk = Column(String)
    yield_pred = Column(String)
    water_stress = Column(String)
    harvest_ready = Column(String)

    district = relationship("District", back_populates="villages")
    fields = relationship("Field", back_populates="village", cascade="all, delete-orphan")
