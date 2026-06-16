import { apiClient } from "./apiClient";
import { HealthSummary } from "../types/Health";

export const healthApi = {
  getHealthSummary: async (): Promise<HealthSummary> => {
    const response = await apiClient.get<HealthSummary>("/health/summary");
    return response.data;
  },

  getVillageHealthMetrics: async (id: number): Promise<any> => {
    const response = await apiClient.get<any>(`/health/village/${id}`);
    return response.data;
  }
};
