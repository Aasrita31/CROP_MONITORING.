import React, { createContext, useContext, useState, useEffect } from "react";
import satelliteImg from "@/assets/satellite-farm.jpg";
import wheatEarImg from "@/assets/wheat-ear.png";
import { 
  Leaf, Sun, Droplets, Sparkles, TrendingUp, Microscope, Wheat, 
  CloudSun, CloudRain, Activity, Bell, Bot, Bug, Calendar, FlaskConical 
} from "lucide-react";
import { districtApi } from "../services/districtApi";
import { villageApi } from "../services/villageApi";
import { fieldApi } from "../services/fieldApi";
import { ndviApi } from "../services/ndviApi";
import { healthApi } from "../services/healthApi";
import { dashboardApi } from "../services/dashboardApi";

export const ICON_MAP: Record<string, any> = {
  Leaf, Sun, Droplets, Sparkles, TrendingUp, Microscope, Wheat, 
  CloudSun, CloudRain, Activity, Bell, Bot, Bug, Calendar, FlaskConical
};

interface AppContextType {
  farm: string;
  setFarm: (farm: string) => void;
  crop: string;
  setCrop: (crop: string) => void;
  activeFarm: any;
  weatherData: any;
  nationalNdvi: any;
  aiOpen: boolean;
  setAiOpen: (open: boolean) => void;
  addFieldOpen: boolean;
  setAddFieldOpen: (open: boolean) => void;
  highlightedFields: string[];
  setHighlightedFields: (fields: string[]) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [farm, setFarm] = useState("East Godavari");
  const [crop, setCrop] = useState("Paddy");
  const [aiOpen, setAiOpen] = useState(false);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);

  const [activeFarmData, setActiveFarmData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [nationalNdvi, setNationalNdvi] = useState<any>(null);

  // Sync crop profile to Paddy
  useEffect(() => {
    setCrop("Paddy");
  }, [farm]);

  // Fetch National/State-wide NDVI data on load
  useEffect(() => {
    ndviApi.getStatewideNdviTrend()
      .then((data) => {
        // Map to state_ndvi_data compatibility
        const mapped: Record<string, any> = {
          "ap": { "ndvi": 0.68, "crop": "Paddy", "acreage": "1.25M ha", "status": "Good", "moisture": 64 }
        };
        setNationalNdvi(mapped);
      })
      .catch((e) => console.error("Error fetching state NDVI trend:", e));
  }, []);

  // Fetch Farm and Weather data when active district (farm) changes
  useEffect(() => {
    let districtName = farm;
    // Default fallback if not matched
    if (!["East Godavari", "West Godavari", "Krishna", "Konaseema", "Nellore"].includes(districtName)) {
      districtName = "East Godavari";
    }

    districtApi.getDistricts()
      .then((districts) => {
        const district = districts.find(d => d.name === districtName) || districts[0];
        if (!district) return;

        const districtId = district.id;

        // Fetch remaining details asynchronously
        // Fetch remaining details asynchronously using allSettled to prevent single endpoint failure crashing the UI
        Promise.allSettled([
          districtApi.getDistrictSummary(districtId),
          villageApi.getVillages(), // Get villages to filter by district
          ndviApi.getDistrictNdvi(districtId),
          dashboardApi.getAlerts()
        ])
          .then(async (results) => {
            const summary = results[0].status === "fulfilled" ? results[0].value : { average_ndvi: 0.65, yield_forecast: "5.0 t/ha" };
            const allVillages = results[1].status === "fulfilled" ? results[1].value : [];
            const ndviHistory = results[2].status === "fulfilled" ? results[2].value : [];
            const alerts = results[3].status === "fulfilled" ? results[3].value : [];

            const districtVillages = allVillages.filter(v => v.district_id === districtId);
            const primaryVillage = districtVillages[0] || { id: 1, name: "Kadiyam", ndvi: 0.82, health: 92, disease_risk: "Low", yield_pred: "6.5 t/ha", water_stress: "None", harvest_ready: "20%" };

            // Fetch fields for the primary village
            const fields = await villageApi.getFieldsByVillage(primaryVillage.id);

            // Construct fields list formatted with mock properties for other views
            const formattedFields = fields.map((f, i) => {
              const yieldNum = parseFloat(f.yield_prediction.replace(/[^\d.]/g, '')) || 5.0;
              return {
                id: f.id,
                name: f.name,
                coordinates: f.coordinates,
                ndvi: f.ndvi,
                health: f.health_score,
                disease: f.status === "Disease Risk" ? 34 : 6,
                water: f.status === "Water Stress" ? 38 : 74,
                npk: {
                  n: f.status === "Nutrient Stress" ? 42 : 78,
                  p: f.status === "Nutrient Stress" ? 48 : 68,
                  k: f.status === "Nutrient Stress" ? 38 : 72
                },
                mix: f.status === "Healthy" 
                  ? { healthy: 70, nutrient: 10, water: 10, disease: 5, pest: 5 }
                  : (f.status === "Water Stress"
                    ? { healthy: 30, nutrient: 15, water: 45, disease: 5, pest: 5 }
                    : (f.status === "Nutrient Stress"
                      ? { healthy: 35, nutrient: 40, water: 15, disease: 5, pest: 5 }
                      : { healthy: 30, nutrient: 15, water: 10, disease: 40, pest: 5 })),
                stage: f.growth_stage,
                yield: yieldNum,
                harvestIn: f.status === "Healthy" ? 18 : 25,
                rec: f.recommendation,
                dominant: f.status === "Healthy" ? "healthy" : (f.status === "Water Stress" ? "water" : (f.status === "Nutrient Stress" ? "nutrient" : "disease")),
                area: `${f.area} Hectares`,
                surveyNo: `SUR-${1000 + i}`,
                village: `${primaryVillage.name} Block ${i + 1}`,
                aiConfidence: `${Math.floor(88 + Math.random() * 10)}%`,
                lastScan: `${Math.floor(Math.random() * 12 + 1)} hours ago`
              };
            });

            // Map alerts to old insights format
            const formattedInsights = alerts
              .filter(a => a.target_type === "district" ? parseInt(a.target_id) === districtId : true)
              .slice(0, 5)
              .map(a => ({
                tone: a.severity,
                icon: a.severity === "warn" ? ICON_MAP["FlaskConical"] : (a.severity === "alert" ? ICON_MAP["Microscope"] : ICON_MAP["CloudRain"]),
                text: a.message,
                meta: a.title
              }));

            // Map historical trend values
            const formattedCharts = {
              healthTrend: ndviHistory.map((h, i) => ({
                d: h.date,
                health: Math.round(h.ndvi_value * 100),
                yield: 4.0 + h.ndvi_value * 3.0,
                disease: Math.round((1 - h.ndvi_value) * 30),
                pest: Math.round((1 - h.ndvi_value) * 20),
                water: Math.round(h.ndvi_value * 150)
              }))
            };

            // Map standard KPIs expected by other views
            const formattedKpis = [
              { label: "Farm Health Score", value: primaryVillage.health, suffix: "/100", tone: "healthy", icon: ICON_MAP["Leaf"], trend: "+2.5%", spark: [72, 75, 78, 80, 82, 85, 88, primaryVillage.health] },
              { label: "Canopy NDVI", value: summary.average_ndvi, suffix: " index", tone: "healthy", icon: ICON_MAP["Sparkles"], trend: "+1.8%", spark: [0.55, 0.58, 0.60, 0.62, 0.65, summary.average_ndvi] },
              { label: "Predicted Yield", value: parseFloat(summary.yield_forecast.split(' ')[0]), suffix: " t/ha", tone: "healthy", icon: ICON_MAP["TrendingUp"], trend: "+0.4 t", decimals: 1, spark: [4.5, 4.8, 5.0, 5.2, parseFloat(summary.yield_forecast.split(' ')[0])] },
              { label: "Disease Risk", value: primaryVillage.disease_risk.includes('Low') ? 12 : (primaryVillage.disease_risk.includes('Moderate') ? 35 : (primaryVillage.disease_risk.includes('High') ? 62 : 80)), suffix: "%", tone: "disease", icon: ICON_MAP["Microscope"], trend: "-1.5%", spark: [20, 18, 16, 15, 12] },
              { label: "Soil Moisture", value: primaryVillage.water_stress === "None" ? 72 : (primaryVillage.water_stress === "Low" ? 64 : (primaryVillage.water_stress === "Moderate" ? 48 : 28)), suffix: "%", tone: "water", icon: ICON_MAP["Droplets"], trend: "+4.2%", spark: [55, 58, 62, 65, primaryVillage.water_stress === "None" ? 72 : 64] },
              { label: "Harvest Readiness", value: parseInt(primaryVillage.harvest_ready.replace('%', '')), suffix: "%", tone: "healthy", icon: ICON_MAP["Wheat"] || ICON_MAP["Leaf"], trend: "+5.0%", spark: [5, 10, 15, 20] }
            ];

            setActiveFarmData({
              name: `${district.name} Paddy Belt`,
              coordinates: `${district.lat}°N · ${district.lng}°E`,
              center: [district.lat, district.lng],
              crop: "Paddy",
              backdrop: satelliteImg,
              cropUnit: "t/ha",
              cropText: "Paddy Quality Index",
              cropSubtitle: "AI kernel analysis & grain size morphology",
              kpis: formattedKpis,
              fields: formattedFields,
              insights: formattedInsights,
              charts: formattedCharts,
              qualityFruit: formattedFields.map(f => ({
                id: f.id,
                img: wheatEarImg,
                label: f.name.split(' — ')[0],
                status: f.dominant,
                size: f.health,
                note: f.rec.slice(0, 30) + "..."
              }))
            });
          })
          .catch((err) => console.error("Error linking context data:", err));

        // Fetch Weather data
        fetch(`http://127.0.0.1:8000/api/weather/${districtId}`)
          .then(r => r.json())
          .then(data => {
            if (data.forecast) {
              data.forecast = data.forecast.map((w: any) => ({ ...w, icon: ICON_MAP[w.icon] || Sun }));
            }
            setWeatherData(data);
          })
          .catch((e) => console.error("Error fetching weather:", e));
      })
      .catch((e) => console.error("Error fetching districts list:", e));
  }, [farm]);

  return (
    <AppContext.Provider
      value={{
        farm,
        setFarm,
        crop,
        setCrop,
        activeFarm: activeFarmData,
        weatherData,
        nationalNdvi,
        aiOpen,
        setAiOpen,
        addFieldOpen,
        setAddFieldOpen,
        highlightedFields,
        setHighlightedFields
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
