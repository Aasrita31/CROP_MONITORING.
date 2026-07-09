import React, { useMemo, useState } from 'react';
import { Droplets, Info, Map as MapIcon, CloudRain, ShieldAlert, CloudDrizzle, ChevronRight, CheckCircle2 } from 'lucide-react';

interface NdmiExplanationPanelProps {
  villageName: string;
  villageAnalysis?: any;
}

export function NdmiExplanationPanel({ villageName, villageAnalysis }: NdmiExplanationPanelProps) {
  const displayVillage = villageName || "Your Village";

  const fallbackDate = "22 June 2026";
  const fallbackProduct = "S2B_MSIL2A_20260622";
  
  // Extract real NDMI from backend, fallback to 0.35 if not yet loaded
  const ndmi = villageAnalysis?.ndmi ?? 0.35;
  const date = villageAnalysis?.captureDate ?? fallbackDate;
  const product = villageAnalysis?.copernicusMetadata?.productName ?? fallbackProduct;

  let status = "Moderate Moisture";
  let availability = 62;
  let desc = "Sufficient moisture, but monitor closely.";
  let action = "Irrigate within 3 days.";
  let baseColor = "text-green-600";
  let bgColor = "bg-green-50";
  let borderColor = "border-green-200";

  if (ndmi > 0.6) {
    status = "Good Moisture";
    availability = 88;
    desc = "Soil and canopy moisture levels are optimal.";
    action = "No irrigation needed.";
    baseColor = "text-blue-600";
    bgColor = "bg-blue-50";
    borderColor = "border-blue-200";
  } else if (ndmi < -0.2) {
    status = "Critical Stress";
    availability = 12;
    desc = "Severe drought conditions detected.";
    action = "Emergency irrigation required.";
    baseColor = "text-red-600";
    bgColor = "bg-red-50";
    borderColor = "border-red-200";
  } else if (ndmi < 0.3) {
    status = "Dry Area";
    availability = 32;
    desc = "Vegetation is showing significant water stress.";
    action = "Irrigate immediately.";
    baseColor = "text-orange-600";
    bgColor = "bg-orange-50";
    borderColor = "border-orange-200";
  }

  const data = { ndmi, status, availability, desc, action, date, product, baseColor, bgColor, borderColor };

  const bounds = villageAnalysis?.bounds;
  const rawFields = villageAnalysis?.fields || [];
  
  // Map real lat/lon polygons to SVG 0-100 viewBox
  const fields = useMemo(() => {
    if (!bounds || bounds.length !== 2) return [];
    
    const [minLat, minLon] = bounds[0];
    const [maxLat, maxLon] = bounds[1];
    
    const latDiff = maxLat - minLat;
    const lonDiff = maxLon - minLon;
    
    return rawFields.map((f: any) => {
      // Convert lat/lon coords to SVG points string
      const points = f.polygonCoords.map((coord: number[]) => {
        const lat = coord[0];
        const lon = coord[1];
        
        // SVG X is longitude (0 = minLon, 100 = maxLon)
        const x = ((lon - minLon) / lonDiff) * 100;
        // SVG Y is latitude (0 = maxLat, 100 = minLat) - map top-left origin
        const y = ((maxLat - lat) / latDiff) * 100;
        
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      }).join(' ');

      // Color logic based on actual mean_ndmi
      const ndmi = f.mean_ndmi;
      let status = "Critical";
      let colorClass = "fill-red-500/50 stroke-red-400";
      if (ndmi > 0.6) { status = "High"; colorClass = "fill-blue-500/50 stroke-blue-400"; }
      else if (ndmi > 0.3) { status = "Good"; colorClass = "fill-green-500/50 stroke-green-400"; }
      else if (ndmi > 0.0) { status = "Moderate"; colorClass = "fill-yellow-500/50 stroke-yellow-400"; }
      else if (ndmi > -0.2) { status = "Dry"; colorClass = "fill-orange-500/50 stroke-orange-400"; }

      // Estimate area just for display (approx)
      const area = (f.polygonCoords.length * 0.15).toFixed(1) + " ha";

      return { ...f, points, ndmi, status, colorClass, area };
    });
  }, [rawFields, bounds]);

  const [selectedField, setSelectedField] = useState<any>(null);
  const [expertMode, setExpertMode] = useState(false);

  return (
    <div className="bg-white text-slate-800 p-6 xl:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in duration-500 space-y-10 border border-slate-100">
      
      {/* HEADER */}
      <header className="border-b border-slate-100 pb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              <Droplets className="h-8 w-8 text-blue-500" />
              Live Moisture Distribution Map
            </h1>
            <p className="mt-2 text-lg text-slate-500">
              Generated from Sentinel-2 Bands 8 and 11 using Copernicus Data for <strong className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{displayVillage}</strong>.
            </p>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm shadow-sm flex flex-col gap-1 min-w-[200px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Date:</span>
              <span className="font-semibold">{data.date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Source:</span>
              <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200">{data.product}</span>
            </div>
          </div>
        </div>
      </header>

      {/* VILLAGE-SPECIFIC INSIGHTS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-500 mb-1">Selected Village</div>
          <div className="text-2xl font-bold text-slate-900">{displayVillage}</div>
        </div>
        
        <div className={`${data.bgColor} border ${data.borderColor} rounded-2xl p-5 shadow-sm`}>
          <div className={`text-sm font-semibold mb-1 opacity-80 ${data.baseColor}`}>Current Moisture Status</div>
          <div className={`text-2xl font-bold ${data.baseColor}`}>{data.status}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10"><Droplets className="h-24 w-24 -mr-4 -mb-4" /></div>
          <div className="text-sm font-semibold text-slate-500 mb-1">Water Availability</div>
          <div className="text-3xl font-black text-slate-800">{data.availability}%</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-white">
          <div className="text-sm font-semibold text-slate-400 mb-1">Recommended Action</div>
          <div className="text-lg font-bold text-emerald-400 flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            {data.action}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* REAL VILLAGE VISUALIZATION (MAP OVERLAY) */}
        <section className="xl:col-span-2 bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner flex flex-col relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <MapIcon className="h-5 w-5 text-blue-500" /> Real-time NDMI Field Overlay
            </h2>
            <button 
              onClick={() => setExpertMode(!expertMode)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${expertMode ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
            >
              {expertMode ? "Expert Mode: ON" : "Expert Mode: OFF"}
            </button>
          </div>
          
          <div className="flex-1 relative rounded-xl overflow-hidden bg-slate-200 border border-slate-300 min-h-[400px]">
            {/* Real Sentinel-2 True Color Base Layer */}
            {villageAnalysis?.trueColorImageUrl ? (
              <img src={villageAnalysis.trueColorImageUrl} className="absolute inset-0 w-full h-full object-fill pointer-events-none opacity-40 mix-blend-luminosity" alt="Sentinel-2 Base" />
            ) : (
              <div className="absolute inset-0 bg-[url('https://api.maptiler.com/maps/hybrid/256/14/11832/7315.jpg?key=get_your_own_OpIi9ZULNHzrESv6T2vL')] bg-cover bg-center mix-blend-luminosity opacity-40"></div>
            )}
            
            {/* Real NDMI Heatmap Raster Layer */}
            {villageAnalysis?.ndmiImageUrl && (
              <img src={villageAnalysis.ndmiImageUrl} className="absolute inset-0 w-full h-full opacity-60 mix-blend-multiply object-fill pointer-events-none" alt="NDMI Overlay" />
            )}

            {/* Interactive Fields SVG - INVISIBLE BUT CLICKABLE */}
            <svg className="absolute inset-0 w-full h-full z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
              {fields.map((f: any) => (
                <polygon
                  key={f.id}
                  points={f.points}
                  className="cursor-pointer opacity-0 hover:opacity-0 fill-transparent stroke-transparent"
                  onClick={() => setSelectedField(f)}
                />
              ))}
            </svg>

            {/* Field Detail Pop-up */}
            {selectedField && (
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur shadow-xl border border-slate-200 rounded-xl p-4 w-72 animate-in fade-in slide-in-from-right-4 z-50">
                <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{selectedField.name}</h3>
                    <span className="text-xs text-slate-500">Selected Area</span>
                  </div>
                  <button onClick={() => setSelectedField(null)} className="text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-1"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                </div>
                
                {expertMode ? (
                  <div className="space-y-2 text-xs mt-3 font-mono">
                    <div className="flex justify-between text-slate-600"><span className="font-sans">Band 8 Mean</span> <span>{villageAnalysis?.b8?.toFixed(4) || "N/A"}</span></div>
                    <div className="flex justify-between text-slate-600"><span className="font-sans">Band 11 Mean</span> <span>{villageAnalysis?.b11?.toFixed(4) || "N/A"}</span></div>
                    <div className="flex justify-between text-slate-800 font-bold border-t border-slate-100 pt-1 mt-1"><span className="font-sans">NDMI Mean</span> <span>{selectedField.ndmi.toFixed(4)}</span></div>
                    <div className="flex justify-between text-slate-600"><span className="font-sans">NDMI Min</span> <span>{villageAnalysis?.ndmiMin?.toFixed(4) || "N/A"}</span></div>
                    <div className="flex justify-between text-slate-600"><span className="font-sans">NDMI Max</span> <span>{villageAnalysis?.ndmiMax?.toFixed(4) || "N/A"}</span></div>
                    <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100"><span className="font-sans">Acquisition</span> <span className="truncate max-w-[120px]">{date}</span></div>
                    <div className="flex justify-between text-slate-600"><span className="font-sans">Product ID</span> <span className="truncate max-w-[120px]" title={product}>{product}</span></div>
                    <div className="flex justify-between text-slate-600"><span className="font-sans">Cloud Cover</span> <span>{villageAnalysis?.copernicusMetadata?.cloudCover || "N/A"}</span></div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm mt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Village</span>
                      <span className="font-medium text-slate-800">{displayVillage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Water Status</span>
                      <span className={`font-semibold ${selectedField.status === 'Critical Stress' || selectedField.status === 'Dry Area' ? 'text-red-500' : 'text-blue-600'}`}>{selectedField.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">NDMI</span>
                      <span className="font-bold text-slate-800">{selectedField.ndmi.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Area</span>
                      <span className="font-medium text-slate-800">{selectedField.area}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="block text-xs text-slate-500 mb-1">Recommendation</span>
                      <span className="font-medium text-slate-800 text-xs">
                        {selectedField.status === 'Critical Stress' ? 'Emergency irrigation required.' : 
                         selectedField.status === 'Dry Area' ? 'Irrigate immediately.' : 
                         selectedField.status === 'Moderate Moisture' ? 'Irrigate within 3 days.' :
                         'No irrigation needed.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Moisture Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-xl shadow border border-slate-200 text-xs z-20">
              <div className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[10px]">Moisture Zones</div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2"><span className="text-lg leading-none">💧</span> <span className="font-medium">Very High Moisture</span></div>
                <div className="flex items-center gap-2"><span className="text-lg leading-none">🌱</span> <span className="font-medium">Healthy Moisture</span></div>
                <div className="flex items-center gap-2"><span className="text-lg leading-none">🟡</span> <span className="font-medium">Moderate Moisture</span></div>
                <div className="flex items-center gap-2"><span className="text-lg leading-none">🟠</span> <span className="font-medium">Dry Area</span></div>
                <div className="flex items-center gap-2"><span className="text-lg leading-none">🔴</span> <span className="font-medium">Severe Water Stress</span></div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-8">
          {/* DYNAMIC FARMER VISUAL */}
          <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner flex flex-col items-center justify-center text-center flex-1">
            <h2 className="text-xl font-bold mb-6 text-slate-800 w-full text-left border-b border-slate-200 pb-2">Crop Condition</h2>
            
            <div className="relative w-40 h-40 flex items-center justify-center">
              {data.ndmi > 0.3 ? (
                <div className="flex flex-col items-center animate-in zoom-in">
                  <div className="relative">
                    <CloudRain className="h-12 w-12 text-blue-400 absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce" />
                    <div className="text-emerald-500 bg-emerald-100 p-6 rounded-full shadow-lg">
                      <svg className="h-16 w-16" viewBox="0 0 24 24" fill="currentColor"><path d="M11 20A9 9 0 1 0 11 2a9 9 0 0 0 0 18z" opacity="0.3"/><path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm-1-14v4h2V8h-2zm0 6v2h2v-2h-2z" fill="none"/></svg>
                      {/* Farmer healthy paddy abstraction */}
                      <div className="absolute bottom-2 right-2 text-3xl">🌾</div>
                    </div>
                  </div>
                  <span className="mt-4 font-bold text-emerald-700">Healthy Paddy</span>
                  <span className="text-xs text-emerald-600/80">Optimal Water Intake</span>
                </div>
              ) : data.ndmi > -0.2 ? (
                <div className="flex flex-col items-center animate-in zoom-in">
                  <div className="relative">
                    <CloudDrizzle className="h-8 w-8 text-slate-400 absolute -top-6 left-1/2 -translate-x-1/2" />
                    <div className="text-yellow-600 bg-yellow-100 p-6 rounded-full shadow-md">
                      <div className="absolute bottom-2 right-2 text-3xl opacity-80">🌾</div>
                    </div>
                  </div>
                  <span className="mt-4 font-bold text-yellow-700">Moderate Water Stress</span>
                  <span className="text-xs text-yellow-600/80">Requires Attention</span>
                </div>
              ) : (
                <div className="flex flex-col items-center animate-in zoom-in">
                  <div className="relative">
                    <ShieldAlert className="h-10 w-10 text-red-500 absolute -top-8 left-1/2 -translate-x-1/2 animate-pulse" />
                    <div className="text-red-500 bg-red-100 p-6 rounded-full shadow-inner border border-red-200">
                      <div className="absolute bottom-2 right-2 text-3xl grayscale opacity-60">🌾</div>
                    </div>
                  </div>
                  <span className="mt-4 font-bold text-red-700">Severe Water Stress</span>
                  <span className="text-xs text-red-600/80">Crop Wilting Risk</span>
                </div>
              )}
            </div>
          </section>

          {/* NDMI FORMULA EXPLANTION */}
          <section className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10"><Info className="h-40 w-40" /></div>
            
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              How NDMI is Calculated
            </h2>
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">
              NDMI uses Near-Infrared (Band 8) to detect canopy density and Short-Wave Infrared (Band 11) to measure liquid water molecules in the leaves.
            </p>
            
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 font-mono text-center relative z-10 shadow-inner">
              <div className="text-blue-400 font-bold mb-2">NDMI =</div>
              <div className="flex flex-col items-center justify-center">
                <div className="border-b border-slate-600 pb-2 px-6 tracking-widest">(NIR - SWIR)</div>
                <div className="pt-2 px-6 tracking-widest">(NIR + SWIR)</div>
              </div>
            </div>
          </section>
        </div>
      </div>
      
    </div>
  );
}
