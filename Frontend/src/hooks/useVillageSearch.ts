import { useState } from "react";
import { villageSearchApi } from "../services/villageSearchApi";
import { useDashboardContext } from "../context/DashboardContext";
import { useApp } from "../context/AppContext";

export function useVillageSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { 
    setSearchCoords, 
    setSearchQuery, 
    setVillageAnalysis, 
    setSelectedVillageId, 
    setSelectedDistrictId 
  } = useDashboardContext();
  
  const { setFarm } = useApp();

  const triggerSearch = async (villageName: string) => {
    if (!villageName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // Step 1: Geocoding via POST /api/village/search
      const searchData = await villageSearchApi.searchVillage(villageName);
      
      // Step 2: Retrieve Sentinel metadata via GET /api/satellite/latest
      const satData = await villageSearchApi.getLatestSatellite(searchData.latitude, searchData.longitude);
      
      // Step 3: Run metrics diagnostics via GET /api/analysis/village
      const analysisData = await villageSearchApi.getVillageAnalysis(villageName);

      // Save analysis and imagery parameters
      setSearchCoords([searchData.latitude, searchData.longitude]);
      setSearchQuery(villageName);
      setVillageAnalysis({
        ...analysisData,
        imageUrl: satData.imageUrl,
        captureDate: satData.captureDate,
        source: satData.source
      });

      // Synchronize dashboard grid farm selection if matching districts
      const districtMatched = ["East Godavari", "West Godavari", "Krishna", "Konaseema", "Nellore"].find(
        d => d.toLowerCase() === searchData.district.toLowerCase()
      );
      if (districtMatched) {
        setFarm(districtMatched);
        
        const districtIds: Record<string, number> = {
          "East Godavari": 1, "West Godavari": 2, "Krishna": 3, "Konaseema": 4, "Nellore": 5
        };
        const villageIds: Record<string, number> = {
          "kadiyam": 1, "bhimadole": 2, "movva": 3, "amalapuram": 4, "indukurpet": 5
        };
        
        setSelectedDistrictId(districtIds[districtMatched]);
        
        const key = villageName.toLowerCase();
        for (const [vName, vId] of Object.entries(villageIds)) {
          if (key.includes(vName) || vName.includes(key)) {
            setSelectedVillageId(vId);
            break;
          }
        }
      }

      setLoading(false);
      return searchData;
    } catch (err: any) {
      setError(err);
      setLoading(false);
      throw err;
    }
  };

  return { triggerSearch, loading, error };
}
