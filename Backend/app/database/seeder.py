from sqlalchemy.orm import Session
from app.models.district import District
from app.models.village import Village
from app.models.field import Field, FieldAnalysis
from app.models.ndvi import NDVIData
from app.models.health import HealthMetrics, YieldPrediction, Alerts
import random

# Color scale helper
def get_ndvi_color(ndvi: float):
    if ndvi >= 0.75: return "#064e3b" # Dark Green
    if ndvi >= 0.60: return "#10b981" # Light Green
    if ndvi >= 0.40: return "#eab308" # Yellow
    if ndvi >= 0.25: return "#f97316" # Orange
    return "#ef4444" # Red

def generate_field_polygon(v_lat: float, v_lng: float, index: int):
    row = index // 4
    col = index % 4
    
    offset_y = (row - 1.2) * 0.008 + (random.random() - 0.5) * 0.002
    offset_x = (col - 1.2) * 0.008 + (random.random() - 0.5) * 0.002
    
    center_y = v_lat + offset_y
    center_x = v_lng + offset_x
    
    size_y = 0.0025 + (random.random() - 0.5) * 0.0005
    size_x = 0.0025 + (random.random() - 0.5) * 0.0005
    
    return [
        [center_y - size_y, center_x - size_x],
        [center_y + size_y, center_x - size_x],
        [center_y + size_y, center_x + size_x],
        [center_y - size_y, center_x + size_x]
    ]

