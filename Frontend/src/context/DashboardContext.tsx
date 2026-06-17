import React, { createContext, useContext, useState } from "react";

interface DashboardContextType {
  selectedDistrictId: number | null;
  setSelectedDistrictId: (id: number | null) => void;
  selectedVillageId: number | null;
  setSelectedVillageId: (id: number | null) => void;
  selectedFieldId: string | null;
  setSelectedFieldId: (id: string | null) => void;
  searchCoords: [number, number] | null;
  setSearchCoords: (coords: [number, number] | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  villageAnalysis: any;
  setVillageAnalysis: (analysis: any) => void;
  searchFields: any[];
  setSearchFields: (fields: any[]) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState<number | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [villageAnalysis, setVillageAnalysis] = useState<any>(null);
  const [searchFields, setSearchFields] = useState<any[]>([]);

  return (
    <DashboardContext.Provider
      value={{
        selectedDistrictId,
        setSelectedDistrictId,
        selectedVillageId,
        setSelectedVillageId,
        selectedFieldId,
        setSelectedFieldId,
        searchCoords,
        setSearchCoords,
        searchQuery,
        setSearchQuery,
        villageAnalysis,
        setVillageAnalysis,
        searchFields,
        setSearchFields
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboardContext must be used within DashboardProvider");
  return ctx;
}
export default DashboardContext;
