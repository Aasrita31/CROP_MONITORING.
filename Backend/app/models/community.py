from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from app.database.database import Base


class VillageAnalytics(Base):
    __tablename__ = "village_analytics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    village_name = Column(String, index=True, nullable=False)
    district = Column(String, nullable=True)
    total_farms = Column(Integer, default=0)
    total_area = Column(Float, default=0.0)
    avg_ndvi = Column(Float, nullable=True)
    avg_evi = Column(Float, nullable=True)
    avg_ndmi = Column(Float, nullable=True)
    avg_savi = Column(Float, nullable=True)
    avg_soil_moisture = Column(Float, nullable=True)
    avg_yield_rating = Column(Float, nullable=True)
    dominant_crops = Column(JSON, nullable=True)  # List of crop names
    disease_distribution = Column(JSON, nullable=True)
    water_stress_level = Column(String, nullable=True)
    most_common_irrigation = Column(String, nullable=True)
    health_score = Column(Integer, nullable=True)
    registered_farmers = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    village = Column(String, nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=True)
    post_type = Column(String, default="announcement")  # announcement, alert, scheme
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Leaderboard(Base):
    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farm_id = Column(String, nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farmer_name = Column(String, nullable=True)
    farm_name = Column(String, nullable=True)
    category = Column(String, nullable=False)  # health, ndvi, water, sustainability, improvement
    score = Column(Float, default=0.0)
    rank = Column(Integer, nullable=True)
    badges = Column(JSON, nullable=True)  # List of badge names
    season = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class FarmMetrics(Base):
    __tablename__ = "farm_metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farm_id = Column(String, nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    health_score = Column(Integer, default=0)  # 0-100
    health_rating = Column(String, default="Moderate")  # Excellent/Good/Moderate/Poor/Critical
    yield_rating = Column(Integer, default=3)  # 1-5 stars
    yield_label = Column(String, default="Average")
    water_management_score = Column(Float, default=0.0)
    sustainability_score = Column(Float, default=0.0)
    computed_at = Column(DateTime, default=datetime.datetime.utcnow)
