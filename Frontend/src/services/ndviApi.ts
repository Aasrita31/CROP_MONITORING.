import { apiClient } from "./apiClient";
import { NDVITrend } from "../types/NDVI";

export const ndviApi = {
  getStatewideNdviTrend: async (): Promise<NDVITrend[]> => {
    const response = await apiClient.get<NDVITrend[]>("/ndvi");
    return response.data;
  },

  getDistrictNdvi: async (id: number): Promise<NDVITrend[]> => {
    const response = await apiClient.get<NDVITrend[]>(`/ndvi/district/${id}`);
    return response.data;
  },

  getVillageNdvi: async (id: number): Promise<NDVITrend[]> => {
    const response = await apiClient.get<NDVITrend[]>(`/ndvi/village/${id}`);
    return response.data;
  }
};
