import React, { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, Circle, SVGOverlay, ImageOverlay } from "react-leaflet";
import { Search, Leaf, X, Layers, Target, Droplets, FlaskConical, Sprout, TrendingUp, Calendar, Activity, Bot, ChevronRight, ChevronLeft, MapPin, CheckCircle2, AlertTriangle, AlertCircle, Skull, Bug } from "lucide-react";
import satelliteImg from "@/assets/satellite-farm.jpg";
import { useApp } from "@/context/AppContext";
import { useDashboardContext } from "../context/DashboardContext";

function MapSearchBox({ 
  onSelectLocation, 
  theme = "dark" 
}: { 
  onSelectLocation: (lat: number, lon: number, name: string) => void,
  theme?: "dark" | "light"
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsLoading(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (e) {
          console.error(e);
        }
        setIsLoading(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelect = (s: any) => {
    setSearchQuery(s.display_name);
    setShowSuggestions(false);
    onSelectLocation(parseFloat(s.lat), parseFloat(s.lon), s.display_name);
  };

  const isDark = theme === "dark";

  return (
    <div className={`relative flex flex-col w-full ${isDark ? 'bg-[#0b0e14] border-white/10' : 'bg-card/90 backdrop-blur border-border'} border rounded-lg shadow-lg pointer-events-auto transition-all`}>
      <div className="flex items-center gap-2 h-12 px-3">
        <Leaf className={`h-5 w-5 ${isDark ? 'text-[#84cc16]' : 'text-primary'}`} />
        <input 
          placeholder="Search location..." 
          className={`flex-1 bg-transparent text-sm ${isDark ? 'text-white' : 'text-foreground'} outline-none`}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {searchQuery && (
          <button onClick={() => {setSearchQuery(""); setSuggestions([]); setShowSuggestions(false);}} className={`p-1 ${isDark ? 'hover:bg-white/10' : 'hover:bg-accent'} rounded transition`}>
             <X className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-muted-foreground'}`} />
          </button>
        )}
        <button className="p-1">
          {isLoading ? <span className={`h-4 w-4 block animate-spin rounded-full border-2 ${isDark ? 'border-white/50' : 'border-primary'} border-t-transparent`} /> : <Search className={`h-4 w-4 ${isDark ? 'text-white/50' : 'text-muted-foreground'}`} />}
        </button>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className={`flex flex-col border-t ${isDark ? 'border-white/10' : 'border-border'} py-2 max-h-60 overflow-y-auto`}>
          {suggestions.map((s, i) => (
            <button 
              key={i}
              className={`text-left px-4 py-2 text-sm ${isDark ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-muted-foreground hover:bg-accent hover:text-foreground'} transition line-clamp-2 leading-tight`}
              onClick={() => handleSelect(s)}
            >
              {s.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import L from "leaflet";

// Fix standard marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.5 });
  }, [center, map]);
  return null;
}

export function BackgroundMap({ center }: { center: [number, number] }) {
  return (
    <MapContainer 
      key={center.join(',')} 
      center={center} 
      zoom={15} 
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      boxZoom={false}
      keyboard={false}
      touchZoom={false}
      className="w-full h-full"
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
      />
    </MapContainer>
  );
}

export function DashboardInteractiveMap({ 
  center, 
  fields, 
  onFieldClick 
}: { 
  center: [number, number], 
  fields: any[],
  onFieldClick: (id: string) => void
}) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [activeLayer, setActiveLayer] = useState<string>("satellite");
  const [timeLine, setTimeLine] = useState<number>(100);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const { highlightedFields } = useApp();
  const { searchCoords, searchQuery, villageAnalysis } = useDashboardContext();

  // Helper to enrich fields with polygons
  const enrichFields = (rawFields: any[], cCenter: [number, number]) => {
    return (rawFields || []).map(f => {
      if (f.polygonCoords) return f;
      if (f.coordinates) {
        return { 
          ...f, 
          lat: f.coordinates[0][0], 
          lng: f.coordinates[0][1], 
          polygonCoords: f.coordinates,
          hotspots: [] 
        };
      }
      const fLat = cCenter[0] + ((f.y || 50) - 50) * 0.0005;
      const fLng = cCenter[1] + ((f.x || 50) - 50) * 0.0005;
      
      const numPoints = 6 + Math.floor(Math.random() * 4);
      const radius = 0.0015 + Math.random() * 0.001;
      const coords: [number, number][] = [];
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const r = radius * (0.8 + Math.random() * 0.4);
        coords.push([fLat + r * Math.cos(angle), fLng + r * Math.sin(angle)]);
      }

      const hotspots = [];
      const mixes = Object.entries(f.mix || { healthy: 60, water: 20, disease: 20 });
      for (const [key, val] of mixes) {
        if (key !== "healthy" && (val as number) > 5) {
          hotspots.push({
            type: key,
            lat: fLat + (Math.random() - 0.5) * radius * 0.8,
            lng: fLng + (Math.random() - 0.5) * radius * 0.8,
            radius: ((val as number) / 100) * radius * 0.7 * 111320
          });
        }
      }

      return { ...f, lat: fLat, lng: fLng, polygonCoords: coords, hotspots };
    });
  };

  const [dynamicFields, setDynamicFields] = useState<any[]>(() => enrichFields(fields, center));

  // Sync prop center/fields with local state when they change
  useEffect(() => {
    setMapCenter(center);
    setDynamicFields(enrichFields(fields, center));
  }, [center, fields]);

  const handleLocationSelect = async (lat: number, lon: number, name: string) => {
    setMapCenter([lat, lon]);
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 14, { duration: 1.5 });
    }

    try {
      // Fetch REAL crop boundary polygons extracted via OpenCV from Sentinel-2
      const res = await fetch(`http://127.0.0.1:8000/api/satellite/fields?latitude=${lat}&longitude=${lon}`);
      const realPolygons = await res.json();
      
      const realFields = realPolygons.map((poly: any, i: number) => {
        // Map true physical NDVI to our health scoring model
        const healthScore = Math.min(100, Math.max(0, poly.mean_ndvi * 100 + 15));
        
        let dom = "healthy";
        let condition = "Healthy Paddy";
        let rec = "Crop growth is healthy. Continue current irrigation schedule.";
        
        if (healthScore < 40) {
          dom = "disease";
          condition = "Critical Vegetation Loss";
          rec = "High vegetation stress detected. Immediate field inspection recommended.";
        } else if (healthScore < 60) {
          dom = "water";
          condition = "Water Deficit";
          rec = "Possible water stress detected. Monitor irrigation over the next 5 days.";
        } else if (healthScore < 75) {
          dom = "nutrient";
          condition = "Moderate Stress";
          rec = "Crop growth is slowing. Inspect irrigation and nutrient availability.";
        }

        return {
          id: poly.id,
          name: `${name.split(',')[0]} ${poly.name}`,
          lat: poly.polygonCoords[0][0],
          lng: poly.polygonCoords[0][1],
          polygonCoords: poly.polygonCoords,
          hotspots: [],
          dominant: dom,
          health: Math.floor(healthScore),
          condition: condition,
          rec: rec,
          area: `${(Math.random() * 5 + 1).toFixed(1)} Hectares`,
          surveyNo: `SUR-${1000 + Math.floor(Math.random() * 9000)}`,
          village: name.split(',')[0],
          aiConfidence: `${Math.floor(88 + Math.random() * 10)}%`,
          lastScan: new Date().toLocaleDateString(),
          disease: dom === 'disease' ? Math.floor(60 + Math.random() * 30) : Math.floor(Math.random() * 15),
          water: dom === 'water' ? Math.floor(60 + Math.random() * 30) : Math.floor(Math.random() * 20),
          stage: "Vegetative",
          yield: (1.0 + (healthScore / 100) * 6.5).toFixed(1),
          harvestIn: Math.floor(Math.random() * 60 + 10),
          npk: { n: 60 + Math.random()*30, p: 50 + Math.random()*30, k: 50 + Math.random()*30 }
        };
      });
      
      // Replace old simulated/real search fields, keep district base fields
      setDynamicFields(prev => [...prev.filter(f => !f.id.startsWith('sim-') && !f.id.startsWith('real-plot-')), ...realFields]);
    } catch (e) {
      console.error("Failed to load real polygons:", e);
    }
  };

  useEffect(() => {
    if (mapRef.current && mapRef.current.pm) {
      mapRef.current.pm.addControls({
        position: 'topleft',
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawRectangle: true,
        drawPolygon: true,
        drawCircle: false,
        editMode: true,
        dragMode: true,
        cutPolygon: true,
        removalMode: true,
      });
    }
  }, []);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border shadow-sm">
      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        className="w-full h-full bg-[#1c2128]"
        zoomControl={false} // Custom zoom control position
        ref={mapRef}
      >
        <MapFlyTo center={mapCenter} />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
        />
        
        {searchCoords && villageAnalysis?.imageUrl && (
          <ImageOverlay
            url={villageAnalysis.imageUrl}
            bounds={[
              [searchCoords[0] - 0.01, searchCoords[1] - 0.01],
              [searchCoords[0] + 0.01, searchCoords[1] + 0.01]
            ]}
            opacity={activeLayer === 'ndvi' ? 0.8 : 0}
            className="transition-opacity duration-500"
          />
        )}
        
        {/* Render fields as polygons with internal mixed conditions */}
        {(dynamicFields || []).map((f: any) => {
          const isSelected = selectedFieldId === f.id;
          const isHighlighted = (highlightedFields || []).includes(f.id);
          
          // Colors mapping
          const getDomColor = (dom: string) => {
            switch(dom) {
              case 'healthy': return '#10b981';
              case 'nutrient': return '#f59e0b';
              case 'water': return '#3b82f6';
              case 'disease': return '#ef4444';
              case 'pest': return '#8b5cf6';
              default: return '#10b981';
            }
          };

          const getLayerColor = () => {
            if (activeLayer === 'health') {
               return f.health > 75 ? '#10b981' : f.health > 40 ? '#eab308' : '#ef4444';
            }
            if (activeLayer === 'disease') {
               return f.disease > 50 ? '#ef4444' : f.disease > 20 ? '#f59e0b' : '#10b981';
            }
            if (activeLayer === 'water') {
               return f.water > 50 ? '#ef4444' : f.water > 20 ? '#eab308' : '#3b82f6';
            }
            return getDomColor(f.dominant);
          };

          let opacity = 0.6;
          if (activeLayer === 'satellite' || activeLayer === 'ndvi') opacity = 0.2;
          if (activeLayer === 'boundary') opacity = 0;

          const baseColor = getLayerColor();
          const strokeColor = isHighlighted ? '#fde047' : isSelected ? '#ffffff' : (activeLayer === 'boundary' || activeLayer === 'ndvi' || activeLayer === 'satellite' ? '#ffffff' : baseColor);

          // Safeguard: Ensure polygonCoords exist before rendering
          if (!f.polygonCoords || f.polygonCoords.length === 0) return null;

          // Render Label Overlay
          const bounds = L.latLngBounds(f.polygonCoords);
          const fcenter = bounds.getCenter();

          return (
            <React.Fragment key={f.id}>
              <Polygon 
                positions={f.polygonCoords}
                className={isHighlighted ? "animate-pulse" : ""}
                pathOptions={{ 
                  fillColor: baseColor, 
                  fillOpacity: isHighlighted ? opacity + 0.2 : opacity, 
                  color: strokeColor, 
                  weight: isHighlighted ? 4 : isSelected ? 3 : (activeLayer === 'boundary' ? 2 : 1)
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedFieldId(f.id);
                    onFieldClick(f.id);
                    if (mapRef.current) mapRef.current.flyTo(center, 15);
                  }
                }}
              />
              
              {/* Mixed Condition Hotspots */}
              {activeLayer !== 'boundary' && f.hotspots?.map((hs: any, idx: number) => (
                <Circle 
                  key={idx}
                  center={[hs.lat, hs.lng]}
                  radius={hs.radius * (timeLine / 100)} // Shrink hotspots when timeline goes to past/future
                  pathOptions={{
                    fillColor: getBaseColor(hs.type),
                    fillOpacity: 0.7,
                    stroke: false
                  }}
                  interactive={false}
                />
              ))}

              {/* Field Label Icon */}
              <Marker position={fcenter} interactive={false} icon={L.divIcon({
                html: `<div class="bg-black/60 backdrop-blur-md border border-white/20 rounded px-1.5 py-0.5 text-[9px] font-medium text-white shadow-sm whitespace-nowrap -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>${f.name.split('—')[0].trim()}</div>`,
                className: 'bg-transparent'
              })} />
            </React.Fragment>
          );
        })}
      </MapContainer>

      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 pointer-events-none w-64 md:w-80">
        <MapSearchBox onSelectLocation={handleLocationSelect} theme="light" />
        
        {/* Map Layers Dropdown */}
        <div className="relative pointer-events-auto mt-2">
          <button 
            onClick={() => setIsLayersOpen(!isLayersOpen)}
            className="w-full flex items-center justify-between gap-2 h-10 px-4 bg-card/90 backdrop-blur border border-border rounded-lg shadow-lg hover:bg-accent text-sm font-medium text-foreground transition"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Layer: <span className="capitalize">{activeLayer}</span>
            </div>
          </button>
          
          {isLayersOpen && (
            <div className="absolute top-full mt-1 w-full bg-card/95 backdrop-blur border border-border rounded-lg shadow-xl overflow-hidden z-50">
              {[
                { id: 'satellite', label: 'Satellite RGB' },
                { id: 'ndvi', label: 'NDVI (Vegetation)' },
                { id: 'health', label: 'Crop Health' },
                { id: 'disease', label: 'Disease Risk' },
                { id: 'water', label: 'Water Stress' },
                { id: 'boundary', label: 'Field Boundaries Only' },
              ].map(layer => (
                <button
                  key={layer.id}
                  onClick={() => { setActiveLayer(layer.id); setIsLayersOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition flex items-center gap-2 ${activeLayer === layer.id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                >
                  <span className={`h-2 w-2 rounded-full ${activeLayer === layer.id ? 'bg-primary' : 'bg-transparent border border-muted-foreground'}`} />
                  {layer.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Field Panel */}
      {selectedFieldId && (
        <FloatingFieldPanel 
          field={dynamicFields.find(f => f.id === selectedFieldId)} 
          onClose={() => setSelectedFieldId(null)} 
        />
      )}


    </div>
  );
}

export function FloatingFieldPanel({ field, onClose }: { field: any, onClose: () => void }) {
  if (!field) return null;
  
  const npk = field.npk || { n: 72, p: 65, k: 80 };

  return (
    <div className="absolute top-4 left-4 bottom-24 w-80 bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl z-[500] flex flex-col overflow-hidden animate-in slide-in-from-left-4 pointer-events-auto">
      <div className="p-4 border-b border-border flex items-start justify-between bg-gradient-to-br from-primary/10 to-transparent">
        <div>
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Field Intelligence</div>
          <h2 className="text-xl font-bold tracking-tight">{field.name}</h2>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {field.village}</span>
            <span>·</span>
            <span>{field.area}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/10 transition"><X className="h-4 w-4" /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-accent/40 rounded-xl p-3 border border-border">
            <div className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1"><Target className="h-3 w-3" /> Health Score</div>
            <div className="text-2xl font-bold mt-1 text-healthy">{field.health}<span className="text-sm text-muted-foreground font-normal">/100</span></div>
          </div>
          <div className="bg-accent/40 rounded-xl p-3 border border-border">
            <div className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1"><Droplets className="h-3 w-3" /> Water Stress</div>
            <div className="text-xl font-bold mt-1 text-water">{field.water}%</div>
          </div>
          <div className="bg-accent/40 rounded-xl p-3 border border-border">
            <div className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1"><Bug className="h-3 w-3" /> Disease Prob.</div>
            <div className="text-xl font-bold mt-1 text-disease">{field.disease}%</div>
          </div>
          <div className="bg-accent/40 rounded-xl p-3 border border-border">
            <div className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Est. Yield</div>
            <div className="text-xl font-bold mt-1 text-foreground">{field.yield} <span className="text-xs">t/ha</span></div>
          </div>
        </div>

        {/* NPK Status */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1"><FlaskConical className="h-3 w-3" /> NPK Macronutrients</span>
            <span className="text-primary">{field.aiConfidence} Confidence</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'N', val: Math.round(npk.n), color: 'bg-emerald-500' },
              { label: 'P', val: Math.round(npk.p), color: 'bg-blue-500' },
              { label: 'K', val: Math.round(npk.k), color: 'bg-amber-500' }
            ].map(n => (
              <div key={n.label} className="bg-accent/30 rounded-lg p-2 text-center border border-border">
                <div className="text-[10px] font-bold text-muted-foreground">{n.label}</div>
                <div className="text-sm font-bold mt-0.5">{n.val}%</div>
                <div className="h-1 w-full bg-accent mt-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${n.color}`} style={{ width: `${n.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Details */}
        <div className="bg-card rounded-xl border border-border divide-y divide-border text-xs">
          <div className="p-3 flex justify-between items-center">
            <span className="text-muted-foreground">Crop Condition</span>
            <span className={`font-semibold ${field.dominant === 'disease' ? 'text-red-500' : field.dominant === 'water' ? 'text-orange-500' : field.dominant === 'nutrient' ? 'text-yellow-500' : 'text-emerald-500'}`}>{field.condition}</span>
          </div>
          <div className="p-3 flex justify-between items-center">
            <span className="text-muted-foreground">Survey Number</span>
            <span className="font-semibold">{field.surveyNo}</span>
          </div>
          <div className="p-3 flex justify-between items-center">
            <span className="text-muted-foreground">Growth Stage</span>
            <span className="font-semibold text-primary">{field.stage || 'Vegetative'}</span>
          </div>
          <div className="p-3 flex justify-between items-center">
            <span className="text-muted-foreground">Harvest Date</span>
            <span className="font-semibold">{field.harvestIn ? `In ${field.harvestIn} days` : 'N/A'}</span>
          </div>
          <div className="p-3 flex justify-between items-center">
            <span className="text-muted-foreground">Last Satellite Scan</span>
            <span className="font-semibold">{field.lastScan}</span>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-primary uppercase mb-2">
            <Bot className="h-3.5 w-3.5" /> AI Recommendation
          </div>
          <p className="text-xs leading-relaxed text-foreground/90">{field.rec}</p>
        </div>

        {/* Visual Verification Action (Radar Concept) */}
        {field.health < 75 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-destructive uppercase flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" /> Action Required
              </span>
              <p className="text-[10px] text-foreground/80 leading-relaxed">
                Sentinel-2 detected anomaly. Dispatch drone or upload ground photo for ML visual verification.
              </p>
              <div className="flex gap-2 mt-1">
                <button className="flex-1 bg-primary text-primary-foreground py-1.5 rounded text-[10px] font-bold hover:bg-primary/90 transition flex items-center justify-center gap-1">
                  <Leaf className="h-3 w-3" /> Deploy Drone
                </button>
                <button className="flex-1 bg-secondary text-secondary-foreground py-1.5 rounded text-[10px] font-bold hover:bg-secondary/80 border border-border transition flex items-center justify-center gap-1">
                  <Sun className="h-3 w-3" /> Upload Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AddFieldModalContent({ onClose }: { onClose: () => void }) {
  const mapRef = useRef<L.Map | null>(null);

  const handleLocationSelect = (lat: number, lon: number, name: string) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 15, { duration: 1.5 });
    }
  };

  // Existing modal logic...
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#1c2128]">
      <div className="flex items-center justify-between h-12 px-4 border-b border-white/10 bg-[#15191e]">
        <div className="flex-1" />
        <div className="text-sm font-semibold text-white">Add field</div>
        <div className="flex-1 flex justify-end">
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/10 text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
      </div>
      
      <div className="relative flex-1 bg-black">
        <MapContainer 
          center={[48.8566, 2.3522]} 
          zoom={3} 
          className="w-full h-full"
          zoomControl={true}
          ref={(map: any) => {
            mapRef.current = map;
            if (map && map.pm) {
              map.pm.addControls({
                position: 'leftcenter',
                drawMarker: false,
                drawCircleMarker: false,
                drawPolyline: false,
                drawRectangle: false,
                drawCircle: false,
                drawText: false,
                editMode: true,
                dragMode: false,
                cutPolygon: true,
                removalMode: true,
              });
            }
          }}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
          />
        </MapContainer>

        {/* Floating UI Elements from screenshot */}
        <div className="absolute top-4 left-4 z-[400] w-64 md:w-80 pointer-events-auto">
          <MapSearchBox onSelectLocation={handleLocationSelect} theme="dark" />
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] flex flex-col items-center pointer-events-none">
          <div className="bg-[#15191e]/90 backdrop-blur border border-yellow-500/30 px-4 py-2.5 rounded-lg shadow-xl flex flex-col items-center gap-1">
            <div className="text-yellow-500 text-xs font-bold">⚠️</div>
            <div className="text-sm font-semibold text-white">Zoom in to view the latest satellite image</div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
          <div className="bg-[#15191e]/90 backdrop-blur border border-blue-500/30 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <span className="flex items-center justify-center h-4 w-4 rounded-full bg-blue-500 text-white text-[10px] font-bold">!</span>
            <span className="text-xs font-semibold text-white">Place another dot to continue drawing</span>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-[400]">
          <button className="flex items-center gap-2 h-10 px-4 bg-[#15191e] border border-white/10 rounded-lg shadow-lg hover:bg-white/5 text-sm font-medium text-white transition">
            <img src={satelliteImg} className="h-6 w-6 rounded object-cover" />
            Layers
          </button>
        </div>

        <div className="absolute bottom-4 right-4 z-[400]">
          <button className="h-10 px-8 bg-[#2d333b] hover:bg-[#373e47] text-white/50 text-sm font-semibold rounded-lg shadow-lg transition" disabled>
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
