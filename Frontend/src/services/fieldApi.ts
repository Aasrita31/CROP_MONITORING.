import { apiClient } from "./apiClient";
import { Field, FieldHealth } from "../types/Field";
import { FieldNDVIHistory } from "../types/NDVI";

export const fieldApi = {
  getFields: async (): Promise<Field[]> => {
    const response = await apiClient.get<Field[]>("/fields");
    return response.data;
  },

  getFieldById: async (id: string): Promise<Field> => {
    const response = await apiClient.get<Field>(`/fields/${id}`);
    return response.data;
  },

  getFieldHealth: async (id: string): Promise<FieldHealth> => {
    const response = await apiClient.get<FieldHealth>(`/fields/${id}/health`);
    return response.data;
  },

  getFieldNdvi: async (id: string): Promise<FieldNDVIHistory> => {
    const response = await apiClient.get<FieldNDVIHistory>(`/fields/${id}/ndvi`);
    return response.data;
  }
};
