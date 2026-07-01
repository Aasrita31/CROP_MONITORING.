import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import satelliteImg from "@/assets/satellite-farm.jpg";
import wheatEarImg from "@/assets/wheat-ear.png";
import { 
  Leaf, Sun, Droplets, Sparkles, TrendingUp, Microscope, Wheat, 
  CloudSun, CloudRain, Activity, Bell, Bot, Bug, Calendar, FlaskConical 
} from "lucide-react";
import { districtApi } from "../services/districtApi";
import { ndviApi } from "../services/ndviApi";
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
  selectedVillage: string | null;
  aiOpen: boolean;
  setAiOpen: (open: boolean) => void;
  addFieldOpen: boolean;
  setAddFieldOpen: (open: boolean) => void;
  highlightedFields: string[];
  setHighlightedFields: (fields: string[]) => void;
  dashboardMode: "farmer" | "expert";
  setDashboardMode: (mode: "farmer" | "expert") => void;
  applyVillageSearchResults: (payload: {
    villageName: string;
    district: string;
    coords: [number, number];
    analysis: any;
    fields: any[];
    kpis: any[];
    insights: any[];
  }) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [farm, setFarm] = useState("East Godavari");
  const [crop, setCrop] = useState("Paddy");
  const [aiOpen, setAiOpen] = useState(false);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [dashboardMode, setDashboardMode] = useState<"farmer" | "expert">("farmer");

  const [activeFarmData, setActiveFarmData] = useState<any>({
    name: "East Godavari — Search a village",
    coordinates: "16.9891°N · 82.2475°E",
    center: [16.9891, 82.2475],
    crop: "Paddy",
    backdrop: satelliteImg,
    cropUnit: "t/ha",
    cropText: "Paddy Quality Index",
    cropSubtitle: "Search a village to load Copernicus Sentinel-2 data",
    kpis: [
      {
        label: "District NDVI",
        value: 0.65,
        suffix: " index",
        tone: "healthy",
        icon: ICON_MAP["Sparkles"],
        trend: "+1.8%",
        spark: [0.55, 0.58, 0.6, 0.62, 0.65],
      },
      {
        label: "District Yield Forecast",
        value: 5.2,
        suffix: " t/ha",
        tone: "healthy",
        icon: ICON_MAP["TrendingUp"],
        trend: "+0.4 t",
        decimals: 1,
        spark: [4.5, 4.8, 5.0, 5.2, 5.2],
      },
    ],
    fields: [],
    insights: [],
    charts: {
      healthTrend: [],
    },
    qualityFruit: [],
  });
  const [weatherData, setWeatherData] = useState<any>({
    temperature: 32,
    humidity: 74,
    windSpeed: 12,
    condition: "Partly Cloudy",
    forecast: []
  });
  const [nationalNdvi, setNationalNdvi] = useState<any>(null);
  const [selectedVillage, setSelectedVillage] = useState<string | null>(null);

  const applyVillageSearchResults = useCallback(
    (payload: {
      villageName: string;
      district: string;
      coords: [number, number];
      analysis: any;
      fields: any[];
      kpis: any[];
      insights: any[];
    }) => {
      setSelectedVillage(payload.villageName);
      setActiveFarmData((prev: any) => ({
        ...(prev || {}),
        name: `${payload.villageName} Paddy Monitoring`,
        coordinates: `${payload.coords[0].toFixed(4)}°N · ${payload.coords[1].toFixed(4)}°E`,
        center: payload.coords,
        crop: "Paddy",
        backdrop: satelliteImg,
        cropUnit: "t/ha",
        cropText: `${payload.villageName} Paddy Quality Index`,
        cropSubtitle: `Copernicus Sentinel-2 · ${payload.analysis.source || "Real satellite data"}`,
        kpis: payload.kpis.map((k) => ({
          ...k,
          icon: typeof k.icon === "function" ? k.icon : ICON_MAP[k.icon as string] || ICON_MAP.Leaf,
        })),
        fields: payload.fields,
        insights: payload.insights.map((i) => ({
          ...i,
          icon:
            i.tone === "warn"
              ? ICON_MAP.FlaskConical
              : i.tone === "alert"
                ? ICON_MAP.Microscope
                : i.tone === "good"
                  ? ICON_MAP.Leaf
                  : ICON_MAP.CloudRain,
        })),
        qualityFruit: payload.fields.map((f) => ({
          id: f.id,
          img: wheatEarImg,
          label: f.name.split(" — ")[0],
          status: f.dominant,
          size: f.health,
          note: f.rec.slice(0, 40) + "...",
        })),
        copernicusAnalysis: payload.analysis,
      }));
    },
    [],
  );

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
          ndviApi.getDistrictNdvi(districtId),
          dashboardApi.getAlerts(),
        ])
          .then(async (results) => {
            const summary =
              results[0].status === "fulfilled"
                ? results[0].value
                : { average_ndvi: 0.65, yield_forecast: "5.0 t/ha" };
            const ndviHistory = results[1].status === "fulfilled" ? results[1].value : [];
            const alerts = results[2].status === "fulfilled" ? results[2].value : [];

            const formattedCharts = {
              healthTrend: ndviHistory.map((h) => ({
                d: h.date,
                health: Math.round(h.ndvi_value * 100),
                yield: 4.0 + h.ndvi_value * 3.0,
                disease: Math.round((1 - h.ndvi_value) * 30),
                pest: Math.round((1 - h.ndvi_value) * 20),
                water: Math.round(h.ndvi_value * 150),
              })),
            };

            const formattedKpis = [
              {
                label: "District NDVI",
                value: summary.average_ndvi,
                suffix: " index",
                tone: "healthy",
                icon: ICON_MAP["Sparkles"],
                trend: "+1.8%",
                spark: [0.55, 0.58, 0.6, 0.62, summary.average_ndvi],
              },
              {
                label: "District Yield Forecast",
                value: parseFloat(summary.yield_forecast.split(" ")[0]),
                suffix: " t/ha",
                tone: "healthy",
                icon: ICON_MAP["TrendingUp"],
                trend: "+0.4 t",
                decimals: 1,
                spark: [4.5, 4.8, 5.0, 5.2, parseFloat(summary.yield_forecast.split(" ")[0])],
              },
            ];

            const formattedInsights = alerts
              .filter((a) =>
                a.target_type === "district" ? parseInt(a.target_id) === districtId : true,
              )
              .slice(0, 5)
              .map((a) => ({
                tone: a.severity,
                icon:
                  a.severity === "warn"
                    ? ICON_MAP["FlaskConical"]
                    : a.severity === "alert"
                      ? ICON_MAP["Microscope"]
                      : ICON_MAP["CloudRain"],
                text: a.message,
                meta: a.title,
              }));

            setActiveFarmData((prev: any) => {
              if (prev?.copernicusAnalysis) {
                return { ...prev, charts: formattedCharts };
              }

              return {
                name: `${district.name} — Search a village`,
                coordinates: `${district.lat}°N · ${district.lng}°E`,
                center: [district.lat, district.lng],
                crop: "Paddy",
                backdrop: satelliteImg,
                cropUnit: "t/ha",
                cropText: "Paddy Quality Index",
                cropSubtitle: "Search a village to load Copernicus Sentinel-2 data",
                kpis: formattedKpis,
                fields: [],
                insights: formattedInsights,
                charts: formattedCharts,
                qualityFruit: [],
              };
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
          .catch((e) => {
            console.warn("Weather fetch failed — showing fallback:", e);
            // Use static fallback so the UI never hangs
            setWeatherData({
              temperature: 32,
              humidity: 74,
              windSpeed: 12,
              condition: "Partly Cloudy",
              forecast: []
            });
          });
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
        selectedVillage,
        aiOpen,
        setAiOpen,
        addFieldOpen,
        setAddFieldOpen,
        highlightedFields,
        setHighlightedFields,
        dashboardMode,
        setDashboardMode,
        applyVillageSearchResults,
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
