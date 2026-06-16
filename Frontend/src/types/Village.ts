export interface Village {
  id: number;
  name: string;
  district_id: number;
  lat: number;
  lng: number;
  ndvi: number;
  health: number;
  disease_risk: string;
  yield_pred: string;
  water_stress: string;
  harvest_ready: string;
}

export interface VillageAnalysis {
  village_id: number;
  name: string;
  ndvi: number;
  health_score: number;
  total_fields: number;
  total_area_ha: number;
  disease_risk: string;
  water_stress: string;
  harvest_readiness: string;
  status_distribution: Record<string, number>;
}
