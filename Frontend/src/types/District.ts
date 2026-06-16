export interface District {
  id: number;
  name: string;
  lat: float;
  lng: float;
  area: string;
  yield_prediction: string;
  risk: string;
  color: string;
}

export type float = number;

export interface DistrictSummary {
  id: number;
  name: string;
  average_ndvi: number;
  paddy_area: string;
  yield_forecast: string;
  disease_risk: string;
}
