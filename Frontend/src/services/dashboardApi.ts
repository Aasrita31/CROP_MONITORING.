import { apiClient } from "./apiClient";
import { Alert, VillageComparison, HealthSummary } from "../types/Health";

export const dashboardApi = {
  getOverview: async (): Promise<any> => {
    const response = await apiClient.get<any>("/dashboard/overview");
    return response.data;
  },

  getRiceBowlIndex: async (): Promise<HealthSummary> => {
    const response = await apiClient.get<HealthSummary>("/dashboard/rice-bowl-index");
    return response.data;
  },

  getAlerts: async (): Promise<Alert[]> => {
    const response = await apiClient.get<Alert[]>("/dashboard/alerts");
    return response.data;
  },

  getComparison: async (): Promise<VillageComparison[]> => {
    const response = await apiClient.get<VillageComparison[]>("/dashboard/comparison");
    return response.data;
  }
};
