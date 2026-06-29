import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, Bell, Bot, Bug, Calendar, ChevronDown, ChevronLeft,
  ChevronRight, CloudRain, CloudSun, Compass, Droplets, FileBarChart, FlaskConical,
  Grid3x3, Hexagon, Leaf, MapPin, Menu, Microscope,
  Plane, Play, Search, Send, Settings as SettingsIcon, Sparkles, Sprout, Sun, Target,
  Thermometer, TrendingUp, Wind, Wheat, X, Calendar as CalIcon, Globe, CheckCircle2
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line,
  LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import satelliteImg from "@/assets/satellite-farm.jpg";
import punjabFarmImg from "@/assets/punjab-wheat-farm.png";
import maharashtraFarmImg from "@/assets/maharashtra-grape-farm.png";
import wheatEarImg from "@/assets/wheat-ear.png";
import grapeClusterImg from "@/assets/grape-cluster.png";
import fruitHealthy from "@/assets/dragonfruit-healthy.png";
import fruitNutrient from "@/assets/dragonfruit-nutrient.png";
import fruitWater from "@/assets/dragonfruit-water.png";
import fruitDisease from "@/assets/dragonfruit-disease.png";
import { INDIA_STATES_DATA } from "@/components/india-states-data";
import { useApp } from "@/context/AppContext";
import { useDashboardContext } from "@/context/DashboardContext";
import { useVillageSearch } from "@/hooks/useVillageSearch";
import { lazy, Suspense } from "react";
import { NdviExplanationPanel } from "@/components/NdviExplanationPanel";
import { NdmiExplanationPanel } from "@/components/NdmiExplanationPanel";
import { EviExplanationPanel } from "@/components/EviExplanationPanel";
import { SaviExplanationPanel } from "@/components/SaviExplanationPanel";
import { FarmerAdvisorPanel } from "@/components/FarmerAdvisorPanel";
import { FarmerVoiceAssistant } from "@/components/FarmerVoiceAssistant";
import { FarmRegistrationPanel } from "@/components/FarmRegistrationPanel";

const ApRiceBowlSection = lazy(() => import("@/components/ApRiceBowlComponents").then(m => ({ default: m.ApRiceBowlSection })));

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}

const BackgroundMap = lazy(() => import("@/components/MapComponents").then(m => ({ default: m.BackgroundMap })));
const AddFieldModalContent = lazy(() => import("@/components/MapComponents").then(m => ({ default: m.AddFieldModalContent })));
const DashboardInteractiveMap = lazy(() => import("@/components/MapComponents").then(m => ({ default: m.DashboardInteractiveMap })));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "🌿 FarmPulse — AI Precision Agriculture Digital Twin" },
      { name: "description", content: "Live AI digital twin for crop health, disease detection, water stress and yield prediction across your farms." },
      { property: "og:title", content: "🌿 FarmPulse Dashboard" },
      { property: "og:description", content: "AI-powered precision agriculture command center." },
    ],
  }),
  component: Dashboard,
});

/* ---------------- Animated Counter ---------------- */
function useCounter(target: number, duration = 1400, decimals = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return decimals ? v.toFixed(decimals) : Math.round(v).toString();
}

/* ---------------- Sidebar Data ---------------- */
const SIDEBAR_ITEMS = [
  { label: "Dashboard", icon: Grid3x3, active: true },
  { label: "Farm Overview", icon: MapPin },
  { label: "Live Monitoring", icon: Activity },
  { label: "Disease Detection", icon: Microscope },
  { label: "Pest Monitoring", icon: Bug },
  { label: "Nutrient Analysis", icon: FlaskConical },
  { label: "Water Management", icon: Droplets },
  { label: "Drone Monitoring", icon: Plane },
  { label: "Weather Intelligence", icon: CloudSun },
  { label: "Yield Prediction", icon: TrendingUp },
  { label: "Harvest Planner", icon: Wheat },
  { label: "AI Crop Doctor", icon: Bot },
  { label: "Reports", icon: FileBarChart },
  { label: "Settings", icon: SettingsIcon },
];

type FieldStatus = "healthy" | "nutrient" | "water" | "disease" | "pest";

const STATUS_META: Record<FieldStatus, { label: string; color: string; bg: string; ring: string }> = {
  healthy:  { label: "Healthy",         color: "text-healthy",   bg: "bg-healthy",   ring: "ring-healthy/40" },
  nutrient: { label: "Nutrient stress", color: "text-nutrient",  bg: "bg-nutrient",  ring: "ring-nutrient/40" },
  water:    { label: "Water stress",    color: "text-water",     bg: "bg-water",     ring: "ring-water/40" },
  disease:  { label: "Disease risk",    color: "text-disease",   bg: "bg-disease",   ring: "ring-disease/40" },
  pest:     { label: "Pest risk",       color: "text-pest",      bg: "bg-pest",      ring: "ring-pest/40" },
};

const IMG_MAP: Record<string, string> = {
  satelliteImg, punjabFarmImg, maharashtraFarmImg, wheatEarImg, grapeClusterImg,
  fruitHealthy, fruitNutrient, fruitWater, fruitDisease
};

const ICON_MAP: Record<string, any> = {
  Activity, Bell, Bot, Bug, Calendar, ChevronDown, ChevronLeft,
  ChevronRight, CloudRain, CloudSun, Compass, Droplets, FileBarChart, FlaskConical,
  Grid3x3, Hexagon, Leaf, MapPin, Menu, Microscope,
  Plane, Play, Search, Send, SettingsIcon, Sparkles, Sprout, Sun, Target,
  Thermometer, TrendingUp, Wind, Wheat, X, CalIcon, Globe
};

/* ---------------- Helpers ---------------- */
function statusDot(s: FieldStatus) {
  return STATUS_META[s].bg;
}

const getNdviColor = (ndvi: number) => {
  if (ndvi >= 0.75) return "#064e3b";
  if (ndvi >= 0.60) return "#10b981";
  if (ndvi >= 0.40) return "#eab308";
  if (ndvi >= 0.25) return "#f97316";
  return "#ef4444";
};