def seed_data(db: Session):
    # Check if already seeded
    if db.query(District).count() > 0:
        return
        
    print("Seeding Andhra Pradesh Paddy Crop Monitoring data...")
    
    # 1. Seed Districts
    districts_data = [
        { "id": 1, "name": "East Godavari", "lat": 17.0, "lng": 81.8, "area": "350k ha", "yield_prediction": "6.2 t/ha", "risk": "Low", "color": get_ndvi_color(0.85) },
        { "id": 2, "name": "West Godavari", "lat": 16.7, "lng": 81.1, "area": "320k ha", "yield_prediction": "6.0 t/ha", "risk": "Low", "color": get_ndvi_color(0.81) },
        { "id": 3, "name": "Krishna",       "lat": 16.4, "lng": 80.9, "area": "280k ha", "yield_prediction": "5.4 t/ha", "risk": "Moderate", "color": get_ndvi_color(0.65) },
        { "id": 4, "name": "Konaseema",     "lat": 16.5, "lng": 82.0, "area": "210k ha", "yield_prediction": "4.8 t/ha", "risk": "High", "color": get_ndvi_color(0.52) },
        { "id": 5, "name": "Nellore",       "lat": 14.4, "lng": 79.9, "area": "190k ha", "yield_prediction": "4.1 t/ha", "risk": "Severe", "color": get_ndvi_color(0.35) },
    ]
    
    for d in districts_data:
        db.add(District(**d))
    db.commit()
    
    # 2. Seed Villages
    villages_data = [
        { "id": 1, "name": "Kadiyam",           "district_id": 1, "lat": 16.92, "lng": 81.83, "ndvi": 0.82, "health": 92, "disease_risk": "Low (12%)", "yield_pred": "6.5 t/ha", "water_stress": "None", "harvest_ready": "20%" },
        { "id": 2, "name": "Bhimadole",         "district_id": 2, "lat": 16.82, "lng": 81.27, "ndvi": 0.74, "health": 85, "disease_risk": "Low (18%)", "yield_pred": "5.8 t/ha", "water_stress": "Low", "harvest_ready": "45%" },
        { "id": 3, "name": "Movva",             "district_id": 3, "lat": 16.30, "lng": 80.85, "ndvi": 0.65, "health": 70, "disease_risk": "Moderate (35%)", "yield_pred": "5.2 t/ha", "water_stress": "Moderate", "harvest_ready": "10%" },
        { "id": 4, "name": "Amalapuram Region", "district_id": 4, "lat": 16.58, "lng": 82.01, "ndvi": 0.52, "health": 58, "disease_risk": "High (62%)", "yield_pred": "4.5 t/ha", "water_stress": "High", "harvest_ready": "5%" },
        { "id": 5, "name": "Indukurpet Region", "district_id": 5, "lat": 14.48, "lng": 80.05, "ndvi": 0.40, "health": 45, "disease_risk": "Severe (80%)", "yield_pred": "3.8 t/ha", "water_stress": "Severe", "harvest_ready": "0%" },
    ]
    
    for v in villages_data:
        db.add(Village(**v))
    db.commit()
    
    # 3. Seed Fields, NDVI and Health Metrics
    for v in villages_data:
        # Generate 10 fields per village
        for i in range(10):
            field_id = f"v{v['id']}-f{i+1}"
            f_ndvi = max(0.15, min(0.99, v["ndvi"] + (random.random() - 0.5) * 0.16))
            
            # Determine health score and status
            status = "Healthy"
            health_score = int(85 + (f_ndvi - 0.6) * 25) if f_ndvi >= 0.6 else int(50 + (f_ndvi - 0.25) * 80)
            health_score = max(20, min(100, health_score))
            
            if f_ndvi < 0.25:
                status = "Disease Risk"
            elif f_ndvi < 0.40:
                status = "Water Stress"
            elif f_ndvi < 0.60:
                status = "Nutrient Stress"
                
            coords = generate_field_polygon(v["lat"], v["lng"], i)
            area = round(1.2 + random.random() * 2.8, 1)
            
            # Growth stage based on village index
            stages = ["Tillering", "Stem Elongation", "Panicle Initiation", "Flowering", "Grain Filling"]
            stage = stages[v["id"] - 1]
            
            disease_level = "High" if status == "Disease Risk" else "Low"
            yield_est = f"{round(3.5 + f_ndvi * 3.5, 1)} t/ha"
            
            recs = {
                "Healthy": "Crop is in optimal condition. Maintain current irrigation levels.",
                "Water Stress": "Soil moisture is critically low. Apply immediate drip irrigation.",
                "Nutrient Stress": "Nitrogen levels are deficient. Schedule urea split application of 20 kg/acre.",
                "Disease Risk": "High humidity detected. Preventive spray of hexaconazole fungicide recommended."
            }
            recommendation = recs.get(status, "Monitor growth closely and check soil moisture sensor telemetry.")
            
            # Save Field
            field = Field(
                id=field_id,
                name=f"Field {chr(65+i)} — {v['name']} Paddy Block",
                village_id=v["id"],
                coordinates=coords,
                ndvi=round(f_ndvi, 2),
                health_score=health_score,
                status=status,
                color=get_ndvi_color(f_ndvi),
                area=area,
                growth_stage=stage,
                disease_risk=disease_level,
                yield_prediction=yield_est,
                recommendation=recommendation
            )
            db.add(field)
            
            # Save Field Analysis details
            analysis = FieldAnalysis(
                field_id=field_id,
                analysis_date="2026-06-15",
                recommendation=recommendation,
                nitrogen=int(50 + f_ndvi * 40) if status != "Nutrient Stress" else 38,
                phosphorus=int(45 + f_ndvi * 35),
                potassium=int(40 + f_ndvi * 30),
                crop_health_status=status,
                disease_risk_probability=int((1 - f_ndvi) * 100) if status == "Disease Risk" else int((1 - f_ndvi) * 40),
                water_stress_index=int((1 - f_ndvi) * 100) if status == "Water Stress" else int((1 - f_ndvi) * 35)
            )
            db.add(analysis)
            
            # Add field NDVI history
            db.add(NDVIData(target_type="field", target_id=field_id, ndvi_value=round(f_ndvi * 0.88, 2), date="Day -60"))
            db.add(NDVIData(target_type="field", target_id=field_id, ndvi_value=round(f_ndvi * 0.94, 2), date="Day -30"))
            db.add(NDVIData(target_type="field", target_id=field_id, ndvi_value=round(f_ndvi, 2), date="Current"))
            
        # Add village NDVI history
        db.add(NDVIData(target_type="village", target_id=str(v["id"]), ndvi_value=round(v["ndvi"] * 0.85, 2), date="Day -60"))
        db.add(NDVIData(target_type="village", target_id=str(v["id"]), ndvi_value=round(v["ndvi"] * 0.93, 2), date="Day -30"))
        db.add(NDVIData(target_type="village", target_id=str(v["id"]), ndvi_value=round(v["ndvi"], 2), date="Current"))

    # 4. Seed District NDVI & Health histories
    for d in districts_data:
        # Mock historical trends for Recharts statewide and district charts
        avg_ndvi = 0.85 if d["id"] == 1 else (0.81 if d["id"] == 2 else (0.65 if d["id"] == 3 else (0.52 if d["id"] == 4 else 0.35)))
        db.add(NDVIData(target_type="district", target_id=str(d["id"]), ndvi_value=round(avg_ndvi * 0.86, 2), date="Day -60"))
        db.add(NDVIData(target_type="district", target_id=str(d["id"]), ndvi_value=round(avg_ndvi * 0.92, 2), date="Day -30"))
        db.add(NDVIData(target_type="district", target_id=str(d["id"]), ndvi_value=round(avg_ndvi, 2), date="Current"))

    # 5. Seed Dashboard Warnings & Alerts
    alerts_data = [
        {"severity": "warn", "title": "Potassium Deficit", "message": "Bhimadole fields (West Godavari) require potash application within 3 days.", "target_type": "village", "target_id": "2", "date": "2 hours ago"},
        {"severity": "alert", "title": "Blast Fungal Risk", "message": "High blast spores risk detected in Indukurpet Region (Nellore). Preventative spray recommended.", "target_type": "village", "target_id": "5", "date": "3 hours ago"},
        {"severity": "info", "title": "Canal Release Schedule", "message": "Godavari delta canal release scheduled. Pause tubewell irrigation in Kadiyam.", "target_type": "district", "target_id": "1", "date": "5 hours ago"},
        {"severity": "good", "title": "Optimal NDVI peak", "message": "Paddy fields in East Godavari reached peak canopy density (NDVI 0.85 avg).", "target_type": "district", "target_id": "1", "date": "1 day ago"},
        {"severity": "warn", "title": "Soil moisture drop", "message": "Amalapuram Region (Konaseema) soil moisture index dropped below 42%.", "target_type": "village", "target_id": "4", "date": "1 day ago"}
    ]
    for a in alerts_data:
        db.add(Alerts(**a))
        
    db.commit()
    print("Database seeding completed successfully!")
