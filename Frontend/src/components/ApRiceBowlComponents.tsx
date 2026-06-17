import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon, useMap, Marker, Tooltip as LeafletTooltip, ImageOverlay } from "react-leaflet";
import { MapPin, Target, Droplets, Microscope, Sprout, Info, TrendingUp, Activity, X } from "lucide-react";
import L from "leaflet";

import { useDistricts } from "../hooks/useDistricts";
import { useVillages, useVillageFields } from "../hooks/useVillages";
import { useFieldDetails } from "../hooks/useFields";
import { useDashboard } from "../hooks/useDashboard";
import { useNDVI } from "../hooks/useNDVI";
import { useDashboardContext } from "../context/DashboardContext";

const AP_CENTER: [number, number] = [16.5, 80.6]; // Center on AP

// Helper to generate rough district polygons dynamically in frontend
const generateDistrictPolygon = (centerLat: number, centerLng: number, radius: number, seed: number) => {
  const coords: [number, number][] = [];
  const points = 8;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    // Semi-deterministic random variation based on seed and index
    const r = radius * (0.85 + Math.sin(seed + i) * 0.15);
    coords.push([centerLat + r * Math.cos(angle), centerLng + r * Math.sin(angle)]);
  }
  return coords;
};

// Colors based on crop health rules
const getNdviColor = (ndvi: number) => {
  if (ndvi >= 0.75) return "#064e3b"; // Dark Green: Very Healthy
  if (ndvi >= 0.60) return "#10b981"; // Light Green: Healthy
  if (ndvi >= 0.40) return "#eab308"; // Yellow: Moderate Stress
  if (ndvi >= 0.25) return "#f97316"; // Orange: Water/Nutrient Stress
  return "#ef4444"; // Red: High Risk
};

function MapController({ targetLat, targetLng, targetZoom }: { targetLat: number, targetLng: number, targetZoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([targetLat, targetLng], targetZoom, { duration: 1.5 });
  }, [targetLat, targetLng, targetZoom, map]);
  return null;
}

