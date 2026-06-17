from fastapi import APIRouter
from app.services.sentinel_service import SentinelService
from app.services.ndvi_service import NdviService
from app.schemas.response_models import SatelliteLatestResponse

router = APIRouter(prefix="/satellite", tags=["Satellite"])

@router.get("/image")
def get_satellite_image():
    return {
        "status": "success",
        "url": "/assets/satellite-farm.jpg",
        "timestamp": "2026-06-15T09:42:00Z",
        "resolution": "10 meters"
    }

@router.get("/tiles")
def get_satellite_tiles():
    return [
        {"tile_id": "T44PQA", "region": "Godavari Deltas", "paddy_area_ha": 670000, "avg_ndvi": 0.83, "cloud_free": True},
        {"tile_id": "T44PQB", "region": "Krishna Delta", "paddy_area_ha": 280000, "avg_ndvi": 0.65, "cloud_free": True},
        {"tile_id": "T44PPA", "region": "Nellore Belt", "paddy_area_ha": 190000, "avg_ndvi": 0.35, "cloud_free": False}
    ]

@router.get("/latest", response_model=SatelliteLatestResponse)
def get_latest_satellite(latitude: float = None, longitude: float = None):
    if not latitude or not longitude:
        latitude = 16.5
        longitude = 80.6
        
    # Calculate a 0.02x0.02 degree bounding box (~2km x 2km)
    bbox = [
        latitude - 0.01,
        latitude + 0.01,
        longitude - 0.01,
        longitude + 0.01
    ]
    
    # Fetch B4 and B8 bands (mocked or real)
    bands = SentinelService.fetch_sentinel2_bands(bbox)
    
    # Calculate NDVI
    ndvi_array = NdviService.calculate_ndvi(bands['b4'], bands['b8'])
    
    # Generate Heatmap image
    image_data_uri = NdviService.generate_heatmap_overlay(ndvi_array)
    
    return {
        "imageUrl": image_data_uri,
        "captureDate": bands['capture_date'],
        "source": bands['source']
    }

@router.get("/fields")
def get_satellite_fields(latitude: float = None, longitude: float = None):
    if not latitude or not longitude:
        return []
        
    # Same bounding box as /latest
    bbox = [
        latitude - 0.01,
        latitude + 0.01,
        longitude - 0.01,
        longitude + 0.01
    ]
    
    # Fetch B4 and B8 bands (mocked or real)
    bands = SentinelService.fetch_sentinel2_bands(bbox)
    
    # Calculate NDVI
    ndvi_array = NdviService.calculate_ndvi(bands['b4'], bands['b8'])
    
    # Extract real polygons using OpenCV
    polygons = NdviService.extract_crop_polygons(ndvi_array, bands['bounds'])
    
    return polygons
