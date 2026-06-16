import { apiClient } from "./apiClient";
import { District, DistrictSummary } from "../types/District";

export const districtApi = {
  getDistricts: async (): Promise<District[]> => {
    const response = await apiClient.get<District[]>("/districts");
    return response.data;
  },
  
  getDistrictById: async (id: number): Promise<District> => {
    const response = await apiClient.get<District>(`/districts/${id}`);
    return response.data;
  },

  getDistrictSummary: async (id: number): Promise<DistrictSummary> => {
    const response = await apiClient.get<DistrictSummary>(`/districts/${id}/summary`);
    return response.data;
  }
};
