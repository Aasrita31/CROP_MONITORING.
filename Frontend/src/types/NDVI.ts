export interface NDVITrend {
  date: string;
  ndvi_value: number;
}

export interface FieldNDVIHistory {
  field_id: string;
  ndvi: number;
  history: NDVITrend[];
}
