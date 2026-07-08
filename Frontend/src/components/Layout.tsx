import { useState, useRef, useEffect } from "react";
import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import {
  Menu, Hexagon, Bell, Target, Sparkles, MapPin, Sprout, ChevronDown,
  Calendar as CalIcon, Sun, Droplets, ChevronLeft, ChevronRight,
  Grid3x3, Activity, Microscope, Bug, FlaskConical, Plane, CloudSun,
  TrendingUp, Wheat, Bot, FileBarChart, SettingsIcon, Leaf, CloudRain, Calendar,
  Users, Trophy, UserCircle, LogOut, Search
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useDashboardContext } from "@/context/DashboardContext";
import { AiAssistantDrawer } from "@/components/AiAssistantDrawer";
import { AddFieldModal } from "@/components/AddFieldModal";
import { useAuthStore } from "@/stores/authStore";
import navavishkarLogo from "@/assets/navaviskar.png";

/* ---------------- Sidebar Data ---------------- */
const SIDEBAR_GROUPS = [
  {
    group: "🌾 Farm Management",
    items: [
      { label: "Farm Registration & Fields", icon: MapPin   },
    ]
  },
  {
    group: "Monitoring",
    items: [
      { label: "Village Monitoring",   icon: Grid3x3   },
      { label: "AP Rice Bowl",         icon: MapPin    },
    ]
  },
  {
    group: "Satellite Analytics",
    items: [
      { label: "Crop Health (NDVI)",        icon: Leaf       },
      { label: "Water Status (NDMI)",       icon: Droplets   },
      { label: "Vegetation Growth (EVI)",   icon: TrendingUp },
      { label: "Soil Visibility (SAVI)",    icon: Hexagon    },
    ]
  },
  {
    group: "Community",
    items: [
      { label: "Community Farms",      icon: Users,   route: "/community-farms"   },
      { label: "Village Dashboard",    icon: Grid3x3, route: "/village-dashboard"  },
      { label: "Leaderboard",          icon: Trophy,  route: "/leaderboard"        },
    ]
  },
];function Select({ label, icon: Icon, value, onChange, options }: { label: string; icon: any; value: string; onChange: (s: string) => void; options: string[] }) {
  return (
    <label className="hidden md:flex items-center gap-2 h-9 pl-2.5 pr-2 rounded-lg border border-[#1e3e30] bg-[#0A1F17]/60 text-emerald-100 hover:border-emerald-500/40 hover:text-white transition duration-300 group cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
      <Icon className="h-4 w-4 text-emerald-400/80 group-hover:text-emerald-300 group-hover:scale-110 transition-all duration-300" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent text-xs font-semibold outline-none pr-1 cursor-pointer max-w-[190px] text-emerald-100">
        {options.map((o) => <option key={o} className="bg-[#0F2E24] text-emerald-100">{o}</option>)}
      </select>
      <ChevronDown className="h-3.5 w-3.5 text-emerald-400/60 group-hover:text-emerald-300 transition-transform duration-300" />
    </label>
  );
}

function DateFilter() {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <button className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-lg border border-[#1e3e30] bg-[#0A1F17]/60 text-xs font-semibold text-emerald-100 hover:border-emerald-500/40 hover:text-white transition duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.2)] group">
      <CalIcon className="h-4 w-4 text-emerald-400/80 group-hover:text-emerald-300 group-hover:scale-110 transition-all duration-300" />
      <span>{today}</span>
      <span className="text-emerald-500/80">· Real-Time Feed</span>
      <ChevronDown className="h-3.5 w-3.5 text-emerald-400/60 group-hover:text-emerald-300 transition-transform duration-300" />
    </button>
  );
}