function KpiCard({ title, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-start justify-between">
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </div>
      <div className={`p-2 rounded-lg ${color.bg} ${color.text}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

export function ApRiceBowlSection() {
  const [mapTarget, setMapTarget] = useState({ lat: AP_CENTER[0], lng: AP_CENTER[1], zoom: 6.5 });
  const [selectedVillageId, setSelectedVillageId] = useState<number | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Consume live backend hooks
  const { districts } = useDistricts();
  const { villages } = useVillages();
  const { fields: villageFields } = useVillageFields(selectedVillageId);
  const { field: fieldDetail, health: fieldHealth } = useFieldDetails(selectedFieldId);
  const { riceBowlIndex, alerts, comparison, loading: dashLoading } = useDashboard();
  const { searchCoords, searchQuery, villageAnalysis } = useDashboardContext();

  // Listen to dashboard search coordinates to sync bottom map
  useEffect(() => {
    if (searchCoords) {
      setMapTarget({ lat: searchCoords[0], lng: searchCoords[1], zoom: 13 });
      
      const matchedVillage = villages.find(
        v => v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             searchQuery.toLowerCase().includes(v.name.toLowerCase())
      );
      if (matchedVillage) {
        setSelectedVillageId(matchedVillage.id);
      } else {
        setSelectedVillageId(null);
      }
      setSelectedFieldId(null);
    }
  }, [searchCoords, searchQuery, villages]);

  // Find active village object
  const activeVillage = villages.find(v => v.id === selectedVillageId);

  const handleDistrictClick = (d: any) => {
    setMapTarget({ lat: d.lat, lng: d.lng, zoom: 9 });
    setSelectedVillageId(null);
    setSelectedFieldId(null);
  };

  const handleVillageClick = (v: any) => {
    setMapTarget({ lat: v.lat, lng: v.lng, zoom: 13 });
    setSelectedVillageId(v.id);
    setSelectedFieldId(null);
  };

  const resetView = () => {
    setMapTarget({ lat: AP_CENTER[0], lng: AP_CENTER[1], zoom: 6.5 });
    setSelectedVillageId(null);
    setSelectedFieldId(null);
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary" />
          Andhra Pradesh Rice Bowl Intelligence
        </h2>
        <p className="text-muted-foreground mt-2">Dedicated digital twin for paddy monitoring using satellite NDVI analysis.</p>
      </div>

      {/* Top KPIs connected to GET /api/dashboard/rice-bowl-index */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard 
          title="Rice Bowl Health Index" 
          value={villageAnalysis ? `${villageAnalysis.healthScore}/100` : (riceBowlIndex?.rice_bowl_health_index || "76/100")} 
          sub={villageAnalysis ? `Analysis for ${searchQuery}` : "Statewide average"} 
          icon={Activity} 
          color={{bg: 'bg-primary/10', text: 'text-primary'}} 
        />
        <KpiCard 
          title="Average NDVI" 
          value={villageAnalysis ? villageAnalysis.ndvi.toString() : (riceBowlIndex?.average_ndvi || "0.68")} 
          sub={villageAnalysis ? `Analyzed canopy density` : "Healthy Canopy"} 
          icon={Sprout} 
          color={{bg: 'bg-emerald-500/10', text: 'text-emerald-500'}} 
        />
        <KpiCard 
          title={villageAnalysis ? "Water Stress Index" : "Healthy Area"} 
          value={villageAnalysis ? `${villageAnalysis.waterStress}%` : (riceBowlIndex?.healthy_area || "1.2M ha")} 
          sub={villageAnalysis ? "Crop moisture stress" : "72% of total paddy"} 
          icon={Target} 
          color={{bg: 'bg-emerald-500/10', text: 'text-emerald-500'}} 
        />
        <KpiCard 
          title="Disease Risk Area" 
          value={villageAnalysis ? `${villageAnalysis.diseaseRisk}%` : (riceBowlIndex?.disease_risk_area || "140k ha")} 
          sub={villageAnalysis ? "Disease Risk probability" : "Critical attention needed"} 
          icon={Microscope} 
          color={{bg: 'bg-red-500/10', text: 'text-red-500'}} 
        />
        <KpiCard 
          title="Expected Yield" 
          value={villageAnalysis ? `${villageAnalysis.yieldPrediction} t/ha` : (riceBowlIndex?.expected_yield || "6.4M tons")} 
          sub={villageAnalysis ? "Average yield prediction" : "Kharif Season Forecast"} 
          icon={TrendingUp} 
          color={{bg: 'bg-blue-500/10', text: 'text-blue-500'}} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2 relative h-[550px] bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <MapContainer 
            center={AP_CENTER} 
            zoom={6.5} 
            className="h-full w-full animate-in fade-in"
            zoomControl={false}
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
            {searchCoords && villageAnalysis?.imageUrl && (
              <ImageOverlay
                url={villageAnalysis.imageUrl}
                bounds={[
                  [searchCoords[0] - 0.015, searchCoords[1] - 0.015],
                  [searchCoords[0] + 0.015, searchCoords[1] + 0.015]
                ]}
                opacity={0.8}
              />
            )}
            <MapController targetLat={mapTarget.lat} targetLng={mapTarget.lng} targetZoom={mapTarget.zoom} />

            {/* Render Districts (visible when zoomed out) */}
            {mapTarget.zoom < 11 && districts.map(d => {
              const poly = generateDistrictPolygon(d.lat, d.lng, 0.45, d.id);
              return (
                <Polygon 
                  key={d.id} 
                  positions={poly} 
                  pathOptions={{ color: d.color, weight: 2.5, fillColor: d.color, fillOpacity: 0.25 }}
                  eventHandlers={{ click: () => handleDistrictClick(d) }}
                >
                  <LeafletTooltip direction="top" opacity={1} className="custom-tooltip">
                    <div className="font-bold text-sm">{d.name} District</div>
                    <div className="text-xs">Yield Prediction: {d.yield_prediction}</div>
                    <div className="text-xs text-muted-foreground">Click to zoom</div>
                  </LeafletTooltip>
                </Polygon>
              );
            })}

            {/* Render Villages (Markers when zoomed out, Fields when zoomed in) */}
            {villages.map(v => (
              <React.Fragment key={v.id}>
                {mapTarget.zoom < 11.5 ? (
                  <Marker 
                    position={[v.lat, v.lng]} 
                    icon={L.divIcon({
                      html: `<div class="h-4.5 w-4.5 rounded-full border-2 border-white shadow-xl flex items-center justify-center animate-pulse" style="background-color: ${getNdviColor(v.ndvi)}"></div>`,
                      className: 'bg-transparent'
                    })}
                    eventHandlers={{ click: () => handleVillageClick(v) }}
                  >
                    <LeafletTooltip direction="top">
                      <div className="font-bold text-sm">{v.name}</div>
                      <div className="text-xs font-semibold">NDVI Score: {v.ndvi}</div>
                      <div className="text-[10px] text-muted-foreground">Click to inspect fields</div>
                    </LeafletTooltip>
                  </Marker>
                ) : (
                  // Render detailed fields if zoomed in and matching selected village
                  v.id === selectedVillageId && villageFields.map(f => (
                    <Polygon 
                      key={f.id}
                      positions={f.coordinates}
                      pathOptions={{ 
                        color: selectedFieldId === f.id ? '#ffffff' : '#475569', 
                        weight: selectedFieldId === f.id ? 3 : 1, 
                        fillColor: f.color, 
                        fillOpacity: selectedFieldId === f.id ? 0.85 : 0.65 
                      }}
                      eventHandlers={{ click: () => setSelectedFieldId(f.id) }}
                    />
                  ))
                )}
              </React.Fragment>
            ))}
          </MapContainer>

          {/* Map Scale Legends */}
          <div className="absolute bottom-4 left-4 z-[400] bg-card/90 backdrop-blur p-4 rounded-xl border border-border shadow-lg">
            <div className="text-xs font-bold uppercase mb-2">NDVI Crop Health Scale</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 text-xs"><div className="w-3.5 h-3.5 rounded-full bg-[#064e3b]"></div> &gt; 0.75 (Very Healthy)</div>
              <div className="flex items-center gap-2.5 text-xs"><div className="w-3.5 h-3.5 rounded-full bg-[#10b981]"></div> 0.60 - 0.75 (Healthy)</div>
              <div className="flex items-center gap-2.5 text-xs"><div className="w-3.5 h-3.5 rounded-full bg-[#eab308]"></div> 0.40 - 0.60 (Moderate Stress)</div>
              <div className="flex items-center gap-2.5 text-xs"><div className="w-3.5 h-3.5 rounded-full bg-[#f97316]"></div> 0.25 - 0.40 (Water Stress)</div>
              <div className="flex items-center gap-2.5 text-xs"><div className="w-3.5 h-3.5 rounded-full bg-[#ef4444]"></div> &lt; 0.25 (High Risk)</div>
            </div>
            {mapTarget.zoom > 7 && (
              <button 
                onClick={resetView}
                className="mt-3.5 w-full text-xs font-semibold bg-secondary text-secondary-foreground py-1.5 rounded hover:bg-secondary/80 transition"
              >
                Reset View
              </button>
            )}
          </div>

          {/* Field Details Drawer (Click Field -> Load Analytics via GET /api/fields/{id}/health) */}
          {selectedFieldId && fieldDetail && (
            <div className="absolute top-4 right-4 z-[500] w-72 bg-card/95 backdrop-blur border border-border rounded-2xl shadow-xl animate-in slide-in-from-right-8 p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[10px] font-bold uppercase text-primary tracking-wider">Field Diagnostics</div>
                  <div className="font-bold text-base">{fieldDetail.name.split(' — ')[0]}</div>
                  <div className="text-xs text-muted-foreground">{activeVillage?.name} Village</div>
                </div>
                <button onClick={() => setSelectedFieldId(null)} className="p-1 hover:bg-accent rounded-full transition"><X className="h-4 w-4" /></button>
              </div>
              
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-border">
                  <span className="text-muted-foreground text-xs">Current NDVI</span>
                  <span className="font-bold text-base" style={{ color: fieldDetail.color }}>{fieldDetail.ndvi}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border">
                  <span className="text-muted-foreground text-xs">Health Score</span>
                  <span className="font-semibold text-emerald-500">{fieldDetail.health_score}/100</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border">
                  <span className="text-muted-foreground text-xs">Status</span>
                  <span className="font-medium">{fieldDetail.status}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border">
                  <span className="text-muted-foreground text-xs">Paddy Area</span>
                  <span className="font-medium">{fieldDetail.area} ha</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border">
                  <span className="text-muted-foreground text-xs">Growth Stage</span>
                  <span className="font-medium">{fieldDetail.growth_stage}</span>
                </div>
                
                {fieldHealth?.npk && (
                  <div className="py-2 border-b border-border">
                    <span className="text-muted-foreground text-xs block mb-1">NPK Telemetry Readings</span>
                    <div className="flex gap-4 text-xs font-bold">
                      <span className="text-emerald-500">N: {fieldHealth.npk.n}</span>
                      <span className="text-yellow-500">P: {fieldHealth.npk.p}</span>
                      <span className="text-blue-500">K: {fieldHealth.npk.k}</span>
                    </div>
                  </div>
                )}
                
                <div className="mt-3.5 bg-primary/5 p-3 rounded-lg border border-primary/15">
                  <div className="text-xs font-bold text-primary mb-1">AI Crop Recommendation</div>
                  <div className="text-xs leading-normal">{fieldDetail.recommendation}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Warnings & Advisories panel connected to GET /api/dashboard/alerts */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Info className="h-5 w-5 text-primary" /> Active Paddy Alerts</h3>
            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">No active alerts reported.</div>
              ) : (
                alerts.map(a => (
                  <div key={a.id} className="p-3 bg-accent/40 rounded-xl border border-border flex items-start gap-2.5">
                    <div className={`mt-0.5 w-2 h-2 rounded-full ${a.severity === 'alert' ? 'bg-red-500' : (a.severity === 'warn' ? 'bg-yellow-500' : 'bg-blue-500')}`} />
                    <div className="flex-1">
                      <div className="text-xs font-bold">{a.title}</div>
                      <div className="text-[11px] text-muted-foreground leading-normal mt-0.5">{a.message}</div>
                      <div className="text-[9px] text-muted-foreground/60 mt-1">{a.date}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-card to-accent border border-border p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-2"><Info className="h-5 w-5 text-blue-500" /> What is NDVI?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              The Normalized Difference Vegetation Index measures chlorophyll density using near-infrared and red light reflectance. Paddy fields exhibit highest NDVI during flowering and grain-filling stages.
            </p>
            <div className="bg-background border border-border p-3 rounded-xl font-mono text-center text-xs font-semibold shadow-inner">
              NDVI = (NIR - Red) / (NIR + Red)
            </div>
          </div>
        </div>
      </div>


      {/* District Rankings Table connected to GET /api/districts */}
      <div className="mt-6 bg-gradient-to-br from-card to-accent/30 border border-border p-5 rounded-2xl shadow-sm">
        <h3 className="font-bold mb-4 text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary"/> District Rankings (Yield & Risk)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-background/80 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="p-3 rounded-tl-lg">District</th>
                <th className="p-3">Total Area</th>
                <th className="p-3">Yield Prediction</th>
                <th className="p-3 rounded-tr-lg">Risk Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {districts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs text-muted-foreground">Loading district rankings...</td>
                </tr>
              ) : (
                districts.map(d => (
                  <tr key={d.id} className="hover:bg-accent/40 transition cursor-pointer" onClick={() => handleDistrictClick(d)}>
                    <td className="p-3 font-semibold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></span>
                      {d.name}
                    </td>
                    <td className="p-3 text-muted-foreground">{d.area}</td>
                    <td className="p-3 font-bold text-emerald-500">{d.yield_prediction}</td>
                    <td className={`p-3 font-medium ${d.risk.includes('High') || d.risk.includes('Severe') ? 'text-red-500' : 'text-foreground'}`}>{d.risk}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
