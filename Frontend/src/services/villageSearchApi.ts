import { apiClient } from "./apiClient";

export interface VillageSearchResponse {
  district: string;
  latitude: number;
  longitude: number;
}

export interface SatelliteLatestResponse {
  imageUrl: string;
  captureDate: string;
  source: string;
}

export interface VillageAnalysisResult {
  ndvi: number;
  healthScore: number;
  diseaseRisk: number;
  waterStress: number;
  yieldPrediction: number;
  captureDate?: string;
  source?: string;
  imageUrl?: string;
  fields?: any[];
  [key: string]: any;
}

export const villageSearchApi = {
  searchVillage: async (villageName: string): Promise<VillageSearchResponse> => {
    const response = await apiClient.post<VillageSearchResponse>("/village/search", {
      village: villageName
    });
    return response.data;
  },

  getLatestSatellite: async (lat: number, lng: number): Promise<SatelliteLatestResponse> => {
    const response = await apiClient.get<SatelliteLatestResponse>("/satellite/latest", {
      params: { latitude: lat, longitude: lng }
    });
    return response.data;
  },

  getVillageAnalysis: async (
    name: string,
    latitude?: number,
    longitude?: number,
  ): Promise<VillageAnalysisResult> => {
    const response = await apiClient.get<VillageAnalysisResult>("/analysis/village", {
      params: { name, latitude, longitude },
    });
    return response.data;
  },
};