/* ── User Avatar Dropdown ──────────────────────────────────── */
function UserAvatarMenu() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/landing" });
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-[#1e3e30] bg-[#0A1F17]/60 hover:border-emerald-500/40 transition duration-300 group">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
          {user?.full_name?.charAt(0)?.toUpperCase() || "F"}
        </div>
        <span className="hidden md:inline text-xs font-semibold text-emerald-100 max-w-[100px] truncate">
          {user?.full_name || "Farmer"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-emerald-400/60" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 bg-[#0a1f17] border border-emerald-800/40 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-[9999] py-2 backdrop-blur-xl">
          <div className="px-4 py-3 border-b border-emerald-800/20">
            <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-emerald-400/60 truncate">{user?.email}</p>
            <p className="text-[10px] text-emerald-500/40 mt-1 uppercase">{user?.role}</p>
          </div>
          <Link to="/profile" onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-200/80 hover:bg-emerald-800/20 hover:text-white transition-colors">
            <UserCircle className="w-4 h-4" /> My Profile
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400/80 hover:bg-red-900/20 hover:text-red-300 transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { crop, setCrop, setAiOpen } = useApp();

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-[#0A1F17] to-[#0F2E24] backdrop-blur-xl border-b border-[#16a34a]/20 shadow-[0_4px_30px_rgba(10,31,23,0.4)] animate-border-glow">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes border-glow {
          0%, 100% { border-bottom-color: rgba(22, 163, 74, 0.2); box-shadow: 0 4px 30px rgba(10, 31, 23, 0.4); }
          50% { border-bottom-color: rgba(20, 184, 166, 0.4); box-shadow: 0 4px 35px rgba(22, 163, 74, 0.15); }
        }
        .animate-border-glow {
          animation: border-glow 8s ease-in-out infinite;
        }

        @keyframes title-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-title-gradient {
          background-size: 300% 300%;
          animation: title-gradient 10s ease infinite;
        }

        @keyframes text-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(74, 222, 128, 0.3)); }
          50% { filter: drop-shadow(0 0 12px rgba(20, 184, 166, 0.6)); }
        }
        .animate-text-glow {
          animation: text-glow 5s ease-in-out infinite;
        }

        @keyframes leaf-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(10deg); }
        }
        .animate-leaf-float {
          display: inline-block;
          transform-origin: bottom center;
          animation: leaf-float 4s ease-in-out infinite;
        }

        @keyframes fade-in-tagline {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 0.9; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in-tagline 1.2s ease-out forwards;
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 20px rgba(20, 184, 166, 0.7); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2.5s infinite;
        }
      `}} />
      <div className="flex items-center justify-between px-4 md:px-8 py-1.5 md:py-2.5 w-full relative">
        
        {/* LEFT: Menu Toggle & Org Logo */}
        <div className="flex items-center gap-2 md:gap-6 z-10 w-auto md:w-1/3">
          <button 
            onClick={onToggleSidebar} 
            className="p-2 rounded-md text-emerald-100/80 hover:text-white hover:bg-emerald-800/20 active:scale-95 transition-all duration-300 shrink-0" 
            aria-label="menu"
          >
            <Menu className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <Link to="/" className="hidden md:flex items-center shrink-0 group">
            <img 
              src={navavishkarLogo} 
              alt="Navavishkar Logo" 
              className="h-[45px] sm:h-[60px] lg:h-[70px] scale-125 lg:scale-[1.3] origin-left w-auto object-contain transition-all duration-500 group-hover:scale-[1.35] group-hover:brightness-110" 
            />
          </Link>
          <div className="hidden lg:block h-8 w-px bg-emerald-800/30 shrink-0 ml-8" />
        </div>
 
        {/* CENTER: Redesigned Premium Branding */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none group z-20 w-auto max-w-[50%] md:max-w-none">
          <div className="flex items-center gap-1.5 md:gap-3">
            {/* Animated Rice Grain/Leaf Icon */}
            <div className="relative hidden md:flex items-center justify-center h-10 w-10 shrink-0 select-none animate-leaf-float">
              {/* Magic sparks around the icon */}
              <span className="absolute text-[8px] text-yellow-300 animate-ping" style={{ top: '5%', left: '15%' }}>✦</span>
              <span className="absolute text-[6px] text-emerald-400 animate-pulse" style={{ bottom: '15%', right: '10%' }}>✦</span>
              <span className="absolute text-[8px] text-teal-300 animate-pulse" style={{ top: '45%', right: '5%', animationDelay: '1s' }}>✦</span>
              <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]">🌾</span>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1">
                <h1 className="text-xs sm:text-lg md:text-[25px] font-extrabold tracking-tight leading-none animate-text-glow" style={{ fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif" }}>
                  <span className="bg-gradient-to-r from-green-400 via-lime-400 via-yellow-300 to-teal-400 bg-clip-text text-transparent animate-title-gradient">
                    AgriTwin Intelligence
                  </span>
                </h1>
                <span className="relative flex h-1.5 w-1.5 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                </span>
              </div>
              <p className="text-[8px] md:text-[11.5px] font-medium tracking-[0.05em] text-emerald-300/80 mt-0.5 leading-none animate-fade-in">
                Smart Insights. Strong Harvests.
              </p>
            </div>
          </div>
        </div>
 
        <div className="flex items-center gap-3.5 z-10">
          <DateFilter />
          <button 
            onClick={() => setAiOpen(true)}
            className="hidden md:inline-flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-bold text-white tracking-wider uppercase bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-md transition-all duration-300 transform hover:scale-[1.03] animate-pulse-glow hover:shadow-[0_0_20px_rgba(20,184,166,0.6)] group"
          >
            <Sparkles className="h-4 w-4 text-emerald-100 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
            AI Assistant
          </button>
          <UserAvatarMenu />
        </div>
      </div>
    </header>
  );
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { activePanel, setActivePanel } = useDashboardContext();
  const router = useRouter();
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-[9990] md:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}
      <aside
        className={`fixed md:sticky top-[60px] md:top-[70px] lg:top-[85px] left-0 z-[9991] md:z-auto self-start h-[calc(100vh-60px)] md:h-[calc(100vh-70px)] lg:h-[calc(100vh-85px)] flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-out
          ${collapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0 shadow-2xl md:shadow-none"}`}
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
                  const active = activePanel === it.label && currentPath === "/";
                  const route = (it as any).route;
                  
                  if (route) {
                    return (
                      <Link key={it.label} to={route}
                        className={`w-full flex items-center ${collapsed ? "justify-center px-0" : "justify-between px-3"} h-9 rounded-lg text-sm transition relative
                          ${currentPath === route ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"}`}>
                        <div className={`flex items-center ${collapsed ? "justify-center w-full" : "gap-3 truncate"}`}>
                          {currentPath === route && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary" />}
                          <Icon className={`h-[18px] w-[18px] shrink-0 ${currentPath === route ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                          {!collapsed && <span className="truncate">{it.label}</span>}
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <button key={it.label} onClick={() => {
                        setActivePanel(it.label);
                        if (currentPath !== "/") {
                          router.navigate({ to: "/" });
                        }
                      }}
                      className={`w-full flex items-center ${collapsed ? "justify-center px-0" : "justify-between px-3"} h-9 rounded-lg text-sm transition relative
                        ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"}`}>
                      <div className={`flex items-center ${collapsed ? "justify-center w-full" : "gap-3 truncate"}`}>
                        {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary" />}
                        <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                        {!collapsed && <span className="truncate">{it.label}</span>}
                      </div>
                      {!collapsed && (it as any).alert && (
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
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { activeFarm, weatherData, aiOpen, setAiOpen, addFieldOpen, setAddFieldOpen, farm, crop } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  if (!activeFarm) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary" />
          </span>
          <span className="text-base font-semibold text-foreground">Connecting to AgriTwin Intelligence...</span>
        </div>
        <p className="text-xs text-muted-foreground">Fetching district data from the backend</p>
      </div>
    );
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
