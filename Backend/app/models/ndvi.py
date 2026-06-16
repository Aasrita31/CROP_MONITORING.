from sqlalchemy import Column, Integer, String, Float
from app.database.database import Base

class NDVIData(Base):
    __tablename__ = "ndvi_data"

    id = Column(Integer, primary_key=True, index=True)
    target_type = Column(String)  # "district", "village", "field"
    target_id = Column(String)  # Stores ID as string (since field ID is string e.g. "v1-f1")
    ndvi_value = Column(Float)
    date = Column(String)  # "Day -60", "Day -30", "Current"
