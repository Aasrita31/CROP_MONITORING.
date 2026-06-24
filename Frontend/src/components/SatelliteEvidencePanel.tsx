import React, { useState } from "react";
import { Satellite, ChevronDown, ChevronUp, Shield, Calendar, Cloud, Layers } from "lucide-react";

interface SatelliteEvidencePanelProps {
  meta: {
    productName?: string;
    sensingDate?: string;
    cloudCover?: string;
    spatialResolution?: string;
    processingLevel?: string;
    productId?: string;
    instrument?: string;
    online?: string;
  } | null;
  captureDate?: string;
  source?: string;
  compact?: boolean;
}

export function SatelliteEvidencePanel({ meta, captureDate, source, compact = false }: SatelliteEvidencePanelProps) {
  const [open, setOpen] = useState(!compact);

  const displayDate = captureDate
    ? new Date(captureDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm satellite-evidence-panel">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-900/80 to-slate-800/80 hover:from-slate-800/90 hover:to-slate-700/90 transition text-left"
      >
        <div className="h-8 w-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 satellite-glow">
          <Satellite className="h-4 w-4 text-blue-400 satellite-orbit" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-blue-300 uppercase tracking-widest">🛰 Copernicus Sentinel-2 Evidence</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{source || "Sentinel-2 L2A · Real Data"} · {displayDate}</div>
        </div>
        {compact && (open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />)}
      </button>

      {open && (
        <div className="p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Key badges */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Calendar, label: "Sensing Date", value: meta?.sensingDate || displayDate, color: "text-emerald-400" },
              { icon: Cloud, label: "Cloud Cover", value: meta?.cloudCover || "< 5%", color: "text-blue-400" },
              { icon: Layers, label: "Resolution", value: meta?.spatialResolution || "10 meters", color: "text-purple-400" },
              { icon: Shield, label: "Processing", value: "Level-2A", color: "text-amber-400" },
            ].map(item => (
              <div key={item.label} className="bg-accent/20 rounded-xl p-3 border border-border/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon className={`h-3 w-3 ${item.color}`} />
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">{item.label}</span>
                </div>
                <div className={`text-xs font-bold ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Product ID */}
          {meta?.productName && (
            <div className="bg-slate-900/50 rounded-xl px-3 py-2.5 border border-slate-700/50">
              <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Product ID</div>
              <div className="text-[10px] font-mono text-slate-300 break-all leading-relaxed">{meta.productName}</div>
            </div>
          )}

          {/* Satellite info strip */}
          <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">
              {meta?.instrument || "Sentinel-2 MSI"} · ESA Copernicus Programme · Free & Open Data
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
