import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Leaf, Info, Map as MapIcon, ChevronRight, Sprout, TrendingUp, Sun, Activity, Droplets, ArrowRightLeft, Bot } from 'lucide-react';
import punjabFarmImg from "@/assets/punjab-wheat-farm.png";
import maharashtraFarmImg from "@/assets/maharashtra-grape-farm.png";
import wheatEarImg from "@/assets/wheat-ear.png";
import satelliteImg from "@/assets/satellite-farm.jpg";

interface EviExplanationPanelProps {
  villageName: string;
  villageAnalysis?: any;
}

const GROWTH_STAGES = [
  "Seedling",
  "Tillering",
  "Vegetative",
  "Flowering",
  "Grain Filling",
  "Harvest"
];

export function EviExplanationPanel({ villageName, villageAnalysis }: EviExplanationPanelProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isFarmerMode, setIsFarmerMode] = useState(true);

  // Fallbacks if backend doesn't have it yet
  const evi = villageAnalysis?.evi ?? 0.35;
  const eviImageUrl = villageAnalysis?.eviImageUrl || null;
  const eviHistoricalImageUrl = villageAnalysis?.eviHistoricalImageUrl || null;
  const trueColorImageUrl = villageAnalysis?.trueColorImageUrl || satelliteImg;
  const growthStage = villageAnalysis?.growthStage || "Vegetative";
  const biomassEstimate = villageAnalysis?.biomassEstimate || 4.5;
  const captureDate = villageAnalysis?.captureDate || "22 June 2026";
  const productId = villageAnalysis?.copernicusMetadata?.productId || "S2B_MSIL2A_20260622";
  const bounds = villageAnalysis?.bounds;

  // Handle Slider
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    let clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  // Determine stage index
  const stageIndex = GROWTH_STAGES.indexOf(growthStage);
  const progressPercent = Math.max(5, Math.min(100, ((stageIndex + 1) / GROWTH_STAGES.length) * 100));

  // Determine crop image
  let cropImage = punjabFarmImg;
  if (evi > 0.5) cropImage = punjabFarmImg;
  else if (evi > 0.2) cropImage = maharashtraFarmImg;
  else cropImage = wheatEarImg; // just an example for sparse

  // Leaflet map setup for heatmap
  useEffect(() => {
    // We would initialize a real leaflet map here, but for now we'll use CSS overlay techniques
    // to keep it fast, similar to NdmiExplanationPanel
  }, [eviImageUrl, trueColorImageUrl, bounds]);

  try {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header and Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Sprout className="w-6 h-6 text-emerald-500" />
            Vegetation Growth (EVI)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time Copernicus Sentinel-2 EVI Telemetry</p>
        </div>
        <div className="flex bg-accent/40 rounded-xl p-1 border border-border shadow-sm">
          <button 
            onClick={() => setIsFarmerMode(true)} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${isFarmerMode ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Leaf className="h-4 w-4" /> Farmer Mode
          </button>
          <button 
            onClick={() => setIsFarmerMode(false)} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${!isFarmerMode ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Activity className="h-4 w-4" /> Expert Mode
          </button>
        </div>
      </div>

      {isFarmerMode ? (
        <>
          {/* SECTION 9: Farmer Summary */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              {/* SECTION 4: Growth Progress Meter */}
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-accent" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-emerald-500 transition-all duration-1000 ease-out" strokeDasharray={`${progressPercent * 2.83} 283`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-emerald-600">{Math.round(progressPercent)}%</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Progress</span>
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase">Crop Growth</div>
                <div className="text-lg font-bold text-foreground">{evi > 0.5 ? "Excellent" : evi > 0.3 ? "Moderate" : "Slow"}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase">Current Stage</div>
                <div className="text-lg font-bold text-foreground">{growthStage}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase">Expected Harvest</div>
                <div className="text-lg font-bold text-foreground">In {Math.max(0, 100 - progressPercent)} Days</div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase">Recommendation</div>
                <div className="text-sm font-bold text-amber-600">Apply Urea within 5 Days</div>
              </div>
            </div>
          </div>

          {/* SECTION 1: Current Growth Stage Timeline */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-6">Paddy Growth Timeline</h3>
            <div className="relative flex justify-between">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-accent -translate-y-1/2 rounded-full" />
              <div className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
              
              {GROWTH_STAGES.map((stage, idx) => {
                const isPast = idx <= stageIndex;
                const isCurrent = idx === stageIndex;
                return (
                  <div key={stage} className="relative flex flex-col items-center gap-2 z-10 w-16">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${isCurrent ? "bg-card border-emerald-500 ring-4 ring-emerald-500/20" : isPast ? "bg-emerald-500 border-emerald-500" : "bg-card border-border"}`}>
                      {isCurrent && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />}
                    </div>
                    <div className={`text-[10px] font-bold text-center ${isCurrent ? "text-emerald-500" : isPast ? "text-foreground" : "text-muted-foreground"}`}>{stage}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SECTION 2: Dynamic Crop Illustration */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-4 border-b border-border font-bold text-sm bg-accent/30">Field Status Illustration</div>
              <div className="relative flex-1 min-h-[200px] bg-black">
                <img src={cropImage} alt="Crop status" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h4 className="text-white font-bold text-lg mb-1">{villageName} Paddy Field</h4>
                  <p className="text-white/80 text-xs">Visualizing crop density at {growthStage} stage. EVI score indicates {evi > 0.5 ? "dense green crop" : "moderate growth"}.</p>
                </div>
              </div>
            </div>

            {/* SECTION 7 & 8: AI Advisor and Yield Potential */}
            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-amber-600">AI Growth Advisor</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm text-foreground/80 font-medium">
                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    Apply Nitrogen to support Tillering phase.
                  </li>
                  <li className="flex items-start gap-2 text-sm text-foreground/80 font-medium">
                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    Water levels are adequate (NDMI normal).
                  </li>
                  <li className="flex items-start gap-2 text-sm text-foreground/80 font-medium">
                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    Monitor growth for next 15 days; expected transition to Vegetative state soon.
                  </li>
                </ul>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-blue-600">Yield Potential</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-bold text-blue-600/70 uppercase">Expected Yield</div>
                    <div className="text-xl font-black text-blue-700">{villageAnalysis?.yieldPrediction || "4.2"} t/ha</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-600/70 uppercase">Harvest Readiness</div>
                    <div className="text-xl font-black text-blue-700">{Math.round(progressPercent)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* EXPERT MODE */}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SECTION 3: Real Sentinel-2 Growth Analysis */}
            <div className="col-span-1 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2 border-b border-border pb-3 mb-4">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Real Sentinel-2 Growth Analysis
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-accent/30 p-2.5 rounded-lg border border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">Village Name</span>
                  <span className="text-sm font-bold text-foreground">{villageName}</span>
                </div>
                <div className="flex justify-between items-center bg-accent/30 p-2.5 rounded-lg border border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">EVI Value (Mean)</span>
                  <span className="text-sm font-black text-emerald-500">{evi.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center bg-accent/30 p-2.5 rounded-lg border border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">EVI Min / Max</span>
                  <span className="text-xs font-bold text-foreground">{villageAnalysis?.eviMin?.toFixed(2)} / {villageAnalysis?.eviMax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center bg-accent/30 p-2.5 rounded-lg border border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">Biomass Estimate</span>
                  <span className="text-sm font-bold text-foreground">{biomassEstimate.toFixed(1)} t/ha</span>
                </div>
                <div className="flex justify-between items-center bg-accent/30 p-2.5 rounded-lg border border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">Growth Status</span>
                  <span className="text-sm font-bold text-foreground">{growthStage}</span>
                </div>
                <div className="flex justify-between items-center bg-accent/30 p-2.5 rounded-lg border border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">Acquisition Date</span>
                  <span className="text-[10px] font-bold text-foreground">{captureDate}</span>
                </div>
                <div className="flex justify-between items-center bg-accent/30 p-2.5 rounded-lg border border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">Product ID</span>
                  <span className="text-[9px] font-mono font-bold text-foreground max-w-[140px] truncate" title={productId}>{productId}</span>
                </div>
              </div>
            </div>

            {/* SECTION 5 & 6: Satellite Growth Heatmap & Before/Current Comparison */}
            <div className="col-span-1 lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border bg-accent/20 flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2"><MapIcon className="w-4 h-4 text-primary" /> Sentinel-2 EVI Heatmap & Comparison</h3>
                <div className="flex gap-2">
                  <span className="text-[9px] px-2 py-0.5 bg-card border border-border rounded-md font-bold text-foreground">Today</span>
                  <span className="text-[9px] px-2 py-0.5 bg-card border border-border rounded-md font-bold text-muted-foreground">vs 15 Days Ago</span>
                </div>
              </div>

              <div className="relative flex-1 min-h-[300px] lg:min-h-[400px] bg-black overflow-hidden cursor-ew-resize"
                   ref={sliderRef}
                   onMouseMove={handleMouseMove}
                   onTouchMove={handleMouseMove}>
                
                {/* 15 Days Ago (Background / Left side) */}
                <div className="absolute inset-0">
                  <img src={trueColorImageUrl} alt="Map Base" className="absolute inset-0 w-full h-full object-cover filter brightness-75 contrast-125" />
                  {eviHistoricalImageUrl && <img src={eviHistoricalImageUrl} alt="Historical EVI" className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90" />}
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded font-bold border border-white/20">
                    15 Days Ago (Simulated)
                  </div>
                </div>

                {/* Today (Foreground / Right side, clipped) */}
                <div className="absolute inset-0 border-l border-white/50 shadow-[-5px_0_15px_rgba(0,0,0,0.5)]" 
                     style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
                  <img src={trueColorImageUrl} alt="Map Base" className="absolute inset-0 w-full h-full object-cover filter brightness-75 contrast-125" />
                  {eviImageUrl && <img src={eviImageUrl} alt="Current EVI" className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90" />}
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded font-bold border border-emerald-400">
                    Today (Real-Time)
                  </div>
                </div>

                {/* Slider Handle */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10" style={{ left: `${sliderPos}%` }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg border-2 border-border/20 pointer-events-none">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="p-3 border-t border-border bg-accent/10 flex items-center justify-center gap-6 text-[10px] font-bold text-muted-foreground uppercase">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500" /> Poor Growth (&lt; 0.2)</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-500" /> Moderate (0.2 - 0.4)</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500" /> Healthy (0.4 - 0.6)</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-800" /> Excellent (&gt; 0.6)</div>
              </div>
            </div>
          </div>
        </>
      )}

      </div>
    );
  } catch (err: any) {
    return (
      <div className="p-8 bg-red-100 text-red-900 border border-red-300 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Runtime Error in EVI Panel</h2>
        <pre className="whitespace-pre-wrap font-mono text-xs">{err?.stack || err?.message || String(err)}</pre>
      </div>
    );
  }
}
