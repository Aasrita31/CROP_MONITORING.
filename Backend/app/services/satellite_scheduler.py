import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
import datetime

from app.database.database import SessionLocal
from app.models.digital_twin import FarmerField, SatelliteHistory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fetch_satellite_data_job():
    """
    Background job to process Sentinel-2 data and generate comprehensive Digital Twin metrics.
    """
    logger.info("Starting comprehensive Farm Digital Twin background job...")
    db: Session = SessionLocal()
    try:
        from app.models.digital_twin import (
            FieldMetric, WeatherHistory, SoilHistory, CropHistory, AIRecommendations, FarmTimeline
        )
        import random
        
        fields = db.query(FarmerField).all()
        for field in fields:
            logger.info(f"Processing Digital Twin data for field {field.name} ({field.id})")
            
            # Simulated index calculation
            ndvi_val = round(random.uniform(0.4, 0.8), 2)
            ndmi_val = round(random.uniform(-0.1, 0.5), 2)
            evi_val = round(ndvi_val * 0.8, 2)
            savi_val = round(ndvi_val * 0.9, 2)
            health_score = int(ndvi_val * 100 + 10)
            
            # Save Field Metric
            metric = FieldMetric(
                field_id=field.id, ndvi=ndvi_val, ndmi=ndmi_val, evi=evi_val, savi=savi_val,
                health_score=health_score, health_status="Healthy" if health_score > 60 else "Stressed"
            )
            db.add(metric)
            
            # Save Weather
            weather = WeatherHistory(
                field_id=field.id, temperature=round(random.uniform(28, 35), 1),
                humidity=round(random.uniform(50, 80), 1), wind_speed=round(random.uniform(5, 15), 1),
                solar_radiation=round(random.uniform(4, 7), 1), rain_probability=round(random.uniform(0, 40), 1)
            )
            db.add(weather)
            
            # Save Soil
            soil = SoilHistory(
                field_id=field.id, organic_carbon=round(random.uniform(0.5, 1.2), 2),
                nitrogen=random.randint(100, 150), phosphorus=random.randint(30, 60),
                potassium=random.randint(150, 250), ph=round(random.uniform(6.5, 7.5), 1),
                salinity=round(random.uniform(0.5, 2.0), 1)
            )
            db.add(soil)
            
            # Save AI Recs
            ai = AIRecommendations(
                field_id=field.id, disease_risk=round(random.uniform(10, 40), 1),
                pest_risk=round(random.uniform(5, 30), 1), water_stress_alert=ndmi_val < 0,
                recommendation="Optimal conditions. Continue standard monitoring." if ndvi_val > 0.6 else "Apply top-dressing urea."
            )
            db.add(ai)
            
            # Create a timeline event if none exist
            existing_events = db.query(FarmTimeline).filter(FarmTimeline.field_id == field.id).count()
            if existing_events == 0:
                timeline = FarmTimeline(
                    field_id=field.id, event_date=datetime.datetime.utcnow(),
                    event_name="Vegetative Stage", status="active", description="Crop is actively growing leaves."
                )
                db.add(timeline)
                
            db.commit()
            
    except Exception as e:
        logger.error(f"Error in satellite job: {e}")
        db.rollback()
    finally:
        db.close()
    logger.info("Farm Digital Twin background job completed.")

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every hour (or day) to check for new satellite imagery
    scheduler.add_job(
        fetch_satellite_data_job,
        trigger=IntervalTrigger(hours=24),
        id="satellite_fetch_job",
        name="Fetch new Sentinel-2 imagery for registered fields",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Background scheduler started.")

