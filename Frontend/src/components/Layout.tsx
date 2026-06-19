import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Menu, Hexagon, Bell, Target, Sparkles, MapPin, Sprout, ChevronDown,
  Calendar as CalIcon, Sun, Droplets, ChevronLeft, ChevronRight,
  Grid3x3, Activity, Microscope, Bug, FlaskConical, Plane, CloudSun,
  TrendingUp, Wheat, Bot, FileBarChart, SettingsIcon, Leaf, CloudRain, Calendar
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useDashboardContext } from "@/context/DashboardContext";
import { AiAssistantDrawer } from "@/components/AiAssistantDrawer";
import { AddFieldModal } from "@/components/AddFieldModal";
import navavishkarLogo from "@/assets/navaviskar.png";

/* ---------------- Sidebar Data ---------------- */
const SIDEBAR_GROUPS = [
  {
    group: "Farm Overview",
    items: [
      { label: "Dashboard", icon: Grid3x3 },
    ]
  },
  {
    group: "Satellite Analytics",
    items: [
      { label: "Crop Health (NDVI)", icon: Leaf },
      { label: "Water Status (NDMI)", icon: Droplets },
      { label: "Vegetation Growth (EVI)", icon: Sprout },
      { label: "Soil Visibility (SAVI)", icon: Hexagon },
    ]
  },
  {
    group: "Regional Intelligence",
    items: [
      { label: "AP Rice Bowl", icon: MapPin },
    ]
  }
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
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <button className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card text-sm hover:border-primary/40">
      <CalIcon className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium">{today}</span>
      <span className="text-muted-foreground">· Real-Time Feed</span>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { crop, setCrop, setAiOpen } = useApp();

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] border-b border-border bg-card/95 backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sway {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg); }
        }
        .animate-sway {
          display: inline-block;
          transform-origin: bottom center;
          animation: sway 3s ease-in-out infinite;
        }
      `}} />
      <div className="flex items-center justify-between px-4 md:px-8 py-1.5 md:py-2 w-full relative">
        
        {/* LEFT: Office Logo */}
        <div className="flex items-center gap-4 md:gap-6 z-10 w-1/3">
          <button onClick={onToggleSidebar} className="p-2 rounded-md hover:bg-accent transition shrink-0" aria-label="menu"><Menu className="h-6 w-6" /></button>
          <Link to="/" className="flex items-center shrink-0">
            <img src={navavishkarLogo} alt="Navavishkar Logo" className="h-[45px] sm:h-[60px] lg:h-[75px] scale-125 lg:scale-[1.35] origin-left w-auto object-contain hover:scale-150 transition-all duration-500 animate-in fade-in zoom-in-95 duration-1000" />
          </Link>
          <div className="hidden lg:block h-8 w-px bg-border/60 shrink-0 ml-8" />
        </div>

        {/* CENTER: Premium Branding */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none group">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-sway">🌾</span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-primary to-emerald-800 transition-all duration-300 group-hover:scale-[1.02] group-hover:drop-shadow-sm" style={{ fontFamily: "'Poppins', 'Montserrat', 'Outfit', sans-serif" }}>
              RiceBowl Intelligence
            </h1>
            <span className="relative flex h-2.5 w-2.5 ml-1" title="Live Satellite Intelligence">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.2em] text-emerald-600/80 uppercase mt-0.5">
            Protect Every Grain
          </p>
        </div>

        {/* RIGHT: Controls */}
        <div className="flex items-center gap-2">
          <Select label="Crop Profile" icon={Sprout} value={crop} onChange={(c) => setCrop(c)} options={["Paddy"]} />
          <DateFilter />
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

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { activePanel, setActivePanel } = useDashboardContext();

  return (
    <aside
      className="sticky top-[60px] md:top-[70px] lg:top-[85px] self-start h-[calc(100vh-60px)] md:h-[calc(100vh-70px)] lg:h-[calc(100vh-85px)] hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out"
      style={{ width: collapsed ? 72 : 280 }}
    >
      <div className="p-3 flex-1 overflow-y-auto scrollbar-thin">

        <div className={`text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground px-3 py-2 mt-2 ${collapsed ? "text-center" : ""}`}>
          {collapsed ? "··" : "Analytics & Digital Twin"}
        </div>
        <nav className="space-y-4">
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">
                  {group.group}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((it) => {
                  const Icon = it.icon;
                  const active = activePanel === it.label;
                  return (
                    <button key={it.label} onClick={() => setActivePanel(it.label)}
                      className={`w-full flex items-center ${collapsed ? "justify-center px-0" : "justify-between px-3"} h-9 rounded-lg text-sm transition relative
                        ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"}`}>
                      <div className={`flex items-center ${collapsed ? "justify-center w-full" : "gap-3 truncate"}`}>
                        {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary" />}
                        <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                        {!collapsed && <span className="truncate">{it.label}</span>}
                      </div>
                      {!collapsed && it.alert && (
                        <span className="h-2 w-2 rounded-full bg-disease animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
      <div className="p-3 border-t border-sidebar-border">
        <button onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-sidebar-border hover:bg-sidebar-accent text-xs text-muted-foreground">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> 🌱 Smart Farming, Better Harvests</>}
        </button>
      </div>
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { activeFarm, weatherData, aiOpen, setAiOpen, addFieldOpen, setAddFieldOpen, farm, crop } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!activeFarm || !weatherData) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground font-semibold">Loading Global Data...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "Inter, ui-sans-serif" }}>
      <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex pt-[60px] md:pt-[70px] lg:pt-[85px]">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 min-w-0 p-4 md:p-6 space-y-6">
          {children}
        </main>
      </div>
      {aiOpen && <AiAssistantDrawer onClose={() => setAiOpen(false)} farm={farm} crop={crop} />}
      {addFieldOpen && <AddFieldModal onClose={() => setAddFieldOpen(false)} />}
    </div>
  );
}
