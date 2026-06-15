import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Menu, Hexagon, Bell, Target, Sparkles, MapPin, Sprout, ChevronDown,
  Calendar as CalIcon, Sun, Droplets, ChevronLeft, ChevronRight,
  Grid3x3, Activity, Microscope, Bug, FlaskConical, Plane, CloudSun,
  TrendingUp, Wheat, Bot, FileBarChart, SettingsIcon
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { AiAssistantDrawer } from "@/components/AiAssistantDrawer";
import { AddFieldModal } from "@/components/AddFieldModal";

/* ---------------- Sidebar Data ---------------- */
const SIDEBAR_ITEMS = [
  { label: "Dashboard", icon: Grid3x3, path: "/" },
  { label: "Farm Overview", icon: MapPin, path: "/farm-overview" },
  { label: "Live Monitoring", icon: Activity, path: "/live-monitoring" },
  { label: "Disease Detection", icon: Microscope, path: "/disease-detection" },
  { label: "Pest Monitoring", icon: Bug, path: "/pest-monitoring" },
  { label: "Nutrient Analysis", icon: FlaskConical, path: "/nutrient-analysis" },
  { label: "Water Management", icon: Droplets, path: "/water-management" },
  { label: "Drone Monitoring", icon: Plane, path: "/drone-monitoring" },
  { label: "Weather Intelligence", icon: CloudSun, path: "/weather-intelligence" },
  { label: "Yield Prediction", icon: TrendingUp, path: "/yield-prediction" },
  { label: "Harvest Planner", icon: Wheat, path: "/harvest-planner" },
  { label: "AI Crop Doctor", icon: Bot, path: "/ai-crop-doctor" },
  { label: "Reports", icon: FileBarChart, path: "/reports" },
  { label: "Settings", icon: SettingsIcon, path: "/settings" },
];

function Select({ label, icon: Icon, value, onChange, options }: { label: string; icon: any; value: string; onChange: (s: string) => void; options: string[] }) {
  return (
    <label className="hidden md:flex items-center gap-2 h-9 pl-2.5 pr-2 rounded-lg border border-border bg-card hover:border-primary/40 transition group">
      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm font-medium outline-none pr-1 cursor-pointer max-w-[190px]">
        {options.map((o) => <option key={o} className="bg-card text-foreground">{o}</option>)}
      </select>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
    </label>
  );
}

function DateFilter() {
  return (
    <button className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card text-sm hover:border-primary/40">
      <CalIcon className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium">June 13, 2026</span>
      <span className="text-muted-foreground">· Real-Time Feed</span>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

function WeatherChip({ weatherData }: { weatherData: any }) {
  const current = weatherData?.current;
  if (!current) return null;
  return (
    <div className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card text-sm">
      <Sun className="h-4 w-4 text-nutrient" />
      <span className="font-semibold">{current.temp}°C</span>
      <span className="text-muted-foreground">Ludhiana</span>
      <span className="text-muted-foreground">·</span>
      <Droplets className="h-3.5 w-3.5 text-water" />
      <span className="text-muted-foreground">{current.humidity}</span>
    </div>
  );
}

export function Header() {
  const { farm, setFarm, crop, setCrop, setAiOpen, setAddFieldOpen, weatherData } = useApp();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 md:px-6 h-16">
        <button className="lg:hidden p-2 rounded-md hover:bg-accent" aria-label="menu"><Menu className="h-5 w-5" /></button>

        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 rounded-xl grid place-items-center text-primary-foreground shadow-[var(--shadow-soft)]" style={{ background: "var(--gradient-primary)" }}>
            <Hexagon className="h-5 w-5" strokeWidth={2.4} />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-healthy ring-2 ring-card" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>AgriTwin <span className="text-primary">Vision</span></div>
            <div className="text-[10.5px] text-muted-foreground -mt-0.5">Precision Agriculture · India Grid</div>
          </div>
        </Link>

        <div className="mx-4 h-8 w-px bg-border hidden md:block" />

        <Select label="Active Grid" icon={MapPin} value={farm} onChange={(f) => {
          setFarm(f);
          if (f === "Punjab Wheat Belt") setCrop("Wheat");
          else if (f === "Maharashtra Grape Orchards") setCrop("Grapes");
          else if (f === "Vinh Long Estate") setCrop("Dragon Fruit");
        }}
          options={["Punjab Wheat Belt", "Maharashtra Grape Orchards", "Vinh Long Estate"]} />
        <Select label="Crop Profile" icon={Sprout} value={crop} onChange={(c) => {
          setCrop(c);
          if (c === "Wheat") setFarm("Punjab Wheat Belt");
          else if (c === "Grapes") setFarm("Maharashtra Grape Orchards");
          else if (c === "Dragon Fruit") setFarm("Vinh Long Estate");
        }}
          options={["Wheat", "Grapes", "Dragon Fruit"]} />
        <DateFilter />

        <div className="ml-auto flex items-center gap-2">
          <WeatherChip weatherData={weatherData} />
          <button className="relative p-2 rounded-lg hover:bg-accent" aria-label="notifications">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-disease" />
          </button>
          <button onClick={() => setAddFieldOpen(true)}
            className="hidden md:inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium border border-border bg-card hover:bg-accent transition">
            <Target className="h-4 w-4" /> Add Field
          </button>
          <button onClick={() => setAiOpen(true)}
            className="hidden md:inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-95 transition"
            style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-4 w-4" /> AI Assistant
          </button>
        </div>
      </div>
    </header>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <aside
      className="sticky top-16 self-start h-[calc(100vh-4rem)] hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out"
      style={{ width: collapsed ? 72 : 248 }}
    >
      <div className="p-3 flex-1 overflow-y-auto scrollbar-thin">
        <div className={`text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground px-3 py-2 ${collapsed ? "text-center" : ""}`}>
          {collapsed ? "··" : "Crop Analytics"}
        </div>
        <nav className="space-y-0.5">
          {SIDEBAR_ITEMS.map((it) => {
            const Icon = it.icon;
            const active = currentPath === it.path;
            return (
              <Link key={it.label} to={it.path}
                className={`group w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm transition relative
                  ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"}`}>
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary" />}
                <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                {!collapsed && <span className="truncate">{it.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-3 border-t border-sidebar-border">
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-sidebar-border hover:bg-sidebar-accent text-xs text-muted-foreground">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Collapse</>}
        </button>
      </div>
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { activeFarm, weatherData, aiOpen, setAiOpen, addFieldOpen, setAddFieldOpen, farm, crop } = useApp();

  if (!activeFarm || !weatherData) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground font-semibold">Loading Global Data...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "Inter, ui-sans-serif" }}>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 md:p-6 space-y-6">
          {children}
        </main>
      </div>
      {aiOpen && <AiAssistantDrawer onClose={() => setAiOpen(false)} farm={farm} crop={crop} />}
      {addFieldOpen && <AddFieldModal onClose={() => setAddFieldOpen(false)} />}
    </div>
  );
}
