from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.database.database import Base

class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    lat = Column(Float)
    lng = Column(Float)
    area = Column(String)  # e.g., "350k ha"
    yield_prediction = Column(String)  # e.g., "6.2 t/ha"
    risk = Column(String)  # e.g., "Low", "Moderate", "High", "Severe"
    color = Column(String)  # Heatmap color string

    villages = relationship("Village", back_populates="district", cascade="all, delete-orphan")
