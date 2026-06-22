from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DistrictBase(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    area: str
    yield_prediction: str
    risk: str
    color: str

    class Config:
        from_attributes = True

class DistrictSummary(BaseModel):
    id: int
    name: str
    average_ndvi: float
    paddy_area: str
    yield_forecast: str
    disease_risk: str

class VillageBase(BaseModel):
    id: int
    name: str
    district_id: int
    lat: float
    lng: float
    ndvi: float
    health: int
    disease_risk: str
    yield_pred: str
    water_stress: str
    harvest_ready: str

    class Config:
        from_attributes = True

class FieldBase(BaseModel):
    id: str
    name: str
    village_id: int
    coordinates: List[List[float]]
    ndvi: float
    health_score: int
    status: str
    color: str
    area: float
    growth_stage: str
    disease_risk: str
    yield_prediction: str
    recommendation: str

    class Config:
        from_attributes = True

class FieldHealthResponse(BaseModel):
    field_id: str
    health_score: int
    status: str
    disease_risk: str
    water_stress: str
    npk: Dict[str, int]
    recommendation: str

class FieldNDVIResponse(BaseModel):
    field_id: str
    ndvi: float
    history: List[Dict[str, Any]]

class NDVITrend(BaseModel):
    date: str
    ndvi_value: float

class HealthSummaryResponse(BaseModel):
    rice_bowl_health_index: str
    average_ndvi: float
    healthy_area: str
    disease_risk_area: str
    expected_yield: str

class DashboardOverview(BaseModel):
    districts_count: int
    villages_count: int
    fields_count: int
    total_area_ha: float
    avg_health_score: float

class AlertResponse(BaseModel):
    id: int
    severity: str
    title: str
    message: str
    target_type: str
    target_id: str
    date: str

    class Config:
        from_attributes = True

class VillageComparison(BaseModel):
    id: int
    name: str
    district: str
    ndvi: float
    health: int
    diseaseRisk: str
    waterStress: str
    harvestReady: str
    yieldPred: str

class VillageSearchRequest(BaseModel):
    village: str

class VillageSearchResponse(BaseModel):
    district: str
    latitude: float
    longitude: float

class SatelliteLatestResponse(BaseModel):
    imageUrl: str
    captureDate: str
    source: str

class VillageAnalysisResult(BaseModel):
    ndvi: float
    ndmi: float
    ndmiMin: float
    ndmiMax: float
    b4: float
    b8: float
    b11: float
    healthScore: int
    diseaseRisk: int
    waterStress: int
    yieldPrediction: float
    imageUrl: Optional[str] = None
    ndmiImageUrl: Optional[str] = None
    trueColorImageUrl: Optional[str] = None
    evi: Optional[float] = None
    eviMin: Optional[float] = None
    eviMax: Optional[float] = None
    eviImageUrl: Optional[str] = None
    eviHistoricalImageUrl: Optional[str] = None
    growthStage: Optional[str] = None
    biomassEstimate: Optional[float] = None
    savi: Optional[float] = None
    saviImageUrl: Optional[str] = None
    cropCoverPct: Optional[float] = None
    bareSoilPct: Optional[float] = None
    captureDate: Optional[str] = None
    source: Optional[str] = None
    bounds: Optional[List[List[float]]] = None
    fields: Optional[List[Dict[str, Any]]] = None
    copernicusMetadata: Optional[Dict[str, Any]] = None
    bandwidthDetails: Optional[List[Dict[str, Any]]] = None
