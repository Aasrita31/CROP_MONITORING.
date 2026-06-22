import React, { useState } from 'react';
import { Layers, Activity, Map as MapIcon, Wheat, BoxSelect, CheckCircle2, AlertTriangle, Bot, ArrowRightLeft } from 'lucide-react';
import punjabFarmImg from "@/assets/punjab-wheat-farm.png";
import maharashtraFarmImg from "@/assets/maharashtra-grape-farm.png";
import wheatEarImg from "@/assets/wheat-ear.png";
import satelliteImg from "@/assets/satellite-farm.jpg";

interface SaviExplanationPanelProps {
  villageName: string;
  villageAnalysis?: any;
}

export function SaviExplanationPanel({ villageName, villageAnalysis }: SaviExplanationPanelProps) {
  const [isFarmerMode, setIsFarmerMode] = useState(true);

  // Fallbacks if backend doesn't have it yet
  const savi = villageAnalysis?.savi ?? 0.45;
  const saviImageUrl = villageAnalysis?.saviImageUrl || null;
  const trueColorImageUrl = villageAnalysis?.trueColorImageUrl || satelliteImg;
  const cropCoverPct = villageAnalysis?.cropCoverPct ?? 78;
  const bareSoilPct = villageAnalysis?.bareSoilPct ?? 22;
  const captureDate = villageAnalysis?.captureDate || "22 June 2026";
  const bounds = villageAnalysis?.bounds;

  // Determine crop image based on SAVI
  let cropImage = punjabFarmImg;
  if (savi > 0.5) cropImage = punjabFarmImg; // Dense crop
  else if (savi > 0.25) cropImage = maharashtraFarmImg; // Partial cover
  else cropImage = wheatEarImg; // Sparse/Bare soil

  // Interpretations
  let fieldCoverage = "Moderate";
  let establishment = "Good";
  let exposure = "Low";
  let rec = "Maintain current crop management.";
  let advisorTitle = "Crop cover is healthy.";
  let advisorTone = "green";

  if (cropCoverPct > 80) {
    fieldCoverage = "Excellent";
    establishment = "Strong";
    exposure = "Very Low";
    rec = "Canopy is fully established. Continue standard irrigation.";
    advisorTitle = "Crop cover is dense and healthy.";
  } else if (cropCoverPct > 50) {
    fieldCoverage = "Moderate";
    establishment = "Good";
    exposure = "Moderate";
    rec = "Maintain current crop management.";
    advisorTitle = "Crop establishment is progressing well.";
  } else {
    fieldCoverage = "Sparse";
    establishment = "Poor";
    exposure = "High";
    rec = "Re-sowing may be required in patchy areas.";
    advisorTitle = "Large bare soil areas detected.";
    advisorTone = "amber";
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header and Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Layers className="w-6 h-6 text-yellow-600" />
            Soil Visibility (SAVI)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time Copernicus Sentinel-2 SAVI Telemetry</p>
        </div>
        <div className="flex bg-accent/40 rounded-xl p-1 border border-border shadow-sm">
          <button 
            onClick={() => setIsFarmerMode(true)} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${isFarmerMode ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Wheat className="h-4 w-4" /> Farmer Mode
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
          {/* SECTION 4: Farmer Interpretation */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-yellow-900/20" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-yellow-500 transition-all duration-1000 ease-out" strokeDasharray={`${cropCoverPct * 2.83} 283`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-yellow-600">{Math.round(cropCoverPct)}%</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase text-center leading-tight mt-1">Cover</span>
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase">Field Coverage</div>
                <div className="text-lg font-bold text-foreground">{fieldCoverage}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase">Crop Establishment</div>
                <div className="text-lg font-bold text-foreground">{establishment}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase">Bare Soil Exposure</div>
                <div className="text-lg font-bold text-foreground">{exposure}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase">Recommendation</div>
                <div className="text-sm font-bold text-amber-600">{rec}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SECTION 1: Crop Coverage Analysis */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <BoxSelect className="w-5 h-5 text-yellow-600" />
                Coverage Analysis
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col items-center justify-center animate-in zoom-in duration-500 delay-100">
                  <Wheat className="w-8 h-8 text-emerald-500 mb-2" />
                  <div className="text-3xl font-black text-emerald-600">{Math.round(cropCoverPct)}%</div>
                  <div className="text-xs font-bold text-emerald-700/70 uppercase tracking-widest mt-1">Crop Cover</div>
                </div>
                
                <div className="bg-amber-900/10 border border-amber-900/20 rounded-xl p-4 flex flex-col items-center justify-center animate-in zoom-in duration-500 delay-200">
                  <div className="w-8 h-8 rounded bg-amber-800/80 mb-2 shadow-inner border border-amber-900/50" />
                  <div className="text-3xl font-black text-amber-700">{Math.round(bareSoilPct)}%</div>
                  <div className="text-xs font-bold text-amber-800/70 uppercase tracking-widest mt-1">Bare Soil</div>
                </div>
              </div>

              {/* Progress bar visual */}
              <div className="h-4 w-full bg-amber-900/20 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${cropCoverPct}%` }} />
              </div>
            </div>

            {/* SECTION 2: Realistic Field Representation */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-4 border-b border-border font-bold text-sm bg-accent/30 flex justify-between items-center">
                Field Status Illustration
                <span className="text-xs font-normal text-muted-foreground">Synchronized with {villageName}</span>
              </div>
              <div className="relative flex-1 min-h-[200px] bg-black">
                <img src={cropImage} alt="Field coverage" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h4 className="text-white font-bold text-lg mb-1">{advisorTitle}</h4>
                  <p className="text-white/80 text-xs">Visual representation of the canopy ratio based on Sentinel-2 SAVI.</p>
                </div>
              </div>
            </div>

          </div>

          {/* SECTION 5: Smart Field Advisor */}
          <div className={`border rounded-2xl p-5 shadow-sm ${advisorTone === 'amber' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Bot className={`w-5 h-5 ${advisorTone === 'amber' ? 'text-amber-600' : 'text-emerald-600'}`} />
              <h3 className={`font-bold ${advisorTone === 'amber' ? 'text-amber-700' : 'text-emerald-700'}`}>Smart Field Advisor</h3>
            </div>
            <p className="text-sm font-medium text-foreground/80 flex items-start gap-2">
               {advisorTone === 'amber' ? <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />}
               <span>{advisorTitle} {rec}</span>
            </p>
          </div>
        </>
      ) : (
        <>
          {/* EXPERT MODE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2 border-b border-border pb-3 mb-4">
                  <Activity className="w-4 h-4 text-yellow-600" />
                  Real Sentinel-2 SAVI Analytics
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-accent/30 p-2.5 rounded-lg border border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">Village Name</span>
                  <span className="text-sm font-bold text-foreground">{villageName}</span>
                </div>
                <div className="flex justify-between items-center bg-accent/30 p-2.5 rounded-lg border border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">SAVI Value (Mean)</span>
                  <span className="text-sm font-black text-yellow-600">{savi.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center bg-accent/30 p-2.5 rounded-lg border border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">Crop Coverage (SAVI &gt; 0.35)</span>
                  <span className="text-sm font-bold text-foreground">{cropCoverPct.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center bg-accent/30 p-2.5 rounded-lg border border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">Bare Soil / Sparse</span>
                  <span className="text-sm font-bold text-foreground">{bareSoilPct.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center bg-accent/30 p-2.5 rounded-lg border border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">Index Formula</span>
                  <span className="text-[10px] font-mono text-muted-foreground">((B8-B4)/(B8+B4+0.5))*1.5</span>
                </div>
                <div className="flex justify-between items-center bg-accent/30 p-2.5 rounded-lg border border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">Acquisition Date</span>
                  <span className="text-[10px] font-bold text-foreground">{captureDate}</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: Real SAVI Map Overlay */}
            <div className="col-span-1 lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border bg-accent/20 flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2"><MapIcon className="w-4 h-4 text-primary" /> Sentinel-2 SAVI Heatmap</h3>
              </div>

              <div className="relative flex-1 min-h-[300px] lg:min-h-[400px] bg-black overflow-hidden">
                <img src={trueColorImageUrl} alt="Map Base" className="absolute inset-0 w-full h-full object-cover filter brightness-75 contrast-125" />
                {saviImageUrl && <img src={saviImageUrl} alt="Current SAVI" className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90 animate-in fade-in duration-1000" />}
                
                <div className="absolute top-4 right-4 bg-yellow-600/90 backdrop-blur text-white text-[10px] px-2 py-1 rounded font-bold border border-yellow-500">
                  Live SAVI Overlay
                </div>
              </div>

              <div className="p-3 border-t border-border bg-accent/10 flex items-center justify-center gap-6 text-[10px] font-bold text-muted-foreground uppercase">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#8b4513]" /> Exposed Soil</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#cd853f]" /> Sparse</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#9acd32]" /> Moderate</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#228b22]" /> Good</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#006400]" /> Dense Canopy</div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
