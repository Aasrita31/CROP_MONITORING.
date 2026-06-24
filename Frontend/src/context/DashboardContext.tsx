import React, { createContext, useContext, useState, useEffect } from "react";

export interface RegisteredField {
  id: string;
  name: string;
  polygon: [number, number][]; // [lat, lon] pairs
  areaAcres: number;
  areaHectares: number;
  villageName: string;
  districtName: string;
  landStatus: "sown" | "barren" | null;
  createdAt: string;
}

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
  activePanel: string;
  setActivePanel: (panel: string) => void;
  // Farm Registration
  registeredFields: RegisteredField[];
  setRegisteredFields: (fields: RegisteredField[]) => void;
  activeField: RegisteredField | null;
  setActiveField: (field: RegisteredField | null) => void;
  fieldPolygonAnalysis: any;
  setFieldPolygonAnalysis: (analysis: any) => void;
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
  const [activePanel, setActivePanel] = useState<string>("Farm Registration & Fields");
  // Farm Registration state — persisted in localStorage
  const [registeredFields, _setRegisteredFields] = useState<RegisteredField[]>(() => {
    try {
      const saved = localStorage.getItem("agritwin_registered_fields");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeField, setActiveField] = useState<RegisteredField | null>(null);
  const [fieldPolygonAnalysis, setFieldPolygonAnalysis] = useState<any>(null);

  const setRegisteredFields = (fields: RegisteredField[]) => {
    _setRegisteredFields(fields);
    try { localStorage.setItem("agritwin_registered_fields", JSON.stringify(fields)); } catch {}
  };

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
        setSearchFields,
        activePanel,
        setActivePanel,
        registeredFields,
        setRegisteredFields,
        activeField,
        setActiveField,
        fieldPolygonAnalysis,
        setFieldPolygonAnalysis,
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
