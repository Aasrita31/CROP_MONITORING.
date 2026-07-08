import React, { useEffect, useState, useMemo } from 'react';
import { Leaf, Sun, Droplets, AlertTriangle, ArrowRight, Map as MapIcon, Satellite } from 'lucide-react';

interface NdviExplanationPanelProps {
  villageName: string;
  villageAnalysis?: any;
}

export function NdviExplanationPanel({ villageName, villageAnalysis }: NdviExplanationPanelProps) {
  const defaultVillage = "Kadiyam";
  const displayVillage = villageName || defaultVillage;

  const hasData = !!villageAnalysis;

  // Use real values from Copernicus backend if available, otherwise null
  const red = hasData ? villageAnalysis.b4 : null;
  const nir = hasData ? villageAnalysis.b8 : null;
  const ndviRaw = hasData ? villageAnalysis.ndvi : null;
  const ndvi = ndviRaw !== null ? parseFloat(ndviRaw.toFixed(2)) : null;
  
  const status = !hasData ? "Awaiting Data" : ndvi >= 0.6 ? "Healthy" : ndvi >= 0.4 ? "Moderate Stress" : "Poor Health";
  const desc = !hasData 
    ? "Search and select a village to analyze crop health."
    : ndvi >= 0.6 
      ? "Your crop is growing normally and vegetation density is good." 
      : ndvi >= 0.4 
        ? "Vegetation is showing signs of water stress or early decline." 
        : "Sparse vegetation or severe stress detected in satellite imagery.";
  const action = !hasData 
    ? "Initiate a satellite scan to retrieve NDVI."
    : ndvi >= 0.6 
      ? "Continue current management practices." 
      : ndvi >= 0.4 
        ? "Increase irrigation and monitor closely." 
        : "Immediate field inspection required to identify the issue.";
      
  const date = hasData ? villageAnalysis.captureDate : "---";
  const product = hasData && villageAnalysis.copernicusMetadata ? villageAnalysis.copernicusMetadata.productName : "---";

  const data = { red, nir, status, desc, action, date, product };

  // Determine colors based on NDVI
  const getColor = (val: number | null) => {
    if (val === null) return "bg-slate-500 text-slate-50";
    if (val >= 0.8) return "bg-emerald-600 text-emerald-50";
    if (val >= 0.6) return "bg-green-500 text-green-50";
    if (val >= 0.4) return "bg-yellow-500 text-yellow-50";
    if (val >= 0.2) return "bg-orange-500 text-orange-50";
    return "bg-red-500 text-red-50";
  };

  const getTextColor = (val: number) => {
    if (val >= 0.8) return "text-emerald-600";
    if (val >= 0.6) return "text-green-500";
    if (val >= 0.4) return "text-yellow-600";
    if (val >= 0.2) return "text-orange-500";
    return "text-red-500";
  };

  // State for step-by-step formula animation
  const [calcStep, setCalcStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCalcStep((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white text-slate-800 p-6 xl:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in duration-500 space-y-10 border border-slate-100">
      
      {/* SECTION 1: TITLE */}
      <header className="border-b border-slate-100 pb-6 text-center xl:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center xl:justify-start gap-3">
          <Leaf className="h-8 w-8 text-emerald-500" />
          How Crop Health is Measured from Space
        </h1>
        <p className="mt-3 text-lg text-slate-500 max-w-3xl">
          Real Sentinel-2 satellite imagery is used to measure vegetation health for <strong className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{displayVillage}</strong>.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECTION 2: SENTINEL-2 VISUAL EXPLANATION */}
        <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner relative overflow-hidden group">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Sun className="h-5 w-5 text-amber-500" /> Satellite Light Interaction
          </h2>
          
          <div className="relative h-64 w-full bg-white rounded-xl border border-slate-100 flex items-end justify-center pb-4">
            {/* Sun */}
            <div className="absolute top-4 left-4 flex flex-col items-center">
              <Sun className="h-10 w-10 text-amber-400 animate-[spin_10s_linear_infinite]" />
              <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Sunlight</span>
            </div>

            {/* Satellite */}
            <div className="absolute top-4 right-4 flex flex-col items-center">
              <Satellite className="h-8 w-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Sentinel-2</span>
            </div>

            {/* Light Rays */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              {/* Sun to Plant (Red) */}
              <line x1="15%" y1="20%" x2="48%" y2="60%" stroke="#ef4444" strokeWidth="2" strokeDasharray="4" className="animate-[dash_1s_linear_infinite]" opacity="0.6" />
              {/* Sun to Plant (NIR) */}
              <line x1="18%" y1="20%" x2="52%" y2="60%" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4" className="animate-[dash_1s_linear_infinite]" opacity="0.6" />
              
              {/* Plant to Satellite (Red - absorbed mostly, thin line) */}
              <line x1="50%" y1="65%" x2="85%" y2="20%" stroke="#ef4444" strokeWidth={ndvi > 0.4 ? "1" : "3"} strokeDasharray="4" className="animate-[dash_1.5s_linear_infinite]" opacity="0.4" />
              {/* Plant to Satellite (NIR - reflected mostly, thick line) */}
              <line x1="52%" y1="65%" x2="85%" y2="25%" stroke="#8b5cf6" strokeWidth={ndvi > 0.4 ? "4" : "1"} strokeDasharray="4" className="animate-[dash_1.5s_linear_infinite]" opacity="0.8" />
            </svg>

            {/* Plant */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="text-center mb-2">
                <div className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full mb-1 border border-red-100">
                  {ndvi > 0.4 ? "Absorbs Red" : "Reflects Red"}
                </div>
                <div className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  {ndvi > 0.4 ? "Reflects NIR" : "Absorbs NIR"}
                </div>
              </div>
              <div className={`transition-all duration-700 ${ndvi > 0.4 ? 'text-emerald-500 scale-110' : 'text-yellow-600 scale-95'}`}>
                <Leaf className="h-16 w-16" fill="currentColor" />
              </div>
              <div className="w-16 h-2 bg-amber-900 rounded-full mt-1 opacity-20"></div>
              <span className="text-sm font-semibold mt-2 text-slate-700">Paddy Plant</span>
            </div>
          </div>
        </section>

        {/* SECTION 3: LIVE SENTINEL-2 VALUES */}
        <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-800">
              <Satellite className="h-5 w-5 text-blue-500" /> Live Sentinel-2 Values
            </h2>
            <p className="text-sm text-slate-500 mb-6">Actual spectral band reflections for the current village.</p>
          </div>
          
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400 block mb-1">Selected Village</span>
                <strong className="text-slate-800 text-lg">{displayVillage}</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Acquisition Date</span>
                <strong className="text-slate-800">{data.date}</strong>
              </div>
              <div className="col-span-2 pt-3 border-t border-slate-50">
                <span className="text-slate-400 block mb-1">Sentinel-2 Product</span>
                <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{data.product}</code>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <div className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Band 4 (Red)</div>
              <div className="text-3xl font-black text-red-600 font-mono">{data.red !== null ? data.red.toFixed(2) : "---"}</div>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
              <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Band 8 (NIR)</div>
              <div className="text-3xl font-black text-purple-700 font-mono">{data.nir !== null ? data.nir.toFixed(2) : "---"}</div>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 4: NDVI FORMULA VISUALIZATION */}
      <section className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2 relative z-10">
          <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m8 17 4 4 4-4" /></svg>
          NDVI Calculation Formula
        </h2>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 font-mono relative z-10">
          {/* Formula Base */}
          <div className="flex items-center gap-4 text-2xl bg-slate-800/80 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
            <div className="font-bold text-emerald-400">NDVI</div>
            <div>=</div>
            <div className="flex flex-col items-center">
              <div className="border-b-2 border-slate-500 pb-2 px-4">(<span className="text-purple-400">NIR</span> - <span className="text-red-400">RED</span>)</div>
              <div className="pt-2 px-4">(<span className="text-purple-400">NIR</span> + <span className="text-red-400">RED</span>)</div>
            </div>
          </div>

          <ArrowRight className="h-8 w-8 text-slate-500 hidden md:block" />

          {/* Substitution (Animated) */}
          <div className="flex items-center gap-4 text-2xl bg-slate-800/80 p-6 rounded-xl border border-slate-700 backdrop-blur-sm transition-all duration-500">
            <div className="font-bold text-emerald-400">NDVI</div>
            <div>=</div>
            {!hasData ? (
              <div className="text-slate-500 font-bold">---</div>
            ) : calcStep === 0 ? (
              <div className="text-slate-500 animate-pulse">Calculating...</div>
            ) : calcStep === 1 || calcStep === 2 ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in">
                <div className="border-b-2 border-slate-500 pb-2 px-4">(<span className="text-purple-400">{data.nir!.toFixed(2)}</span> - <span className="text-red-400">{data.red!.toFixed(2)}</span>)</div>
                <div className="pt-2 px-4">(<span className="text-purple-400">{data.nir!.toFixed(2)}</span> + <span className="text-red-400">{data.red!.toFixed(2)}</span>)</div>
              </div>
            ) : calcStep === 3 ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in">
                <div className="border-b-2 border-slate-500 pb-2 px-4">{(data.nir! - data.red!).toFixed(2)}</div>
                <div className="pt-2 px-4">{(data.nir! + data.red!).toFixed(2)}</div>
              </div>
            ) : (
              <div className={`font-black text-4xl animate-in fade-in zoom-in ${getTextColor(ndvi!)} drop-shadow-md`}>
                {ndvi!.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 5: NDVI COLOR REPRESENTATION & SECTION 6: PICTORIAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner">
          <h2 className="text-xl font-bold mb-6 text-slate-800">NDVI Health Scale</h2>
          
          <div className="relative pt-8 pb-12">
            {/* Scale Bar */}
            <div className="h-4 w-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-600 shadow-inner"></div>
            
            {/* Markers */}
            <div className="absolute top-14 left-0 text-xs font-bold text-red-600 -translate-x-1/2">0.0</div>
            <div className="absolute top-14 left-1/4 text-xs font-bold text-orange-600 -translate-x-1/2">0.25</div>
            <div className="absolute top-14 left-2/4 text-xs font-bold text-yellow-600 -translate-x-1/2">0.5</div>
            <div className="absolute top-14 left-3/4 text-xs font-bold text-green-600 -translate-x-1/2">0.75</div>
            <div className="absolute top-14 left-full text-xs font-bold text-emerald-700 -translate-x-1/2">1.0</div>

            <div className="absolute top-20 left-0 text-[10px] text-slate-400 -translate-x-1/2">Poor</div>
            <div className="absolute top-20 left-[20%] text-[10px] text-slate-400 -translate-x-1/2 text-center w-16">Water Stress</div>
            <div className="absolute top-20 left-1/2 text-[10px] text-slate-400 -translate-x-1/2">Moderate</div>
            <div className="absolute top-20 left-[75%] text-[10px] text-slate-400 -translate-x-1/2">Healthy</div>
            <div className="absolute top-20 left-full text-[10px] text-slate-400 -translate-x-1/2">Excellent</div>

            {/* Current Value Indicator */}
            {hasData && (
              <div 
                className="absolute top-4 -mt-1 flex flex-col items-center transition-all duration-1000 ease-out"
                style={{ left: `${Math.max(0, Math.min(100, ndvi! * 100))}%`, transform: 'translateX(-50%)' }}
              >
                <div className="bg-slate-800 text-white text-xs font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap mb-1">
                  {displayVillage}: {ndvi!.toFixed(2)}
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-800"></div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 6: PICTORIAL REPRESENTATION */}
        <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner flex flex-col items-center justify-center text-center">
          <h2 className="text-xl font-bold mb-4 w-full text-left text-slate-800">Crop Canopy Condition</h2>
          
          <div className="flex items-center justify-center h-32 w-full">
            {!hasData ? (
              <div className="text-slate-400 font-bold text-sm">Select a village to view canopy condition</div>
            ) : ndvi! >= 0.75 ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-500">
                <div className="relative">
                   <Leaf className="h-20 w-20 text-emerald-600 drop-shadow-md" fill="currentColor" />
                   <div className="absolute -top-2 -right-2 bg-emerald-100 text-emerald-700 p-1.5 rounded-full shadow-sm"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg></div>
                </div>
                <div className="mt-4 font-bold text-emerald-700">Healthy Dense Canopy</div>
              </div>
            ) : ndvi! >= 0.4 ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-500">
                <Leaf className="h-16 w-16 text-yellow-500 drop-shadow-sm" fill="currentColor" opacity={0.8} />
                <div className="mt-4 font-bold text-yellow-700">Moderate Canopy (Yellowing)</div>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-in zoom-in duration-500">
                <div className="relative">
                  <Leaf className="h-14 w-14 text-orange-500 opacity-60" fill="currentColor" />
                  <div className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full shadow-sm animate-pulse"><AlertTriangle className="h-4 w-4" /></div>
                </div>
                <div className="mt-4 font-bold text-red-600">Stressed/Sparse Canopy</div>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SECTION 7: FARMER INTERPRETATION */}
        <section className="lg:col-span-2 bg-emerald-50 rounded-2xl p-6 border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
             <Leaf className="h-48 w-48" />
          </div>
          
          <h2 className="text-xl font-bold mb-4 text-emerald-900">Farmer Interpretation</h2>
          
          <div className="space-y-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white/60 p-4 rounded-xl border border-emerald-100/50">
              <span className="text-emerald-800 font-semibold w-32">Crop Health:</span>
              <span className={`px-3 py-1 rounded-full font-bold text-sm inline-block ${getColor(ndvi)}`}>
                {data.status}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 bg-white/60 p-4 rounded-xl border border-emerald-100/50">
              <span className="text-emerald-800 font-semibold w-32 shrink-0">What it means:</span>
              <span className="text-slate-700">{data.desc}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 bg-white/60 p-4 rounded-xl border border-emerald-100/50">
              <span className="text-emerald-800 font-semibold w-32 shrink-0">Action needed:</span>
              <span className="text-slate-800 font-bold flex items-start gap-2">
                <ArrowRight className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                {data.action}
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 8: NDVI MAP OVERLAY */}
        <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
            <MapIcon className="h-5 w-5 text-blue-500" /> Regional NDVI Map
          </h2>
          
          <div className="flex-1 relative rounded-xl overflow-hidden bg-slate-200 border border-slate-300 min-h-[200px] flex items-center justify-center group">
            {/* Real Sentinel-2 True Color Base Layer */}
            {villageAnalysis?.trueColorImageUrl ? (
              <img src={villageAnalysis.trueColorImageUrl} className="absolute inset-0 w-full h-full object-fill pointer-events-none opacity-40 mix-blend-luminosity" alt="Sentinel-2 Base" />
            ) : (
              <div className="absolute inset-0 bg-[url('https://api.maptiler.com/maps/hybrid/256/14/11832/7315.jpg?key=get_your_own_OpIi9ZULNHzrESv6T2vL')] bg-cover bg-center mix-blend-luminosity opacity-40"></div>
            )}
            
            {/* Real NDVI Heatmap Raster Layer */}
            {villageAnalysis?.imageUrl && (
              <img src={villageAnalysis.imageUrl} className="absolute inset-0 w-full h-full opacity-60 mix-blend-multiply object-fill pointer-events-none" alt="NDVI Overlay" />
            )}

            {/* Farm Polygon Simulation */}
            <svg className="absolute inset-0 w-full h-full drop-shadow-md z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
               <polygon points="20,20 80,30 70,80 30,70" fill="transparent" stroke="white" strokeWidth="1" strokeDasharray="2" className="opacity-80" />
               <circle cx="50" cy="50" r="3" fill="white" className="animate-pulse" />
            </svg>

            <div className="relative z-20 bg-slate-900/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium shadow border border-slate-700">
              {displayVillage} NDVI Layer
            </div>
            
            {/* Mini Legend */}
            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur p-1.5 rounded shadow text-[9px] flex flex-col gap-1 z-20 border border-slate-200">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-sm"></div> Healthy</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-400 rounded-sm"></div> Moderate</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-sm"></div> Stress</div>
            </div>
          </div>
        </section>
      </div>
      
    </div>
  );
}
