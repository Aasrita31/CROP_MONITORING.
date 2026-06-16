export interface Field {
  id: string;
  name: string;
  village_id: number;
  coordinates: [number, number][];
  ndvi: number;
  health_score: number;
  status: string;
  color: string;
  area: number;
  growth_stage: string;
  disease_risk: string;
  yield_prediction: string;
  recommendation: string;
}

export interface FieldHealth {
  field_id: string;
  health_score: number;
  status: string;
  disease_risk: string;
  water_stress: string;
  npk: {
    n: number;
    p: number;
    k: number;
  };
  recommendation: string;
}
