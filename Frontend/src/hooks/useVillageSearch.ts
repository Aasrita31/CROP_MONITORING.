import { useState } from "react";
import { villageSearchApi } from "../services/villageSearchApi";
import { useDashboardContext } from "../context/DashboardContext";
import { useApp, ICON_MAP } from "../context/AppContext";
import {
  buildFieldFromCopernicusPolygon,
  buildInsightsFromAnalysis,
  buildKpisFromVillageAnalysis,
  normalizeVillageName,
} from "../lib/copernicusFieldMapper";

export function useVillageSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    setSearchCoords,
    setSearchQuery,
    setVillageAnalysis,
    setSelectedVillageId,
    setSelectedDistrictId,
    setSearchFields,
  } = useDashboardContext();

  const { setFarm, applyVillageSearchResults } = useApp();

  const triggerSearch = async (villageName: string, latitude?: number, longitude?: number) => {
    setLoading(true);
    setError(null);

    try {
      let searchData: { district: string; latitude: number; longitude: number };
      let finalVillageName = villageName;

      if (latitude !== undefined && longitude !== undefined) {
        let district = "Andhra Pradesh";
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            finalVillageName = addr.village || addr.suburb || addr.town || addr.city || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            district = addr.county || addr.state_district || addr.state || "Andhra Pradesh";
          }
        } catch (e) {
          console.error("Reverse geocoding failed", e);
        }
        searchData = {
          district,
          latitude,
          longitude
        };
      } else {
        if (!villageName.trim()) {
          setLoading(false);
          return;
        }
        searchData = await villageSearchApi.searchVillage(villageName);
      }

      const [satData, analysisData] = await Promise.all([
        villageSearchApi.getLatestSatellite(searchData.latitude, searchData.longitude),
        villageSearchApi.getVillageAnalysis(
          finalVillageName,
          searchData.latitude,
          searchData.longitude,
        ),
      ]);

      const enrichedAnalysis = {
        ...analysisData,
        imageUrl: satData.imageUrl || analysisData.imageUrl,
        captureDate: satData.captureDate || analysisData.captureDate,
        source: satData.source || analysisData.source,
      };


      let realFields: ReturnType<typeof buildFieldFromCopernicusPolygon>[] = [];
      if (enrichedAnalysis.fields && Array.isArray(enrichedAnalysis.fields)) {
        realFields = enrichedAnalysis.fields.map((poly: any, i: number) =>
          buildFieldFromCopernicusPolygon(poly, i, villageName, enrichedAnalysis),
        );
      }

      const villageLabel = normalizeVillageName(villageName);
      const coords: [number, number] = [searchData.latitude, searchData.longitude];

      setSearchCoords(coords);
      setSearchQuery(villageLabel);
      setVillageAnalysis(enrichedAnalysis);
      setSearchFields(realFields);

      const districtMatched = [
        "East Godavari",
        "West Godavari",
        "Krishna",
        "Konaseema",
        "Nellore",
      ].find((d) => d.toLowerCase() === searchData.district.toLowerCase());

      if (districtMatched) {
        setFarm(districtMatched);

        const districtIds: Record<string, number> = {
          "East Godavari": 1,
          "West Godavari": 2,
          Krishna: 3,
          Konaseema: 4,
          Nellore: 5,
        };
        setSelectedDistrictId(districtIds[districtMatched] ?? null);
      }

      setSelectedVillageId(null);

      applyVillageSearchResults({
        villageName: villageLabel,
        district: searchData.district,
        coords,
        analysis: enrichedAnalysis,
        fields: realFields,
        kpis: buildKpisFromVillageAnalysis(enrichedAnalysis, villageLabel, ICON_MAP),
        insights: buildInsightsFromAnalysis(enrichedAnalysis, villageLabel),
      });

      setLoading(false);
      return searchData;
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
      throw err;
    }
  };

  return { triggerSearch, loading, error };
}
