from fastapi import APIRouter
from app.services.sentinel_service import SentinelService
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
    return SentinelService.get_satellite_tiles()

@router.get("/latest", response_model=SatelliteLatestResponse)
def get_latest_satellite(latitude: float = None, longitude: float = None):
    return {
        "imageUrl": "/assets/satellite-farm.jpg",
        "captureDate": "2026-06-15T09:42:00Z",
        "source": "Sentinel-2"
    }
