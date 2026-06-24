import React, { useEffect, useRef, useState } from "react";
import { X, Ruler, Trash2, Save, MapPin, RotateCcw, CheckCircle2, Loader2 } from "lucide-react";
import type { RegisteredField } from "@/context/DashboardContext";

// We use dynamic import for leaflet to avoid SSR issues
declare global {
  interface Window { L: any; }
}

interface FieldDrawerModalProps {
  initialCenter?: [number, number];
  onSave: (field: Omit<RegisteredField, "id" | "createdAt" | "landStatus">) => void;
  onClose: () => void;
}

// Haversine formula to compute polygon area in square metres
function polygonAreaM2(latLngs: [number, number][]): number {
  if (latLngs.length < 3) return 0;
  const R = 6371000; // Earth radius metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  let area = 0;
  const n = latLngs.length;
  for (let i = 0; i < n; i++) {
    const [lat1, lon1] = latLngs[i];
    const [lat2, lon2] = latLngs[(i + 1) % n];
    area += toRad(lon2 - lon1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs(area * R * R) / 2;
}

function m2ToAcres(m2: number) { return m2 / 4046.856; }
function m2ToHectares(m2: number) { return m2 / 10000; }

export function FieldDrawerModal({ initialCenter, onSave, onClose }: FieldDrawerModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const drawControlRef = useRef<any>(null);
  const drawnLayersRef = useRef<any>(null);
  const currentPolygonRef = useRef<any>(null);

  const [polygon, setPolygon] = useState<[number, number][]>([]);
  const [areaAcres, setAreaAcres] = useState(0);
  const [areaHa, setAreaHa] = useState(0);
  const [fieldName, setFieldName] = useState("");
  const [villageName, setVillageName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"draw" | "name">("draw");

  const center: [number, number] = initialCenter || [16.5, 80.6];

  // Reverse geocode to get village/district from polygon centroid
  const reverseGeocode = async (lat: number, lon: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "User-Agent": "AgriTwin-FarmManager/1.0" } }
      );
      const data = await res.json();
      const addr = data.address || {};
      setVillageName(addr.village || addr.town || addr.city || addr.suburb || "Unknown Village");
      setDistrictName(addr.county || addr.state_district || addr.district || "Unknown District");
    } catch {
      setVillageName("Unknown Village");
      setDistrictName("Unknown District");
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const loadLeaflet = async () => {
      // Dynamically import Leaflet and Leaflet.draw
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      await import("leaflet-draw/dist/leaflet.draw.css");
      await import("leaflet-draw");

      // Fix default icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center,
        zoom: 15,
        zoomControl: true,
      });

      // Esri World Imagery — high resolution satellite tiles
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 19,
        }
      ).addTo(map);

      // Esri World Boundaries overlay for labels
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { opacity: 0.7, maxZoom: 19 }
      ).addTo(map);

      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnLayersRef.current = drawnItems;

      // Leaflet.draw toolbar
      const drawControl = new (L as any).Control.Draw({
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: {
              color: "#10b981",
              weight: 3,
              fillColor: "#10b981",
              fillOpacity: 0.25,
            },
          },
          polyline: false,
          rectangle: {
            shapeOptions: { color: "#10b981", weight: 3, fillColor: "#10b981", fillOpacity: 0.25 },
          },
          circle: false,
          marker: false,
          circlemarker: false,
        },
        edit: {
          featureGroup: drawnItems,
          remove: true,
        },
      });
      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      map.on((L as any).Draw.Event.CREATED, (e: any) => {
        drawnItems.clearLayers();
        drawnItems.addLayer(e.layer);
        currentPolygonRef.current = e.layer;

        const latlngs: [number, number][] = e.layer.getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);
        setPolygon(latlngs);

        const areaM2 = polygonAreaM2(latlngs);
        setAreaAcres(parseFloat(m2ToAcres(areaM2).toFixed(3)));
        setAreaHa(parseFloat(m2ToHectares(areaM2).toFixed(4)));

        // Compute centroid
        const avgLat = latlngs.reduce((s, p) => s + p[0], 0) / latlngs.length;
        const avgLon = latlngs.reduce((s, p) => s + p[1], 0) / latlngs.length;
        reverseGeocode(avgLat, avgLon);
      });

      map.on((L as any).Draw.Event.EDITED, (e: any) => {
        e.layers.eachLayer((layer: any) => {
          const latlngs: [number, number][] = layer.getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);
          setPolygon(latlngs);
          const areaM2 = polygonAreaM2(latlngs);
          setAreaAcres(parseFloat(m2ToAcres(areaM2).toFixed(3)));
          setAreaHa(parseFloat(m2ToHectares(areaM2).toFixed(4)));
        });
      });

      map.on((L as any).Draw.Event.DELETED, () => {
        setPolygon([]);
        setAreaAcres(0);
        setAreaHa(0);
        currentPolygonRef.current = null;
      });

      leafletMapRef.current = map;
    };

    loadLeaflet();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  const clearPolygon = () => {
    if (drawnLayersRef.current) drawnLayersRef.current.clearLayers();
    currentPolygonRef.current = null;
    setPolygon([]);
    setAreaAcres(0);
    setAreaHa(0);
  };

  const handleSave = () => {
    if (polygon.length < 3 || !fieldName.trim()) return;
    setSaving(true);
    setTimeout(() => {
      onSave({
        name: fieldName.trim(),
        polygon,
        areaAcres,
        areaHectares: areaHa,
        villageName: villageName || "Unknown",
        districtName: districtName || "Unknown",
      });
      setSaving(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-950 animate-in fade-in duration-300">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/90 border-b border-slate-700/60 backdrop-blur shrink-0">
        <div className="h-8 w-8 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center">
          <MapPin className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-white">Draw Your Field Boundary</div>
          <div className="text-[10px] text-slate-400">Click the polygon tool on the left, then click points around your field</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {polygon.length >= 3 && (
            <button
              onClick={clearPolygon}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* Instruction overlay (only shown when no polygon yet) */}
        {polygon.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur border border-emerald-500/30 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 pointer-events-none field-draw-hint">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Click the polygon icon (▢) in the toolbar · then click to mark your field corners
          </div>
        )}
      </div>

      {/* Bottom panel */}
      {polygon.length >= 3 && (
        <div className="shrink-0 bg-slate-900/95 border-t border-slate-700/60 backdrop-blur px-4 py-4 animate-in slide-in-from-bottom-4 duration-300">
          {step === "draw" ? (
            <div className="max-w-2xl mx-auto">
              {/* Area summary */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                  <div className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Selected Area</div>
                  <div className="text-2xl font-black text-emerald-400">{areaAcres.toFixed(2)}</div>
                  <div className="text-[10px] text-emerald-300">Acres</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                  <div className="text-[9px] uppercase tracking-widest text-blue-400 font-bold mb-1">Hectares</div>
                  <div className="text-2xl font-black text-blue-400">{areaHa.toFixed(4)}</div>
                  <div className="text-[10px] text-blue-300">Ha</div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
                  <div className="text-[9px] uppercase tracking-widest text-purple-400 font-bold mb-1">Location</div>
                  <div className="text-sm font-black text-purple-300 truncate">
                    {geocoding ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (villageName || "—")}
                  </div>
                  <div className="text-[10px] text-purple-300 truncate">{geocoding ? "" : (districtName || "—")}</div>
                </div>
              </div>
              <button
                onClick={() => setStep("name")}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="h-4 w-4" /> Continue — Name This Field
              </button>
            </div>
          ) : (
            <div className="max-w-lg mx-auto space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                <Save className="h-4 w-4 text-emerald-400" /> Name & Save Your Field
              </div>
              <input
                type="text"
                placeholder="e.g. My Paddy Field, North Plot, Survey No. 12..."
                value={fieldName}
                onChange={e => setFieldName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm placeholder:text-slate-500 outline-none focus:border-emerald-500 transition"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setStep("draw")}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-600 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={!fieldName.trim() || saving}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold transition flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Field
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
