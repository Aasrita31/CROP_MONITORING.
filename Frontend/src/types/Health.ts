export interface HealthSummary {
  rice_bowl_health_index: string;
  average_ndvi: number;
  healthy_area: string;
  disease_risk_area: string;
  expected_yield: string;
}

export interface Alert {
  id: number;
  severity: "info" | "warn" | "alert" | "good";
  title: string;
  message: string;
  target_type: string;
  target_id: string;
  date: string;
}

export interface VillageComparison {
  id: number;
  name: string;
  district: string;
  ndvi: number;
  health: number;
  diseaseRisk: string;
  waterStress: string;
  harvestReady: string;
  yieldPred: string;
}