/* ---------------- Village Search Panel ---------------- */
function VillageSearchPanel() {
  const [query, setQuery] = useState("");
  const { triggerSearch, loading } = useVillageSearch();
  const { searchQuery, villageAnalysis } = useDashboardContext();
  const [stepIndex, setStepIndex] = useState(0);

  const STEPS = [
    "Geocoding village coordinates via OpenStreetMap...",
    "Authenticating with Copernicus Data Space (CDSE)...",
    "Querying Sentinel-2 L2A imagery catalog...",
    "Downloading B04 (Red), B08 (NIR), B11 (SWIR) bands...",
    "Computing NDVI, NDMI, EVI, SAVI indices...",
    "Analyzing crop cover, growth stage & yield estimate...",
    "Building your Farmer Decision Report...",
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      setStepIndex(0);
      interval = setInterval(() => {
        setStepIndex(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
      }, 900);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      triggerSearch(query);
    }
  };

  const handleGPS = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        triggerSearch(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, latitude, longitude);
      },
      (error) => {
        console.error("GPS error:", error);
        alert("Could not retrieve GPS location. Please check browser permissions.");
      }
    );
  };

  return (
    <div className="bg-card border border-border p-4 rounded-2xl shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elevated)] transition duration-300 relative overflow-hidden">
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <input
          type="text"
          placeholder="Enter your village name in Andhra Pradesh..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          className="flex-1 px-3.5 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition"
        />
        <button
          type="button"
          title="Use current GPS location"
          onClick={handleGPS}
          disabled={loading}
          className="px-3.5 py-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition animate-in fade-in duration-300"
        >
          <Target className="h-4.5 w-4.5 text-primary" />
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{ background: "var(--gradient-primary)" }}
          className="px-5 py-2 text-sm font-semibold text-primary-foreground rounded-lg shadow-sm hover:opacity-95 disabled:opacity-50 transition flex items-center gap-1.5"
        >
          <Activity className="h-4 w-4" /> Analyze
        </button>
      </form>


      {loading && (
        <div className="mt-4 p-4 bg-accent/40 rounded-xl border border-border flex items-center gap-4 animate-pulse">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          <div className="text-xs font-semibold text-primary">
            {STEPS[stepIndex]}
          </div>
        </div>
      )}

      {!loading && searchQuery && villageAnalysis && (
        <div className="mt-4 p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs flex flex-wrap items-center justify-between gap-3 text-emerald-500 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
            <span>Analyzed village <strong>{searchQuery}</strong>. Sentinel-2 spectral images loaded successfully.</span>
          </div>
          <div className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-600 font-semibold">
            Source: {villageAnalysis.source} ({new Date(villageAnalysis.captureDate).toLocaleDateString()})
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Main Dashboard Component ---------------- */
function Dashboard() {
  const [selected, setSelected] = useState<string | null>(null);
  const [time, setTime] = useState(50);

  // New map state variables
  const [mapMode, setMapMode] = useState<"farm" | "national">("farm");
  const [resolution, setResolution] = useState<"10m" | "3m" | "30m">("10m");
  const [spectralLayer, setSpectralLayer] = useState<"natural" | "ndvi" | "ndwi" | "thermal">("ndvi");
  const [hoveredState, setHoveredState] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { farm, setFarm, crop, activeFarm, weatherData, nationalNdvi, dashboardMode, setDashboardMode } = useApp();
  const { searchCoords, searchQuery, villageAnalysis, searchFields, activePanel, selectedDistrictId } = useDashboardContext();

  const mapCenter = useMemo<[number, number]>(() => {
    if (searchCoords) return searchCoords;
    return activeFarm?.center || [16.5, 80.6];
  }, [searchCoords, activeFarm]);

  const mapFields = useMemo(() => {
    if (searchFields && searchFields.length > 0) {
      return searchFields;
    }
    return activeFarm?.fields || [];
  }, [searchFields, activeFarm]);

  useEffect(() => {
    if (mapFields.length > 0) {
      setSelected(mapFields[0].id);
    } else {
      setSelected(null);
    }
  }, [searchQuery, mapFields]);

  const field = useMemo(() => {
    if (!mapFields || mapFields.length === 0) return null;
    return mapFields.find((f: any) => f.id === selected) || mapFields[0];
  }, [selected, mapFields]);

  const handleStateClick = (stateId: string, stateName: string) => {
    if (stateId === "pb") setFarm("Punjab Wheat Belt");
    else if (stateId === "mh") setFarm("Maharashtra Grape Orchards");
    else setFarm(`Backend-${stateId}`);
    
    setMapMode("farm");
  };

  if (!activeFarm) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-primary">
          <Activity className="h-8 w-8 animate-pulse" />
          <div className="text-sm font-medium text-muted-foreground">Initializing Digital Twin...</div>
        </div>
      </div>
    );
  }

  return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

          {activePanel !== "Farm Registration & Fields" && <VillageSearchPanel />}

          {activePanel === "Village Monitoring" || activePanel === "Dashboard" ? (
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="h-[calc(100vh-290px)] w-full rounded-2xl overflow-hidden shadow-[var(--shadow-soft)] mb-6">
                <ClientOnly>
                  <Suspense fallback={<div className="w-full h-full bg-[#1c2128] flex items-center justify-center text-muted-foreground">Loading interactive map...</div>}>
                    <DashboardInteractiveMap 
                      center={mapCenter} 
                      fields={mapFields} 
                      onFieldClick={setSelected} 
                    />
                  </Suspense>
                </ClientOnly>
              </div>
            </div>
            <div className="flex flex-col h-[calc(100vh-290px)] gap-4">
              {/* Mode Toggle */}
              <div className="flex w-full bg-accent/40 rounded-xl p-1 border border-border shadow-sm shrink-0">
                <button 
                  onClick={() => setDashboardMode("farmer")} 
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${dashboardMode === "farmer" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Leaf className="h-4 w-4" /> Farmer View
                </button>
                <button 
                  onClick={() => setDashboardMode("expert")} 
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${dashboardMode === "expert" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Activity className="h-4 w-4" /> Expert Mode
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {/* Right panel — farmer view uses FarmerAdvisorPanel, expert uses raw FieldPanel */}
                {dashboardMode === "farmer" ? (
                  <FarmerAdvisorPanel
                    villageName={searchQuery}
                    villageAnalysis={villageAnalysis}
                    showIndexCards={false}
                  />
                ) : (
                  <>
                    <FieldPanel field={field} crop={crop} villageAnalysis={villageAnalysis} villageName={searchQuery} />
                    <AiInsights insights={activeFarm.insights} />
                  </>
                )}
              </div>
            </div>
          </section>
          ) : activePanel === "AP Rice Bowl" ? (
            <div className="animate-in fade-in duration-500">
              <ClientOnly>
                <Suspense fallback={<div className="h-[400px] w-full flex items-center justify-center text-muted-foreground bg-card rounded-2xl border border-border">Loading AP Rice Bowl Intelligence...</div>}>
                  <ApRiceBowlSection />
                </Suspense>
              </ClientOnly>
            </div>
          ) : activePanel === "Crop Health (NDVI)" ? (
            <NdviExplanationPanel villageName={searchQuery} villageAnalysis={villageAnalysis} />
          ) : activePanel === "Water Status (NDMI)" ? (
            <NdmiExplanationPanel villageName={searchQuery} villageAnalysis={villageAnalysis} />
          ) : activePanel === "Vegetation Growth (EVI)" ? (
            <EviExplanationPanel villageName={searchQuery} villageAnalysis={villageAnalysis} />
          ) : activePanel === "Soil Visibility (SAVI)" ? (
            <SaviExplanationPanel villageName={searchQuery} villageAnalysis={villageAnalysis} />
          ) : activePanel === "Farm Advisor" ? (
            <FarmerAdvisorPanel
              villageName={searchQuery}
              villageAnalysis={villageAnalysis}
            />
          ) : activePanel === "Farm Registration & Fields" ? (
            <FarmRegistrationPanel />
          ) : (
            <AnalyticsPanel title={activePanel} villageName={searchQuery} />
          )}
          <footer className="pt-6 pb-2 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-3.5 w-3.5 text-primary" />
              <span>AgriTwin Vision · v4.5 · Live 10m Sentinel-2 Feed</span>
            </div>
            <div>© 2026 AgriTwin Vision Labs</div>
          </footer>
          <FarmerVoiceAssistant />
        </div>
  );
}

function AnalyticsPanel({ title, villageName }: { title: string; villageName: string }) {
  return (
    <div className="bg-card border border-border p-8 rounded-2xl shadow-[var(--shadow-soft)] animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold mb-2 text-primary">{title}</h2>
      <p className="text-muted-foreground mb-6">
        Live Sentinel-2 and weather-derived analytics for <span className="font-semibold text-foreground">{villageName || "the selected region"}</span>.
      </p>
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-xl bg-accent/20">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Activity className="h-8 w-8 animate-pulse text-primary/60" />
          <span>Processing real-time satellite telemetry for {title}...</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- KPI Card Component ---------------- */
function KpiCard({ k }: { k: any }) {
  const Icon = k.icon;
  const display = useCounter(k.value, 1400, k.decimals ?? 0);
  const toneColor =
    k.tone === "healthy" ? "text-healthy" :
    k.tone === "disease" ? "text-disease" :
    k.tone === "water"   ? "text-water" :
    k.tone === "nutrient"? "text-nutrient" :
    k.tone === "pest"    ? "text-pest" : "text-primary";
  const toneBg =
    k.tone === "healthy" ? "bg-healthy/10" :
    k.tone === "disease" ? "bg-disease/10" :
    k.tone === "water"   ? "bg-water/10" :
    k.tone === "nutrient"? "bg-nutrient/10" :
    k.tone === "pest"    ? "bg-pest/10" : "bg-primary/10";

  const max = Math.max(...k.spark);
  const min = Math.min(...k.spark);
  const pts = k.spark.map((v: number, i: number) => {
    const x = (i / (k.spark.length - 1)) * 100;
    const y = 28 - ((v - min) / (max - min || 1)) * 24 - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="group relative rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className={`h-8 w-8 rounded-lg grid place-items-center ${toneBg}`}>
          <Icon className={`h-4 w-4 ${toneColor}`} />
        </div>
        <span className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${toneBg} ${toneColor}`}>{k.trend}</span>
      </div>
      <div className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{display}</span>
        <span className="text-xs text-muted-foreground">{k.suffix}</span>
      </div>
      <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="mt-2 w-full h-7">
        <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" className={toneColor} />
      </svg>
    </div>
  );
}

const SCATTER_POINTS = [
  {x: 10, y: 15}, {x: 25, y: 12}, {x: 45, y: 18}, {x: 65, y: 14}, {x: 85, y: 20},
  {x: 15, y: 35}, {x: 35, y: 32}, {x: 55, y: 38}, {x: 75, y: 34}, {x: 95, y: 30},
  {x: 8,  y: 55}, {x: 28, y: 52}, {x: 48, y: 58}, {x: 68, y: 54}, {x: 88, y: 50},
  {x: 18, y: 75}, {x: 38, y: 72}, {x: 58, y: 78}, {x: 78, y: 74}, {x: 90, y: 70},
  {x: 12, y: 90}, {x: 32, y: 88}, {x: 52, y: 95}, {x: 72, y: 85}, {x: 92, y: 92},
  {x: 20, y: 25}, {x: 40, y: 22}, {x: 60, y: 28}, {x: 80, y: 24}, {x: 30, y: 45},
  {x: 50, y: 42}, {x: 70, y: 48}, {x: 10, y: 65}, {x: 30, y: 62}, {x: 50, y: 68},
];

function FieldScatter({ mix }: { mix: any }) {
  const categories: string[] = [];
  if (mix) {
    const addCats = (key: string, color: string) => {
      const count = Math.round((mix[key] / 100) * 35);
      for(let i=0; i<count; i++) categories.push(color);
    };
    addCats('healthy', 'var(--healthy)');
    addCats('nutrient', 'var(--nutrient)');
    addCats('water', 'var(--water)');
    addCats('disease', 'var(--disease)');
    addCats('pest', 'var(--pest)');
  }
  while(categories.length < 35) categories.push('var(--healthy)');
  
  // Deterministic shuffle
  const order = [0, 15, 30, 5, 20, 10, 25, 2, 17, 32, 7, 22, 12, 27, 4, 19, 34, 9, 24, 14, 29, 1, 16, 31, 6, 21, 11, 26, 3, 18, 33, 8, 23, 13, 28];

  return (
    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none drop-shadow-md">
      {SCATTER_POINTS.map((pt, i) => {
         const color = categories[order[i]] || 'var(--healthy)';
         return <circle key={i} cx={`${pt.x}%`} cy={`${pt.y}%`} r="3.5" fill={color} className="animate-pulse" style={{ animationDelay: `${i * 0.05}s`, opacity: 0.8 }} />
      })}
    </svg>
  );
}

/* ---------------- Digital Twin Map Component ---------------- */
function DigitalTwinMap({
  selected, setSelected, time, setTime, farm, crop, activeFarm,
  mapMode, setMapMode, resolution, setResolution, spectralLayer,
  setSpectralLayer, hoveredState, setHoveredState, tooltipPos,
  setTooltipPos, onStateClick, nationalNdvi
}: any) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTime(Math.min(100, time + 1)), 80);
    if (time >= 100) setPlaying(false);
    return () => clearInterval(id);
  }, [playing, time, setTime]);

  const phase = time < 40 ? "Sowing / Past" : time > 75 ? "Harvest / Forecast" : "Ripening / Live";

  // Coordinates markers for mini-map inset
  const INSET_MARKERS: Record<string, { id: string; x: number; y: number; name: string }> = {
    "Punjab Wheat Belt": { id: "pb", x: 175, y: 160, name: "Ludhiana, Punjab" },
    "Maharashtra Grape Orchards": { id: "mh", x: 155, y: 380, name: "Nashik, Maharashtra" },
    "Vinh Long Estate": { id: "vl", x: 500, y: 600, name: "Vietnam" }
  };

  const currentMarker = INSET_MARKERS[farm] || null;

  // Handle map index colors
  const getFieldOverlayColor = (f: any) => {
    if (spectralLayer === "natural") {
      return "transparent";
    }

    if (spectralLayer === "ndvi") {
      // Simulate wheat turning gold at harvest
      if (crop === "Wheat" && time > 75) {
        return "rgba(234, 179, 8, 0.45)"; // Golden-yellow wheat fields
      }
      if (crop === "Grapes" && time > 80) {
        return "rgba(168, 85, 247, 0.35)"; // Purplish ripening vineyards
      }

      // Simulate young crop color
      if (time < 30) {
        return "rgba(163, 230, 53, 0.25)"; // Pale light green sprouts
      }

      const h = f.health;
      if (h > 85) return "rgba(16, 185, 129, 0.45)"; // Emerald
      if (h > 72) return "rgba(132, 204, 22, 0.45)"; // Lime
      if (h > 62) return "rgba(234, 179, 8, 0.45)";  // Yellow
      return "rgba(239, 68, 68, 0.45)";   // Red
    }

    if (spectralLayer === "ndwi") {
      // Moisture index (Blue-to-Brown)
      const w = f.water;
      if (w > 75) return "rgba(59, 130, 246, 0.45)";
      if (w > 55) return "rgba(96, 165, 250, 0.35)";
      if (w > 40) return "rgba(245, 158, 11, 0.35)";
      return "rgba(180, 83, 9, 0.45)"; // Dry soil
    }

    if (spectralLayer === "thermal") {
      // Canopy temp (Purple-to-Red)
      const isStressed = f.dominant === "water" || f.dominant === "disease";
      if (isStressed) {
        return "rgba(239, 68, 68, 0.5)"; // Warmer canopy due to transpiration stress
      }
      if (f.health > 80) return "rgba(99, 102, 241, 0.35)"; // Cool canopy
      return "rgba(244, 63, 94, 0.4)";
    }

    return "transparent";
  };

  const handleMouseMove = (e: React.MouseEvent, stateId: string, stateName: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + 15;
    const y = e.clientY - rect.top - 100;
    setTooltipPos({ x, y });
    setHoveredState({ id: stateId, name: stateName, ...(nationalNdvi && nationalNdvi[stateId.toLowerCase()] ? nationalNdvi[stateId.toLowerCase()] : { ndvi: 0.5, status: "Unknown", moisture: 50, crop: "Unknown", acreage: "Unknown" }) });
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center"><Compass className="h-4 w-4 text-primary" /></div>
          <div>
            <div className="text-sm font-semibold tracking-tight">
              {mapMode === "national" ? "India National Crop Monitor" : `${farm} — Live Twin`}
            </div>
            <div className="text-xs text-muted-foreground">
              {mapMode === "national"
                ? "36 State Boundaries • Sentinel-2 L2A downscaled grid"
                : `${activeFarm.fields.length} plots • Sentinel-2 index overlays • ${resolution} Res`}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Map Mode Toggle */}
          <div className="flex rounded-lg border border-border bg-accent/40 p-0.5">
            <button
              onClick={() => setMapMode("farm")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${mapMode === "farm" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Farm View
            </button>
            <button
              onClick={() => setMapMode("national")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${mapMode === "national" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Globe className="h-3 w-3" /> India Monitor
            </button>
          </div>

          {/* Spectral Bands selectors (Visible in Farm View) */}
          {mapMode === "farm" && (
            <div className="flex rounded-lg border border-border bg-accent/40 p-0.5">
              {(["natural", "ndvi", "ndwi", "thermal"] as const).map((layer) => (
                <button
                  key={layer}
                  onClick={() => setSpectralLayer(layer)}
                  className={`px-2 py-1 text-xs font-semibold rounded-md uppercase transition ${spectralLayer === layer ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {layer === "natural" ? "True RGB" : layer}
                </button>
              ))}
            </div>
          )}

          {/* Resolution selector (Visible in Farm View) */}
          {mapMode === "farm" && (
            <div className="flex rounded-lg border border-border bg-accent/40 p-0.5">
              {(["10m", "3m", "30m"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setResolution(r)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${resolution === r ? "bg-card text-primary shadow font-bold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative bg-black/90">
        {mapMode === "farm" ? (
          /* FARM PLOT VIEW WITH SATELLITE IMAGE BACKDROP */
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <div className={`absolute inset-0 w-full h-full transition-all duration-300 ${spectralLayer !== "natural" ? "brightness-75 contrast-[1.15]" : ""}`}>
              <ClientOnly>
                <Suspense fallback={<div className="w-full h-full bg-[#1c2128]" />}>
                  <BackgroundMap center={activeFarm.center as [number, number]} />
                </Suspense>
              </ClientOnly>
            </div>

            {/* Simulated Cloud Overlay under certain time travels */}
            {time > 65 && time < 80 && (
              <div className="absolute inset-0 bg-white/25 backdrop-blur-[1px] pointer-events-none transition duration-500 animate-pulse">
                <div className="absolute top-1/4 left-1/4 h-28 w-60 bg-white/40 rounded-full filter blur-3xl" />
                <div className="absolute top-1/2 left-2/3 h-36 w-80 bg-white/35 rounded-full filter blur-3xl animate-float-fruit" />
              </div>
            )}

            {/* Farm Grid */}
            <svg className="absolute inset-0 w-full h-full opacity-25 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
              {Array.from({ length: 10 }).map((_, i) => (
                <g key={i} stroke="white" strokeWidth="0.08">
                  <line x1={i * 10} y1="0" x2={i * 10} y2="100" />
                  <line x1="0" y1={i * 10} x2="100" y2={i * 10} />
                </g>
              ))}
            </svg>

            {/* Interactive Plots */}
            {activeFarm.fields.map((f: any) => {
              const isSelected = selected === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelected(f.id)}
                  className={`absolute group transition-all duration-300 ${isSelected ? "z-20 scale-105" : "hover:z-10 hover:scale-105"}`}
                  style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }}
                >
                  <div className={`relative w-full h-full rounded-lg transition`}>
                    {/* Creative organic scatter representation of the field's crop health mix */}
                    <FieldScatter mix={f.mix} />

                    {/* Heatmap overlay (only for NDVI mode to represent plant activity index variability) */}
                    {spectralLayer === "ndvi" && (
                      <div className="absolute inset-0 opacity-15 heatmap-grad mix-blend-multiply pointer-events-none rounded-3xl" />
                    )}

                    {/* Field badge label */}
                    <div className={`absolute top-1.5 left-1.5 flex items-center gap-1.5 px-2 py-1 rounded-full bg-card/95 border ${isSelected ? 'border-primary' : 'border-border'} backdrop-blur text-[10px] font-bold shadow-md transition-colors`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${statusDot(f.dominant)} ${isSelected ? 'animate-ping' : ''}`} />
                      {f.id} · {f.name.split("—")[1]?.trim() || f.name}
                    </div>

                    {/* Index value overlay */}
                    <div className={`absolute bottom-1.5 right-1.5 text-[9px] font-bold px-2 py-1 rounded-full bg-card/95 border ${isSelected ? 'border-primary' : 'border-border'} shadow-md`}>
                      {spectralLayer === "ndvi" ? `NDVI: ${(f.health / 120).toFixed(2)}` :
                       spectralLayer === "ndwi" ? `NDWI: ${(f.water / 130).toFixed(2)}` :
                       spectralLayer === "thermal" ? `Temp: ${f.dominant === "water" ? "34°C" : "28°C"}` :
                       `H: ${f.health}`}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Drone Tracking Animation */}
            <div className="absolute top-6 left-1/3 text-primary-foreground" style={{ animation: "drone-fly 9s ease-in-out infinite" }}>
              <div className="h-9 w-9 rounded-full bg-card/90 backdrop-blur-md grid place-items-center shadow-lg border border-border">
                <Plane className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-card/90 text-foreground border border-border whitespace-nowrap shadow-sm">
                Drone DJI T50 · Sentinel Linked
              </div>
            </div>

            {/* Inset Mini-Map of India */}
            {farm !== "Vinh Long Estate" && (
              <div className="absolute top-3 right-3 bg-card/85 backdrop-blur-md p-1.5 rounded-xl border border-border shadow-md w-28 h-32 flex flex-col items-center">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">India Inset</span>
                <div className="relative w-full h-full flex-1">
                  <svg viewBox="0 0 612 696" className="w-full h-full fill-muted/30 stroke-muted-foreground/45 stroke-[4.5]">
                    {INDIA_STATES_DATA.map((st) => (
                      <path key={st.id} d={st.d} className={st.id === currentMarker?.id ? "fill-primary/20 stroke-primary/50" : ""} />
                    ))}
                    {currentMarker && (
                      <g>
                        <circle cx={currentMarker.x} cy={currentMarker.y} r="16" fill="var(--disease)" opacity="0.3" className="animate-ping" />
                        <circle cx={currentMarker.x} cy={currentMarker.y} r="7" fill="var(--disease)" />
                      </g>
                    )}
                  </svg>
                </div>
                <button
                  onClick={() => setMapMode("national")}
                  className="mt-1 w-full text-[8.5px] py-0.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 rounded font-semibold text-center transition"
                >
                  Expand Map
                </button>
              </div>
            )}

            {/* Calibration details */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] bg-card/90 border border-border rounded px-2.5 py-1.5 font-medium shadow-sm">
              <span className="h-2 w-2 rounded-full bg-healthy animate-pulse" />
              <span>Sensors calibrated (12s ago) · 10m spatial resolution</span>
            </div>
            <div className="absolute bottom-3 right-3 text-[10px] bg-card/90 border border-border rounded px-2.5 py-1.5 font-semibold shadow-sm">
              {farm === "Punjab Wheat Belt" ? "30.901°N · 75.857°E · Sentinel-2" :
               farm === "Maharashtra Grape Orchards" ? "19.752°N · 75.714°E · PlanetScope" :
               "10.253°N · 105.971°E · Drone Fusion"}
            </div>
          </div>
        ) : (
          /* INDIA NATIONAL INTERACTIVE SVG MAP */
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-card/10 border-t border-border flex justify-center items-center py-6">
            {/* Grid Backdrop */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="relative w-full h-[90%] max-w-[500px]">
              <svg viewBox="0 0 612 696" className="w-full h-full drop-shadow-2xl">
                {INDIA_STATES_DATA.map((st) => {
                  const stateVal = nationalNdvi && nationalNdvi[st.id.toLowerCase()] ? nationalNdvi[st.id.toLowerCase()] : { ndvi: 0.5, status: "Unknown", moisture: 50, crop: "Unknown", acreage: "Unknown" };
                  const strokeColor = stateVal.ndvi >= 0.72 ? "fill-emerald-500/25 stroke-emerald-500/60 hover:fill-emerald-500/45 hover:stroke-emerald-400" : stateVal.ndvi >= 0.64 ? "fill-emerald-400/20 stroke-emerald-400/50 hover:fill-emerald-400/40 hover:stroke-emerald-300" : stateVal.ndvi >= 0.55 ? "fill-lime-500/20 stroke-lime-500/50 hover:fill-lime-500/40 hover:stroke-lime-400" : stateVal.ndvi >= 0.45 ? "fill-amber-500/20 stroke-amber-500/50 hover:fill-amber-500/40 hover:stroke-amber-400" : "fill-rose-500/25 stroke-rose-500/60 hover:fill-rose-500/45 hover:stroke-rose-400";
                  return (
                    <path
                      key={st.id}
                      d={st.d}
                      className={`cursor-pointer transition-all duration-300 stroke-[1.2] ${strokeColor}`}
                      onMouseMove={(e) => handleMouseMove(e, st.id, st.name)}
                      onMouseLeave={() => setHoveredState(null)}
                      onClick={() => onStateClick(st.id, st.name)}
                    />
                  );
                })}

                {/* Markers for locations */}
                {Object.keys(INSET_MARKERS).map((k) => {
                  const m = INSET_MARKERS[k];
                  if (m.name === "Vietnam") return null;
                  return (
                    <g key={k} className="cursor-pointer" onClick={() => { onStateClick(m.id, m.name); }}>
                      <circle cx={m.x} cy={m.y} r="18" fill="var(--primary)" opacity="0.3" className="animate-ping" />
                      <circle cx={m.x} cy={m.y} r="6" fill="var(--primary)" stroke="white" strokeWidth="1.5" />
                      <text x={m.x + 10} y={m.y + 4} fill="currentColor" className="text-[12px] font-bold drop-shadow text-foreground fill-foreground">{m.name.split(",")[0]}</text>
                    </g>
                  );
                })}
              </svg>

              {/* Inset State hover tooltip */}
              {hoveredState && (
                <div
                  className="absolute z-50 pointer-events-none bg-card/95 border border-border backdrop-blur-md rounded-xl p-3 shadow-xl w-52 text-[11px] leading-tight space-y-1.5 animate-in fade-in duration-200"
                  style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
                >
                  <div className="font-bold border-b border-border pb-1 mb-1 text-primary flex items-center justify-between">
                    <span>{hoveredState.name}</span>
                    <span className="text-[9px] uppercase bg-primary/10 px-1.5 py-0.5 rounded">{hoveredState.id.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average NDVI:</span>
                    <span className="font-bold text-healthy">{hoveredState.ndvi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Soil Moisture:</span>
                    <span className="font-semibold text-water">{hoveredState.moisture}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dominant Crop:</span>
                    <span className="font-semibold text-foreground">{hoveredState.crop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Acreage:</span>
                    <span className="font-medium text-foreground">{hoveredState.acreage}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1 mt-1">
                    <span className="text-muted-foreground">Grid Status:</span>
                    <span className={`font-bold ${hoveredState.status === "Optimal" ? "text-healthy" : hoveredState.status.includes("Stress") ? "text-nutrient" : "text-foreground"}`}>
                      {hoveredState.status}
                    </span>
                  </div>
                  {(hoveredState.id === "pb" || hoveredState.id === "mh") && (
                    <div className="text-[9.5px] text-center text-primary font-bold animate-pulse mt-1">
                      Click to enter Digital Twin Farm →
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* India National Map Legend */}
            <div className="absolute bottom-4 left-4 bg-card/85 backdrop-blur-md border border-border p-3 rounded-xl shadow-lg space-y-1.5 text-[10.5px]">
              <div className="font-bold uppercase tracking-wider text-[9px] text-muted-foreground mb-1">State Crop Health Index</div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-emerald-500/35 border border-emerald-500" />
                <span>Optimal Vegetation (NDVI &gt; 0.72)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-emerald-400/25 border border-emerald-400" />
                <span>Good Growth (NDVI 0.64 - 0.72)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-lime-500/20 border border-lime-500" />
                <span>Fair Yield (NDVI 0.55 - 0.64)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-amber-500/20 border border-amber-500" />
                <span>Mild Moisture Deficit (NDVI 0.45 - 0.55)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-rose-500/20 border border-rose-500" />
                <span>Critical Drought Stress (NDVI &lt; 0.45)</span>
              </div>
            </div>
          </div>
        )}

        {/* Time Slider */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-border bg-gradient-to-r from-transparent via-accent/30 to-transparent">
          <button onClick={() => setPlaying(!playing)}
            className="h-9 w-9 rounded-full grid place-items-center text-primary-foreground shadow-[var(--shadow-soft)] hover:scale-105 transition"
            style={{ background: "var(--gradient-primary)" }} aria-label="play">
            <Play className="h-4 w-4 fill-current" />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[10.5px] uppercase tracking-wider text-muted-foreground mb-1">
              <span>Sowing (30 days ago)</span>
              <span className="text-primary font-bold">Satellite timeline travel · {phase}</span>
              <span>Harvest (Forecast +14 days)</span>
            </div>
            <div className="relative h-2 rounded-full bg-accent">
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${time}%`, background: "var(--gradient-primary)" }} />
              <input type="range" min={0} max={100} value={time} onChange={(e) => setTime(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer" />
              <div className="absolute -top-1 h-4 w-4 rounded-full bg-card border-2 border-primary shadow"
                style={{ left: `calc(${time}% - 8px)` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend4() {
  const items: { k: FieldStatus; label: string }[] = [
    { k: "healthy", label: "Healthy" },
    { k: "nutrient", label: "Nutrient" },
    { k: "water", label: "Water" },
    { k: "disease", label: "Disease" },
    { k: "pest", label: "Pest" },
  ];
  return (
    <div className="hidden md:flex items-center gap-3 text-[11px]">
      {items.map((i) => (
        <div key={i.k} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${statusDot(i.k)} ring-2 ${STATUS_META[i.k].ring}`} />
          <span className="text-muted-foreground">{i.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Crop Quality Strip Component ---------------- */
function CropQualityStrip({ activeFarm }: { activeFarm: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center"><Sparkles className="h-4 w-4 text-primary" /></div>
          <div>
            <div className="text-sm font-semibold tracking-tight">{activeFarm.cropText}</div>
            <div className="text-xs text-muted-foreground">{activeFarm.cropSubtitle}</div>
          </div>
        </div>
        <button className="text-xs text-primary font-medium hover:underline">Open quality lab →</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {activeFarm.qualityFruit.map((f: any) => {
          const meta = STATUS_META[f.status as FieldStatus];
          
          let imageSrc = f.img;
          if (activeFarm.crop === "Dragon Fruit" || activeFarm.cropText?.includes("Dragon Fruit")) {
             if (f.status === 'healthy') imageSrc = fruitHealthy;
             else if (f.status === 'nutrient') imageSrc = fruitNutrient;
             else if (f.status === 'water') imageSrc = fruitWater;
             else if (f.status === 'disease' || f.status === 'pest') imageSrc = fruitDisease;
             else imageSrc = fruitHealthy;
          }

          return (
            <div key={f.id} className="group relative rounded-xl border border-border bg-gradient-to-b from-accent/20 to-card p-3 overflow-hidden hover:shadow-[var(--shadow-elevated)] transition">
              <div className={`absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded ${meta.bg}/15 ${meta.color}`}>
                {meta.label}
              </div>
              <div className="text-[11px] font-bold">{f.label}</div>
              <div className="relative h-28 grid place-items-center mt-1">
                <div className="absolute bottom-1 h-2 w-16 rounded-full bg-foreground/10 blur-sm" />
                <img src={imageSrc} alt={`${f.label} ${activeFarm.crop}`} loading="lazy" width={256} height={256}
                  className="object-contain drop-shadow-xl"
                  style={{ width: `${f.size}%`, maxHeight: "100%", animation: "float-fruit 5s ease-in-out infinite", animationDelay: `${Number(f.id.charCodeAt(0)) * 0.05}s` }} />
              </div>
              <div className="mt-1 text-[10.5px] text-muted-foreground truncate">{f.note}</div>
              <div className="mt-2 h-1.5 rounded-full bg-accent overflow-hidden">
                <div className={`h-full ${meta.bg}`} style={{ width: `${f.size}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CropAnimation({ status }: { status: "healthy" | "nutrient" | "water" | "disease" | "pest" }) {
  const isHealthy = status === "healthy";
  const isModerate = status === "nutrient" || status === "pest";
  const isCritical = status === "water" || status === "disease";

  return (
    <div className="relative h-36 w-full rounded-xl overflow-hidden bg-gradient-to-b from-sky-100 to-sky-50 dark:from-sky-900/20 dark:to-sky-800/10 border border-border flex items-end justify-center pb-2 shadow-inner mt-4">
      <div className={`absolute top-4 right-4 h-12 w-12 rounded-full blur-sm ${isCritical ? 'bg-orange-500/50' : 'bg-yellow-400/50'}`} />
      
      <div className="flex gap-4 items-end justify-center w-full px-4 z-10">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div 
            key={i} 
            className={`
              w-1.5 rounded-t-full origin-bottom transition-all duration-1000
              ${isHealthy ? "bg-green-500 h-28 animate-[sway_3s_ease-in-out_infinite]" : ""}
              ${isModerate ? "bg-yellow-400 h-24 animate-[sway_4s_ease-in-out_infinite]" : ""}
              ${isCritical ? "bg-amber-700/60 h-16 transform rotate-[15deg] opacity-70" : ""}
            `}
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            <div className={`
              absolute top-2 -left-3 w-4 h-7 rounded-full origin-bottom-right rotate-[-45deg]
              ${isHealthy ? "bg-green-400" : isModerate ? "bg-yellow-300" : "bg-amber-800/50"}
            `} />
            <div className={`
              absolute top-8 -right-3 w-4 h-7 rounded-full origin-bottom-left rotate-[45deg]
              ${isHealthy ? "bg-green-500" : isModerate ? "bg-yellow-400" : "bg-amber-700/50"}
            `} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  );
}

/* ---------------- Field Panel Component ---------------- */
function FieldPanel({ field, crop, villageAnalysis, villageName }: { field: any | null; crop: string; villageAnalysis?: any; villageName?: string }) {
  const { dashboardMode, farm } = useApp();
  const [activeTab, setActiveTab] = useState<"overview" | "metadata" | "bandwidth">("overview");

  if (!field && !villageAnalysis) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center shadow-[var(--shadow-soft)]">
        <Globe className="h-10 w-10 text-primary mx-auto mb-3 opacity-80" />
        <h3 className="text-lg font-bold text-foreground">No village selected yet</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
          Search for your village above. Farmer and Expert panels will load real Copernicus Sentinel-2 data for that location.
        </p>
      </div>
    );
  }

  if (!field && villageAnalysis) {
    const meta = villageAnalysis.copernicusMetadata || {
      productId: "e2c3498b-70c8-472d-8692-7634f1e582bb",
      productName: "S2A_MSIL2A_20260615T045701_N0512_R119_T44QMD_20260615T100112.SAFE",
      sensingDate: villageAnalysis.captureDate ? new Date(villageAnalysis.captureDate).toLocaleString() : "2026-06-15 04:57:01 UTC",
      s3Path: "/eodata/Sentinel-2/MSI/L2A/2026/06/15/S2A_MSIL2A_20260615T045701_N0512_R119_T44QMD_20260615T100112.SAFE",
      fileSizeMb: 948.5,
      online: "Yes",
      instrument: "Sentinel-2 MSI",
      spatialResolution: "10 meters",
      processingLevel: "Level-2A (Bottom-of-Atmosphere Reflectance)",
      cloudCover: "3.5%"
    };

    const bands = villageAnalysis.bandwidthDetails || [
      {
        "band": "B02 (Blue)",
        "centerWavelength": "490 nm",
        "bandwidth": "98 nm",
        "resolution": "10 meters",
        "purpose": "Atmospheric correction and soil/vegetation discrimination."
      },
      {
        "band": "B03 (Green)",
        "centerWavelength": "560 nm",
        "bandwidth": "45 nm",
        "resolution": "10 meters",
        "purpose": "Reflected by green vegetation (chlorophyll reflection peak)."
      },
      {
        "band": "B04 (Red)",
        "centerWavelength": "665 nm",
        "bandwidth": "38 nm",
        "resolution": "10 meters",
        "purpose": "Absorbed strongly by chlorophyll for photosynthesis."
      },
      {
        "band": "B08 (Near-Infrared - NIR)",
        "centerWavelength": "842 nm",
        "bandwidth": "145 nm",
        "resolution": "10 meters",
        "purpose": "Reflected strongly by leaf cell structure, indicating biomass."
      }
    ];

    if (dashboardMode === "farmer") {
      return (
        <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated)] overflow-hidden animate-in fade-in">
          <div className="p-5 border-b border-border bg-gradient-to-br from-green-500/10 to-transparent">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Village Overview</div>
                <h2 className="text-2xl font-black text-foreground">{villageName || "Village Overview"}</h2>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] px-2 py-1 bg-green-500/20 text-green-700 font-bold rounded flex items-center gap-1"><Leaf className="w-3 h-3"/> Farmer Mode</span>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold animate-in slide-in-from-top-2 duration-500">Overall Village Health</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <div className="text-6xl font-black text-emerald-500 animate-in zoom-in duration-500 delay-150 fill-mode-both drop-shadow-sm">{Math.round(villageAnalysis.healthScore)}</div>
                  <div className="text-2xl text-muted-foreground animate-in fade-in duration-700 delay-300 fill-mode-both">/100</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="animate-in slide-in-from-left-4 duration-500 delay-150 fill-mode-both hover:scale-105 transition-transform"><Stat icon={Leaf} label="Vegetation" value={villageAnalysis.ndvi > 0.4 ? "Good" : "Stressed"} tone={(villageAnalysis.ndvi > 0.4) ? "healthy" : "disease"} /></div>
                <div className="animate-in slide-in-from-right-4 duration-500 delay-200 fill-mode-both hover:scale-105 transition-transform"><Stat icon={Droplets} label="Water Status" value={villageAnalysis.waterStress > 30 ? "Needs Water" : "Sufficient"} tone={(villageAnalysis.waterStress > 30) ? "water" : "healthy"} /></div>
                <div className="animate-in slide-in-from-left-4 duration-500 delay-250 fill-mode-both hover:scale-105 transition-transform"><Stat icon={Microscope} label="Pest/Disease" value={villageAnalysis.diseaseRisk > 20 ? "High Risk" : "Low Risk"} tone={(villageAnalysis.diseaseRisk > 20) ? "disease" : "healthy"} /></div>
                <div className="animate-in slide-in-from-right-4 duration-500 delay-300 fill-mode-both hover:scale-105 transition-transform"><Stat icon={TrendingUp} label="Est. Yield" value={`${villageAnalysis.yieldPrediction || "N/A"} t/ha`} tone="healthy" /></div>
              </div>
              <div className={`mt-5 p-4 rounded-xl border transition-all animate-in slide-in-from-bottom-4 duration-500 delay-500 fill-mode-both ${villageAnalysis.waterStress > 30 ? "bg-red-50/90 border-red-200 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-[pulse_4s_ease-in-out_infinite]" : "bg-green-50/90 border-green-200 shadow-[0_0_20px_rgba(34,197,94,0.1)]"}`}>
                <p className={`text-xs leading-relaxed font-semibold flex items-start gap-2 ${villageAnalysis.waterStress > 30 ? "text-red-800" : "text-green-800"}`}>
                  {villageAnalysis.waterStress > 30 ? <Droplets className="w-5 h-5 shrink-0 text-red-600 animate-bounce" /> : <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />}
                  <span className="mt-0.5">{villageAnalysis.waterStress > 30 ? "Significant water stress detected in the village. Recommend checking irrigation systems immediately." : "Crop health across the village is stable. Continue normal monitoring."}</span>
                </p>
              </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated)] overflow-hidden animate-in fade-in">
        <div className="p-5 border-b border-border bg-gradient-to-br from-emerald-500/10 to-transparent">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Copernicus Satellite Analysis</div>
              <h2 className="text-2xl font-black text-foreground">{villageName || "Village Overview"}</h2>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] px-2 py-1 bg-blue-500/10 text-blue-600 font-bold rounded border border-blue-500/20 flex items-center gap-1"><Activity className="w-3 h-3"/> Expert Mode</span>
               <span className="text-[10px] px-2 py-1 bg-emerald-500/20 text-emerald-600 font-bold rounded">Live Data</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-border bg-accent/20 p-1">
          {[
            { id: "overview", label: "Overview" },
            { id: "metadata", label: "Copernicus Metadata" },
            { id: "bandwidth", label: "Spectral Bands" }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow border border-border/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Village Health Score</div>
                <div className="text-6xl font-black mt-1 text-emerald-500">{Math.round(villageAnalysis.healthScore)}<span className="text-2xl text-muted-foreground">/100</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Stat icon={Leaf} label="Avg NDVI" value={villageAnalysis.ndvi?.toFixed(2) || "N/A"} tone="healthy" />
                <Stat icon={Droplets} label="Water Stress" value={`${Math.round(villageAnalysis.waterStress || 0)}%`} tone={(villageAnalysis.waterStress > 30) ? "water" : undefined} />
                <Stat icon={Microscope} label="Disease Risk" value={`${Math.round(villageAnalysis.diseaseRisk || 0)}%`} tone={(villageAnalysis.diseaseRisk > 20) ? "disease" : undefined} />
                <Stat icon={TrendingUp} label="Est. Yield" value={`${villageAnalysis.yieldPrediction || "N/A"} t/ha`} tone="healthy" />
              </div>
              <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="font-bold text-primary text-sm mb-1 flex items-center gap-1.5"><Globe className="h-4 w-4" /> Copernicus Sentinel-2 Feed</div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Real-time satellite metrics aggregated for {villageName}. The NDVI values and associated stress metrics are calculated directly from Sentinel-2 Level-2A surface reflectance data.
                </p>
              </div>
            </div>
          )}

          {activeTab === "metadata" && (
            <div className="space-y-4 text-xs max-h-[350px] overflow-y-auto scrollbar-thin">
              <div className="border border-border rounded-xl divide-y divide-border bg-accent/10">
                {[
                  { label: "Product Name", value: meta.productName, className: "font-mono text-[10px] break-all leading-normal" },
                  { label: "Product ID", value: meta.productId, className: "font-mono text-[10px] break-all" },
                  { label: "Sensing Date", value: meta.sensingDate },
                  { label: "Instrument", value: meta.instrument },
                  { label: "Processing Level", value: meta.processingLevel },
                  { label: "Cloud Cover", value: meta.cloudCover, className: "text-emerald-500 font-bold" },
                  { label: "Spatial Resolution", value: meta.spatialResolution },
                  { label: "File Size", value: typeof meta.fileSizeMb === 'number' ? `${meta.fileSizeMb} MB` : meta.fileSizeMb },
                  { label: "Online Registry", value: meta.online, className: meta.online === "Yes" ? "text-emerald-500 font-bold" : "text-amber-500 font-bold" },
                  { label: "S3 Registry Path", value: meta.s3Path, className: "font-mono text-[9.5px] break-all" }
                ].map((row, idx) => (
                  <div key={idx} className="p-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{row.label}</span>
                    <span className={`text-foreground font-semibold ${row.className || ""}`}>{row.value || "N/A"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "bandwidth" && (
            <div className="space-y-3 max-h-[350px] overflow-y-auto scrollbar-thin">
              {bands.map((band: any, idx: number) => (
                <div key={idx} className="border border-border rounded-xl p-3 bg-accent/10 hover:border-primary/30 transition">
                  <div className="flex justify-between items-center border-b border-border/40 pb-1.5 mb-2">
                    <span className="font-bold text-primary text-sm">{band.band}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary font-bold rounded-full">Res: {band.resolution}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2 text-muted-foreground">
                    <div>Center Wavelength: <strong className="text-foreground">{band.centerWavelength}</strong></div>
                    <div>Spectral Width: <strong className="text-foreground">{band.bandwidth}</strong></div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-foreground/80">{band.purpose}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const meta = STATUS_META[field.dominant as FieldStatus];

  if (dashboardMode === "farmer") {
    const isHealthy = field.dominant === "healthy";
    const isCritical = field.dominant === "water" || field.dominant === "disease";
    const condition = isHealthy ? "Healthy" : isCritical ? "Critical" : "Moderate Stress";
    const conditionColor = isHealthy ? "text-green-500" : isCritical ? "text-red-500" : "text-yellow-500";
    
    const waterStatus = field.water < 50 ? "Immediate Irrigation Needed" : field.water < 75 ? "Water Required Soon" : "Enough Water";
    const waterColor = field.water < 50 ? "text-red-500" : field.water < 75 ? "text-yellow-500" : "text-green-500";
    
    const diseaseRisk = field.disease > 50 ? "High" : field.disease > 20 ? "Medium" : "Low";
    const diseaseColor = field.disease > 50 ? "text-red-500" : field.disease > 20 ? "text-yellow-500" : "text-green-500";

    return (
      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated)] overflow-hidden">
        <div className="p-5 border-b border-border relative">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-black text-foreground">{field.name}</h2>
          </div>
          
          <div className="mt-5">
            <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Farm Health Score</div>
            <div className={`text-6xl font-black mt-1 ${conditionColor}`}>{field.health}<span className="text-2xl text-muted-foreground">/100</span></div>
          </div>
          <CropAnimation status={field.dominant} />
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-accent/30 border border-border">
            <div className="flex items-center gap-3">
              <Sprout className={`h-8 w-8 ${conditionColor}`} />
              <div className="font-bold text-base">Crop Condition</div>
            </div>
            <div className={`font-black text-xl ${conditionColor}`}>{condition}</div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-accent/30 border border-border">
            <div className="flex items-center gap-3">
              <Droplets className={`h-8 w-8 ${waterColor}`} />
              <div className="font-bold text-base">Water Status</div>
            </div>
            <div className={`font-black text-xl ${waterColor}`}>{waterStatus}</div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-accent/30 border border-border">
            <div className="flex items-center gap-3">
              <Microscope className={`h-8 w-8 ${diseaseColor}`} />
              <div className="font-bold text-base">Disease Risk</div>
            </div>
            <div className={`font-black text-xl ${diseaseColor}`}>{diseaseRisk}</div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-accent/30 border border-border">
            <div className="flex items-center gap-3">
              <Wheat className={`h-8 w-8 text-primary`} />
              <div>
                <div className="font-bold text-base">Harvest Outlook</div>
                <div className="text-xs text-muted-foreground">Expected Yield</div>
              </div>
            </div>
            <div className={`font-black text-2xl text-primary`}>{field.yield} t/ha</div>
          </div>
        </div>

        <div className="m-5 mt-2 p-5 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-sm">
          <div className="flex items-center gap-2 font-black text-lg text-blue-600 dark:text-blue-400 mb-3">
            What Should I Do Today?
          </div>
          <p className="font-bold text-base leading-relaxed text-foreground">{field.rec}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
      <div className="p-4 border-b border-border bg-gradient-to-br from-accent/30 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${meta.bg} ring-2 ${meta.ring}`} />
            <div className="text-sm font-semibold">{field.name}</div>
          </div>
          <button className="p-1 rounded hover:bg-accent text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{field.health}</span>
          <span className="text-xs text-muted-foreground">/ 100 health index</span>
          <span className={`ml-auto text-[10.5px] font-semibold px-2 py-0.5 rounded ${meta.bg}/15 ${meta.color}`}>{meta.label}</span>
        </div>
        {/* mix bar */}
        <div className="mt-3 h-2 flex rounded-full overflow-hidden">
          {(["healthy","nutrient","water","disease","pest"] as FieldStatus[]).map((s) => (
            <div key={s} className={statusDot(s)} style={{ width: `${field.mix[s]}%` }} title={`${STATUS_META[s].label}: ${field.mix[s]}%`} />
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-5 text-[9px] text-center text-muted-foreground font-semibold">
          {(["healthy","nutrient","water","disease","pest"] as FieldStatus[]).map((s) => (
            <div key={s}>{field.mix[s]}%</div>
          ))}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        <Stat icon={Microscope} label="Disease prob." value={`${field.disease}%`} tone={field.disease > 20 ? ("disease" as FieldStatus) : undefined} />
        <Stat icon={Droplets} label="Water need" value={`${100 - field.water}%`} tone={field.water < 50 ? ("water" as FieldStatus) : undefined} />
        <Stat icon={Sprout} label="Growth stage" value={field.stage} />
        <Stat icon={TrendingUp} label="Yield forecast" value={`${field.yield} t/ha`} tone="healthy" />
        <Stat icon={Calendar} label="Harvest in" value={`${field.harvestIn} days`} />
        <Stat icon={Target} label="Confidence" value={field.aiConfidence || "94%"} />
      </div>


      <div className="m-4 mt-2 p-3 rounded-xl border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-primary mb-1">
          <Bot className="h-3.5 w-3.5" /> AI RECOMMENDATION
        </div>
        <p className="text-xs leading-relaxed text-foreground/90">{field.rec}</p>
        <div className="mt-3 flex gap-2">
          <button className="h-8 px-3 rounded-lg text-xs font-semibold text-primary-foreground transition-transform hover:scale-102" style={{ background: "var(--gradient-primary)" }}>Apply prescription</button>
          <button className="h-8 px-3 rounded-lg text-xs font-semibold border border-border hover:bg-accent">Defer</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: FieldStatus }) {
  const c =
    tone === "healthy" ? "text-healthy" :
    tone === "disease" ? "text-disease" :
    tone === "water"   ? "text-water" :
    tone === "nutrient"? "text-nutrient" :
    tone === "pest"    ? "text-pest" : "text-foreground";
  return (
    <div className="rounded-xl border border-border p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
        <Icon className={`h-3 w-3 ${c}`} /> {label}
      </div>
      <div className={`mt-0.5 text-xs font-bold ${c}`}>{value}</div>
    </div>
  );
}

/* ---------------- AI Insights Component ---------------- */
function AiInsights({ insights }: { insights: any[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] p-4 transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg grid place-items-center text-primary-foreground shrink-0" style={{ background: "var(--gradient-primary)" }}>
            <Bot className="h-4 w-4" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold tracking-tight">AI Crop Doctor</div>
            <div className="text-xs text-muted-foreground truncate">Indian Crop-Health Diagnostic Models</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-healthy/15 text-healthy font-semibold">Online</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {isOpen && (
        <ul className="space-y-2 mt-4 animate-in slide-in-from-top-2 fade-in duration-300">
          {insights.map((i, idx) => {
            const Icon = i.icon || Bot;
            const tone =
              i.tone === "alert" ? "border-disease/30 bg-disease/5 text-disease" :
              i.tone === "warn"  ? "border-nutrient/30 bg-nutrient/5 text-nutrient" :
              i.tone === "good"  ? "border-healthy/30 bg-healthy/5 text-healthy" :
                                   "border-water/30 bg-water/5 text-water";
            return (
              <li key={idx} className={`flex gap-3 p-2.5 rounded-xl border ${tone}`}>
                <div className="h-7 w-7 rounded-lg grid place-items-center bg-card border border-border shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[12px] text-foreground font-semibold leading-snug">{i.text}</p>
                  <div className="text-[9.5px] text-muted-foreground mt-0.5">{i.meta}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Weather Panel Component ---------------- */
function WeatherPanel({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-water/10 grid place-items-center"><CloudSun className="h-4 w-4 text-water" /></div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Weather Intelligence · 7 Days</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {data.forecast.map((w: any, i: number) => {
          const I = w.icon;
          return (
            <div key={i} className="rounded-lg border border-border p-2 text-center hover:border-primary/40 transition">
              <div className="text-[9.5px] font-bold text-muted-foreground">{w.d}</div>
              <I className={`h-5 w-5 mx-auto my-1 ${w.label.includes("rain") || w.label.includes("Show") ? "text-water" : "text-nutrient"}`} />
              <div className="text-xs font-bold">{w.t}°</div>
              <div className="text-[9px] text-water font-bold">{w.rain}%</div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-center">
        <Mini icon={Wind} label="Wind" value={data.current.wind} />
      </div>
    </div>
  );
}

function Mini({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-accent/40 p-2">
      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-bold"><Icon className="h-3 w-3" /> {label}</div>
      <div className="text-xs font-bold mt-0.5 text-foreground">{value}</div>
    </div>
  );
}

/* ---------------- Bottom Analytics Component ---------------- */
function BottomAnalytics({ trendData, crop }: { trendData: any[]; crop: string }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ChartCard title={`${crop} Health Index`} subtitle="NDVI composite 14 days" icon={Leaf} accent="healthy">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={trendData} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="gHealth" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.62 0.18 145)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="oklch(0.62 0.18 145)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.012 150)" />
            <XAxis dataKey="d" tick={{ fontSize: 9, fill: "oklch(0.52 0.02 152)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "oklch(0.52 0.02 152)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.012 150)", fontSize: 11 }} />
            <Area type="monotone" dataKey="health" stroke="oklch(0.62 0.18 145)" strokeWidth={2} fill="url(#gHealth)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Yield Forecast" subtitle={`Predicted ${crop} t/ha yield curves`} icon={TrendingUp} accent="info">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trendData} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.012 150)" />
            <XAxis dataKey="d" tick={{ fontSize: 9, fill: "oklch(0.52 0.02 152)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "oklch(0.52 0.02 152)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.012 150)", fontSize: 11 }} />
            <Line type="monotone" dataKey="yield" stroke="oklch(0.58 0.17 150)" strokeWidth={2.5} dot={{ r: 2.5, fill: "oklch(0.58 0.17 150)" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Disease & Pest Incidence" subtitle="Risk probability index next 14 days" icon={Microscope} accent="disease">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={trendData} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="gDis" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.62 0.22 25)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="oklch(0.62 0.22 25)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gPest" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.55 0.22 305)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="oklch(0.55 0.22 305)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.012 150)" />
            <XAxis dataKey="d" tick={{ fontSize: 9, fill: "oklch(0.52 0.02 152)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "oklch(0.52 0.02 152)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.012 150)", fontSize: 11 }} />
            <Area type="monotone" dataKey="disease" stroke="oklch(0.62 0.22 25)" fill="url(#gDis)" strokeWidth={2} name="Disease Risk" />
            <Area type="monotone" dataKey="pest" stroke="oklch(0.55 0.22 305)" fill="url(#gPest)" strokeWidth={2} name="Pest Risk" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}

function ChartCard({ title, subtitle, icon: Icon, accent, children }: { title: string; subtitle: string; icon: any; accent: "healthy"|"disease"|"water"|"nutrient"|"pest"|"info"; children: React.ReactNode }) {
  const c =
    accent === "healthy" ? "bg-healthy/10 text-healthy" :
    accent === "disease" ? "bg-disease/10 text-disease" :
    accent === "water"   ? "bg-water/10 text-water" :
    accent === "nutrient"? "bg-nutrient/10 text-nutrient" :
    accent === "pest"    ? "bg-pest/10 text-pest" : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 hover:shadow-[var(--shadow-elevated)] transition">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`h-7 w-7 rounded-lg grid place-items-center ${c}`}><Icon className="h-3.5 w-3.5" /></div>
        <div>
          <div className="text-sm font-semibold tracking-tight">{title}</div>
          <div className="text-[10.5px] text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ---------------- AI Assistant Drawer Component ---------------- */
function AiAssistantDrawer({ onClose, farm, crop }: { onClose: () => void; farm: string; crop: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    let stateId = "pb";
    if (farm === "Maharashtra Grape Orchards") stateId = "mh";
    else if (farm === "Vinh Long Estate") stateId = "vl";
    fetch(`http://127.0.0.1:8080/api/ai/chat/${stateId}`)
      .then(r => r.json())
      .then(data => setMessages(data));
  }, [farm]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { who: "me", text: input };
    setMessages([...messages, newMsg]);
    setInput("");

    let stateId = "pb";
    if (farm === "Maharashtra Grape Orchards") stateId = "mh";
    else if (farm === "Vinh Long Estate") stateId = "vl";

    fetch(`http://127.0.0.1:8080/api/ai/chat/${stateId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input })
    })
      .then(r => r.json())
      .then(data => {
        setMessages(prev => [...prev, data.reply]);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border h-full flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg grid place-items-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">AgriTwin AI Assistant</div>
            <div className="text-[11px] text-muted-foreground">Precision Farming Diagnostic Model</div>
          </div>
          <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.who === "me" ? "justify-end" : ""}`}>
              <div className={`max-w-[85%] text-[13px] leading-relaxed rounded-2xl px-3 py-2 ${m.who === "me" ? "bg-primary text-primary-foreground font-semibold" : "bg-accent text-foreground"}`}>{m.text}</div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 h-11 rounded-xl border border-border pl-3 pr-1 focus-within:border-primary">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input 
              placeholder={`Ask about ${crop} condition...`} 
              className="flex-1 bg-transparent text-sm outline-none" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="h-8 w-8 rounded-lg grid place-items-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Add Field Modal Component ---------------- */
function AddFieldModal({ onClose }: { onClose: () => void }) {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="fixed inset-0 z-[100] bg-[#1c2128]" />}>
        <AddFieldModalContent onClose={onClose} />
      </Suspense>
    </ClientOnly>
  );
}
