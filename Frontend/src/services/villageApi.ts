import { apiClient } from "./apiClient";
import { Village, VillageAnalysis } from "../types/Village";
import { Field } from "../types/Field";

export const villageApi = {
  getVillages: async (): Promise<Village[]> => {
    const response = await apiClient.get<Village[]>("/villages");
    return response.data;
  },

  getVillageById: async (id: number): Promise<Village> => {
    const response = await apiClient.get<Village>(`/villages/${id}`);
    return response.data;
  },

  getFieldsByVillage: async (id: number): Promise<Field[]> => {
    const response = await apiClient.get<Field[]>(`/villages/${id}/fields`);
    return response.data;
  },

  getVillageAnalysis: async (id: number): Promise<VillageAnalysis> => {
    const response = await apiClient.get<VillageAnalysis>(`/villages/${id}/analysis`);
    return response.data;
  }
};
