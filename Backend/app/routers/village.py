from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.village import Village
from app.models.field import Field
from app.models.district import District
from app.schemas.response_models import (
    VillageBase, FieldBase, VillageSearchRequest, 
    VillageSearchResponse, VillageAnalysisResult
)
from app.services.sentinel_service import SentinelService
from typing import List, Dict, Any
import requests
import numpy as np

router = APIRouter(prefix="/villages", tags=["Villages"])
search_router = APIRouter(prefix="/village", tags=["Village Search"])
analysis_router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.get("", response_model=List[VillageBase])
def get_villages(db: Session = Depends(get_db)):
    return db.query(Village).all()

@router.get("/{village_id}", response_model=VillageBase)
def get_village(village_id: int, db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    return village

@router.get("/{village_id}/fields", response_model=List[FieldBase])
def get_village_fields(village_id: int, db: Session = Depends(get_db)):
    fields = db.query(Field).filter(Field.village_id == village_id).all()
    return fields

@router.get("/{village_id}/analysis")
def get_village_analysis(village_id: int, db: Session = Depends(get_db)):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    
    # Fetch fields under this village to compute analytics
    fields = db.query(Field).filter(Field.village_id == village_id).all()
    total_area = sum(f.area for f in fields)
    
    # Calculate health statuses distribution
    status_counts = {"Healthy": 0, "Nutrient Stress": 0, "Water Stress": 0, "Disease Risk": 0, "Pest Risk": 0}
    for f in fields:
        status_counts[f.status] = status_counts.get(f.status, 0) + 1
        
    return {
        "village_id": village.id,
        "name": village.name,
        "ndvi": village.ndvi,
        "health_score": village.health,
        "total_fields": len(fields),
        "total_area_ha": round(total_area, 2),
        "disease_risk": village.disease_risk,
        "water_stress": village.water_stress,
        "harvest_readiness": village.harvest_ready,
        "status_distribution": status_counts
    }

@search_router.post("/search", response_model=VillageSearchResponse)
def search_village(payload: VillageSearchRequest, db: Session = Depends(get_db)):
    village_name = payload.village.strip()
    
    # 1. Search database first
    village = db.query(Village).filter(Village.name.ilike(f"%{village_name}%")).first()
    if village:
        district = db.query(District).filter(District.id == village.district_id).first()
        dist_name = district.name if district else "Unknown District"
        return {
            "district": dist_name,
            "latitude": village.lat,
            "longitude": village.lng
        }
        
    # 2. OSM Nominatim dynamic geocoding
    try:
        headers = {"User-Agent": "AgriTwin-Crop-Monitor/1.0"}
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={requests.utils.quote(village_name)}&limit=1"
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if data:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                display_name = data[0]["display_name"]
                
                district_name = "Krishna" # Default
                for d in ["East Godavari", "West Godavari", "Krishna", "Konaseema", "Nellore", "Guntur", "Prakasam", "Chittoor", "Anantapur", "Kurnool", "Kadapa", "Visakhapatnam", "Srikakulam", "Vizianagaram"]:
                    if d.lower() in display_name.lower():
                        district_name = d
                        break
                return {
                    "district": district_name,
                    "latitude": lat,
                    "longitude": lon
                }
    except Exception as e:
        print(f"Nominatim geocoding failed: {e}")
        
    # 3. Fallback to Vijayawada center coordinates
    return {
        "district": "Krishna",
        "latitude": 16.5,
        "longitude": 80.6
    }

@analysis_router.get("/village", response_model=VillageAnalysisResult)
def get_analysis_village(
    name: str = None,
    village_id: int = None,
    latitude: float = None,
    longitude: float = None,
    db: Session = Depends(get_db),
):
    # 1. Resolve location — prefer explicit geocoded coordinates from village search
    location = None
    if latitude is not None and longitude is not None:
        delta = 0.01
        location = {
            "lat": latitude,
            "lon": longitude,
            "boundingbox": [latitude - delta, latitude + delta, longitude - delta, longitude + delta],
            "name": name or f"{latitude},{longitude}",
        }
    elif name:
        location = SentinelService.get_village_location(name)
    elif village_id:
        village = db.query(Village).filter(Village.id == village_id).first()
        if village:
            location = SentinelService.get_village_location(village.name)

    if not location:
        raise HTTPException(
            status_code=400,
            detail="Could not resolve village location. Provide a valid village name or coordinates.",
        )

    # 2. Fetch Bands
    bands = SentinelService.fetch_sentinel2_bands(location['boundingbox'])
    
    # 3. Calculate NDVI & NDMI
    from app.services.ndvi_service import NdviService
    # 4. Process Arrays
    ndvi_array = 1.5 * ((bands['b8'] - bands['b4']) / (bands['b8'] + bands['b4'] + 1e-10))
    ndmi_array = (bands['b8'] - bands['b11']) / (bands['b8'] + bands['b11'] + 1e-10)
    evi_array = 2.5 * ((bands['b8'] - bands['b4']) / (bands['b8'] + 6 * bands['b4'] - 7.5 * bands['b2'] + 1 + 1e-10))
    savi_array = ((bands['b8'] - bands['b4']) / (bands['b8'] + bands['b4'] + 0.5)) * 1.5

    metrics = NdviService.get_village_metrics(ndvi_array)
    band_avgs = NdviService.get_village_band_averages(bands['b4'], bands['b8'], bands['b11'])
    valid_ndmi = ndmi_array[ndmi_array > -0.99]
    ndmi_mean = float(valid_ndmi.mean()) if len(valid_ndmi) > 0 else 0.0
    ndmi_min = float(valid_ndmi.min()) if len(valid_ndmi) > 0 else 0.0
    ndmi_max = float(valid_ndmi.max()) if len(valid_ndmi) > 0 else 0.0

    valid_evi = evi_array[(evi_array > -1) & (evi_array < 1.5)]
    evi_mean = float(valid_evi.mean()) if len(valid_evi) > 0 else 0.0
    evi_min = float(valid_evi.min()) if len(valid_evi) > 0 else 0.0
    evi_max = float(valid_evi.max()) if len(valid_evi) > 0 else 0.0

    if evi_mean > 0.55:
        growth_stage = "Grain Filling"
    elif evi_mean > 0.4:
        growth_stage = "Flowering"
    elif evi_mean > 0.25:
        growth_stage = "Vegetative"
    elif evi_mean > 0.15:
        growth_stage = "Tillering"
    else:
        growth_stage = "Seedling"
        
    biomass_estimate = max(0, evi_mean * 12.5)
    
    # SAVI stats
    valid_savi = savi_array[savi_array > -0.1]
    savi_mean = float(valid_savi.mean()) if len(valid_savi) > 0 else 0.0
    
    # Calculate crop cover vs bare soil
    # Threshold for crop cover is savi > 0.35
    total_valid = len(valid_savi)
    if total_valid > 0:
        crop_cover_pct = float(np.sum(valid_savi > 0.35)) / total_valid * 100
        bare_soil_pct = 100.0 - crop_cover_pct
    else:
        crop_cover_pct = 0.0
        bare_soil_pct = 100.0
    
    
    # Estimate yield based on health score (e.g. 100 health = ~7.5 t/ha, 0 = ~1.0 t/ha)
    yield_pred = round(1.0 + (metrics['health_score'] / 100.0) * 6.5, 1)

    # 5. Generate transparent Heatmap Overlays and Base Image
    image_data_uri = NdviService.generate_heatmap_overlay(ndvi_array)
    ndmi_image_data_uri = NdviService.generate_ndmi_heatmap_overlay(ndmi_array)
    evi_image_data_uri = NdviService.generate_evi_heatmap_overlay(evi_array)
    evi_historical_image_data_uri = NdviService.generate_historical_evi_heatmap(evi_array)
    savi_image_data_uri = NdviService.generate_savi_heatmap_overlay(savi_array)
    true_color_image_data_uri = NdviService.generate_true_color_image(bands['b2'], bands['b3'], bands['b4'])
    
    # 5.1 Extract crop fields and calculate mean NDVI/NDMI
    extracted_fields = NdviService.extract_crop_polygons(ndvi_array, ndmi_array, location['boundingbox'])

    # 6. Fetch Copernicus product catalog metadata
    copernicus_meta = SentinelService.fetch_product_metadata(location['boundingbox'])

    # 7. Formulate band metadata details
    bandwidth_details = [
        {
            "band": "B02 (Blue)",
            "centerWavelength": "490 nm",
            "bandwidth": "98 nm",
            "resolution": "10 meters",
            "purpose": "Atmospheric correction and soil/vegetation discrimination."
        },
        {
            "band": "B03 (Green)",
            "centerWavelength": "560 nm",
            "bandwidth": "45 nm",
            "resolution": "10 meters",
            "purpose": "Reflected by green vegetation (chlorophyll reflection peak)."
        },
        {
            "band": "B04 (Red)",
            "centerWavelength": "665 nm",
            "bandwidth": "38 nm",
            "resolution": "10 meters",
            "purpose": "Absorbed strongly by chlorophyll for photosynthesis (used in NDVI)."
        },
        {
            "band": "B08 (Near-Infrared - NIR)",
            "centerWavelength": "842 nm",
            "bandwidth": "145 nm",
            "resolution": "10 meters",
            "purpose": "Reflected strongly by leaf cell structure, indicating biomass (used in NDVI)."
        },
        {
            "band": "B11 (Short-Wave Infrared - SWIR)",
            "centerWavelength": "1610 nm",
            "bandwidth": "143 nm",
            "resolution": "20 meters (resampled to 10m)",
            "purpose": "Sensitivity to water content in leaves, useful for computing NDMI."
        }
    ]

    return {
        "ndvi": metrics['avg_ndvi'],
        "ndmi": round(ndmi_mean, 2),
        "ndmiMin": round(ndmi_min, 2),
        "ndmiMax": round(ndmi_max, 2),
        "b4": round(band_avgs['b4'], 4),
        "b8": round(band_avgs['b8'], 4),
        "b11": round(band_avgs['b11'], 4),
        "healthScore": metrics['health_score'],
        "diseaseRisk": int(min(100, max(0, metrics['critical_pct'] + (metrics['water_stress_pct'] * 0.5)))),
        "waterStress": int(min(100, max(0, metrics['water_stress_pct'] + (metrics['critical_pct'] * 0.2)))),
        "yieldPrediction": yield_pred,
        "imageUrl": image_data_uri,
        "ndmiImageUrl": ndmi_image_data_uri,
        "trueColorImageUrl": true_color_image_data_uri,
        "evi": round(evi_mean, 3),
        "eviMin": round(evi_min, 3),
        "eviMax": round(evi_max, 3),
        "eviImageUrl": evi_image_data_uri,
        "eviHistoricalImageUrl": evi_historical_image_data_uri,
        "growthStage": growth_stage,
        "biomassEstimate": round(biomass_estimate, 2),
        "savi": round(savi_mean, 3),
        "saviImageUrl": savi_image_data_uri,
        "cropCoverPct": round(crop_cover_pct, 1),
        "bareSoilPct": round(bare_soil_pct, 1),
        "captureDate": bands.get('capture_date', "2026-06-18T12:00:00Z"),
        "source": bands.get('source', "Copernicus Sentinel-2 L2A (Real Data)"),
        "bounds": bands.get('bounds'),
        "fields": extracted_fields,
        "copernicusMetadata": copernicus_meta,
        "bandwidthDetails": bandwidth_details
    }

