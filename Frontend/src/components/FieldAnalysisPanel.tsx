import React, { useState, useEffect } from "react";
import {
  Droplets, Leaf, TrendingUp, AlertTriangle, CheckCircle2,
  Sprout, Activity, Loader2, Thermometer, Wind, CloudRain,
  Layers, BrainCircuit, History, CalendarDays, ActivitySquare, Target, Volume2, PlayCircle
} from "lucide-react";
import type { RegisteredField } from "@/context/DashboardContext";
import { SatelliteEvidencePanel } from "./SatelliteEvidencePanel";

// ── Components ──────────────────────────────────────────────────────────────

function MetricCard({ title, value, unit, icon, color }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-opacity-10`} style={{ backgroundColor: `${color}20`, color: color }}>
          {icon}
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground">{title}</div>
          <div className="text-lg font-black text-foreground">
            {value} <span className="text-xs text-muted-foreground font-semibold">{unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, icon, colorClass }: any) {
  return (
    <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
      <div className={`p-1.5 rounded-md ${colorClass} bg-opacity-10 bg-current`}>
        {icon}
      </div>
      <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">{title}</h3>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function FieldAnalysisPanel({ field }: { field: RegisteredField }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    analytics: null, weather: null, soil: null, ai: null, timeline: [], history: null
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        const baseUrl = `http://127.0.0.1:8000/api/farms/${field.id}`;
        const [resA, resW, resS, resAI, resT, resH] = await Promise.all([
          fetch(`${baseUrl}/analytics`), fetch(`${baseUrl}/weather`),
          fetch(`${baseUrl}/soil`), fetch(`${baseUrl}/ai`),
          fetch(`${baseUrl}/timeline`), fetch(`${baseUrl}/history`)
        ]);

        if (mounted) {
          setData({
            analytics: await resA.json(),
            weather: await resW.json(),
            soil: await resS.json(),
            ai: await resAI.json(),
            timeline: await resT.json(),
            history: await resH.json()
          });
        }
      } catch (e) {
        console.error("Failed to fetch digital twin data:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [field.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <div className="text-sm font-bold text-foreground animate-pulse">Loading Digital Twin Analytics...</div>
      </div>
    );
  }

  const { analytics, weather, soil, ai, timeline } = data;
  const score = analytics?.health_score || 0;
  const scoreColor = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-12">
      
      {/* 1. Overall Health & Digital Twin ID */}
      <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900/40 border border-emerald-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <ActivitySquare className="h-32 w-32" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-1">Farm Digital Twin ID: {field.id.split("-")[1]}</div>
          <h2 className="text-2xl font-black text-white">{field.name}</h2>
          <div className="text-xs text-emerald-100/70 mt-1 flex items-center gap-2">
            <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 font-bold">{field.areaAcres.toFixed(2)} Acres</span>
            <span>{(field as any).cropName || "Paddy (Rice)"}</span>
            <span>·</span>
            <span>{field.villageName}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-950/50 p-3 rounded-xl border border-white/5">
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 32}`} strokeDashoffset={`${2 * Math.PI * 32 * (1 - score / 100)}`}
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-lg font-black" style={{ color: scoreColor }}>{score}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Health Score</div>
            <div className="text-sm font-black text-white">{score >= 70 ? "Excellent" : score >= 50 ? "Moderate" : "Critical"}</div>
          </div>
        </div>
      </div>

      {/* Audio Playback Button */}
      <button 
        onClick={() => {
          const vigor = analytics?.ndvi || 0;
          const moisture = analytics?.ndmi || 0;
          const status = score >= 70 ? "Excellent" : score >= 50 ? "Moderate" : "Critical";
          const text = `Hello. Your farm's digital twin reports a health status of ${status}. The crop vigor index is ${vigor.toFixed(2)}, and moisture is ${moisture.toFixed(2)}.`;
          const audioUrl = `http://127.0.0.1:8000/api/tts?text=${encodeURIComponent(text)}&lang=te`;
          const audio = new Audio(audioUrl);
          audio.play().catch(console.error);
        }}
        className="w-full flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-3 rounded-xl transition border border-emerald-300 shadow-sm"
      >
        <Volume2 className="h-5 w-5" /> Listen to Crop Report
      </button>

      {/* 2. Vegetation & Water Analytics */}
      <div>
        <SectionHeader title="Vegetation & Water" icon={<Leaf className="h-4 w-4" />} colorClass="text-emerald-500" />
        <div className="grid grid-cols-2 gap-3">
          <MetricCard title="NDVI (Vigor)" value={(analytics?.ndvi || 0).toFixed(3)} unit="idx" icon={<TrendingUp className="h-4 w-4" />} color="#10b981" />
          <MetricCard title="NDMI (Moisture)" value={(analytics?.ndmi || 0).toFixed(3)} unit="idx" icon={<Droplets className="h-4 w-4" />} color="#3b82f6" />
          <MetricCard title="EVI (Growth)" value={(analytics?.evi || 0).toFixed(3)} unit="idx" icon={<Sprout className="h-4 w-4" />} color="#84cc16" />
          <MetricCard title="SAVI (Soil Adj)" value={(analytics?.savi || 0).toFixed(3)} unit="idx" icon={<Layers className="h-4 w-4" />} color="#f59e0b" />
        </div>
      </div>

      {/* 3. Weather Analytics */}
      <div>
        <SectionHeader title="Microclimate Weather" icon={<Wind className="h-4 w-4" />} colorClass="text-sky-500" />
        <div className="grid grid-cols-2 gap-3">
          <MetricCard title="Temperature" value={weather?.temperature || "--"} unit="°C" icon={<Thermometer className="h-4 w-4" />} color="#f97316" />
          <MetricCard title="Humidity" value={weather?.humidity || "--"} unit="%" icon={<Droplets className="h-4 w-4" />} color="#06b6d4" />
          <MetricCard title="Wind Speed" value={weather?.wind_speed || "--"} unit="km/h" icon={<Wind className="h-4 w-4" />} color="#64748b" />
          <MetricCard title="Rain Probability" value={weather?.rain_probability || "--"} unit="%" icon={<CloudRain className="h-4 w-4" />} color="#3b82f6" />
        </div>
      </div>

      {/* 4. Soil Analytics */}
      <div>
        <SectionHeader title="Soil Health" icon={<Layers className="h-4 w-4" />} colorClass="text-amber-600" />
        <div className="grid grid-cols-2 gap-3">
          <MetricCard title="Nitrogen (N)" value={soil?.nitrogen || "--"} unit="kg/ha" icon={<Activity className="h-4 w-4" />} color="#10b981" />
          <MetricCard title="Phosphorus (P)" value={soil?.phosphorus || "--"} unit="kg/ha" icon={<Activity className="h-4 w-4" />} color="#f59e0b" />
          <MetricCard title="Potassium (K)" value={soil?.potassium || "--"} unit="kg/ha" icon={<Activity className="h-4 w-4" />} color="#8b5cf6" />
          <MetricCard title="Soil pH" value={soil?.ph || "--"} unit="pH" icon={<Activity className="h-4 w-4" />} color="#ef4444" />
        </div>
      </div>

      {/* 5. AI Recommendations */}
      <div>
        <SectionHeader title="AI Agronomist" icon={<BrainCircuit className="h-4 w-4" />} colorClass="text-purple-500" />
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="text-[10px] uppercase font-bold text-red-500 flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" /> Disease Risk</div>
              <div className="text-xl font-black text-red-600 mt-1">{ai?.disease_risk || 0}%</div>
            </div>
            <div className="flex-1 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="text-[10px] uppercase font-bold text-orange-500 flex items-center gap-1.5"><Bug className="h-3 w-3" /> Pest Risk</div>
              <div className="text-xl font-black text-orange-600 mt-1">{ai?.pest_risk || 0}%</div>
            </div>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
            <div className="text-[10px] uppercase font-bold text-emerald-600 mb-1">AI Recommendation</div>
            <div className="text-sm font-semibold text-foreground leading-relaxed">{ai?.recommendation || "No current recommendations."}</div>
          </div>
        </div>
      </div>

      {/* 6. Farm Timeline */}
      <div>
        <SectionHeader title="Crop Lifecycle Timeline" icon={<CalendarDays className="h-4 w-4" />} colorClass="text-indigo-500" />
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="relative border-l-2 border-indigo-500/20 ml-3 space-y-6 py-2">
            {timeline?.map((evt: any, i: number) => (
              <div key={i} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-indigo-500 border-4 border-card" />
                <div className="text-[10px] font-bold text-indigo-500">{evt.event_date}</div>
                <div className="text-sm font-bold text-foreground">{evt.event_name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{evt.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SatelliteEvidencePanel meta={null} captureDate={undefined} source="Copernicus Data Space" compact />
    </div>
  );
}

// Dummy icon for Bug since it was missing in import
function Bug(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>;
}
