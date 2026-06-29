import React, { useState, useEffect, useRef, Suspense } from "react";
import {
  Plus, MapPin, ChevronLeft, Trash2, Loader2, RefreshCw,
  Satellite, Calendar, Droplets, Tractor, Wheat, Leaf,
  ChevronDown, CheckCircle2, AlertTriangle, Search
} from "lucide-react";
import { useDashboardContext, type RegisteredField } from "@/context/DashboardContext";
import { FieldAnalysisPanel } from "./FieldAnalysisPanel";

// Lazy-load Leaflet to avoid SSR issues
declare global { interface Window { L: any } }

const CROP_OPTIONS = ["Paddy (Rice)"];
const IRRIGATION_OPTIONS = ["Drip Irrigation", "Sprinkler", "Canal / Flood", "Borewell", "Rainwater / Rainfed"];
const FARMING_OPTIONS = ["Organic Farming", "Conventional Farming", "Mixed / Semi-organic", "Natural Farming"];

// ── Haversine area calc ────────────────────────────────────────────────────
function polygonAreaM2(pts: [number, number][]): number {
  if (pts.length < 3) return 0;
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [lat1, lon1] = pts[i];
    const [lat2, lon2] = pts[(i + 1) % pts.length];
    area += toRad(lon2 - lon1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs(area * R * R) / 2;
}
function m2ToAcres(m2: number) { return m2 / 4046.856; }

// ── Inline satellite map with drawing ──────────────────────────────────────
function InlineFieldMap({
  center, onPolygonDrawn, existingFields
}: {
  center: [number, number];
  onPolygonDrawn: (polygon: [number, number][], acres: number, village: string, district: string) => void;
  existingFields: RegisteredField[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const drawnLayersRef = useRef<any>(null);

  const [searchVal, setSearchVal] = useState("");
  const [searching, setSearching] = useState(false);

  const searchLocation = async () => {
    if (!searchVal.trim() || !leafletMapRef.current) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchVal)}&format=json&limit=1`,
        { headers: { "User-Agent": "AgriTwin/1.0" } }
      );
      const data = await res.json();
      if (data[0]) {
        leafletMapRef.current.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 16);
      }
    } catch {}
    setSearching(false);
  };

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const load = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      await import("leaflet-draw/dist/leaflet.draw.css");
      await import("leaflet-draw");

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, { center, zoom: 15, zoomControl: true });

      // Esri high-res satellite
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, attribution: "Esri Satellite" }
      ).addTo(map);

      // Label overlay
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { opacity: 0.6, maxZoom: 19 }
      ).addTo(map);

      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnLayersRef.current = drawnItems;

      // Draw existing registered fields as read-only polygons
      existingFields.forEach(f => {
        if (f.polygon.length >= 3) {
          const poly = L.polygon(f.polygon, {
            color: "#10b981", weight: 2, fillColor: "#10b981", fillOpacity: 0.18,
            dashArray: "6 4"
          }).addTo(map);
          poly.bindTooltip(f.name, { permanent: false, direction: "center" });
        }
      });

      const drawControl = new (L as any).Control.Draw({
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: { color: "#22c55e", weight: 3, fillColor: "#22c55e", fillOpacity: 0.2 },
          },
          rectangle: { shapeOptions: { color: "#22c55e", weight: 3, fillColor: "#22c55e", fillOpacity: 0.2 } },
          polyline: false, circle: false, marker: false, circlemarker: false,
        },
        edit: { featureGroup: drawnItems, remove: true },
      });
      map.addControl(drawControl);

      map.on((L as any).Draw.Event.CREATED, async (e: any) => {
        drawnItems.clearLayers();
        drawnItems.addLayer(e.layer);
        const latlngs: [number, number][] = e.layer.getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);
        const acres = m2ToAcres(polygonAreaM2(latlngs));
        const avgLat = latlngs.reduce((s, p) => s + p[0], 0) / latlngs.length;
        const avgLon = latlngs.reduce((s, p) => s + p[1], 0) / latlngs.length;

        // Reverse geocode
        let village = "Unknown Village", district = "Unknown District";
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${avgLat}&lon=${avgLon}&format=json`, { headers: { "User-Agent": "AgriTwin/1.0" } });
          const d = await r.json();
          const addr = d.address || {};
          village = addr.village || addr.town || addr.city || addr.suburb || village;
          district = addr.county || addr.state_district || addr.district || district;
        } catch {}

        onPolygonDrawn(latlngs, parseFloat(acres.toFixed(3)), village, district);
      });

      map.on((L as any).Draw.Event.DELETED, () => {
        onPolygonDrawn([], 0, "", "");
      });

      leafletMapRef.current = map;
    };

    load();
    return () => {
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Search bar overlay */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2">
        <div className="flex items-center bg-white rounded-xl shadow-lg border border-gray-200 px-3 py-2 gap-2 w-72">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && searchLocation()}
            placeholder="Search location..."
            className="flex-1 text-sm outline-none text-gray-700 bg-transparent"
          />
          {searching && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
        </div>
      </div>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}

// ── Select dropdown helper ─────────────────────────────────────────────────
function SelectField({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:bg-white transition pr-8"
        >
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────
export function FarmRegistrationPanel() {
  const {
    registeredFields, setRegisteredFields,
    activeField, setActiveField,
    fieldPolygonAnalysis, setFieldPolygonAnalysis,
    searchCoords,
  } = useDashboardContext();

  // View modes: "list" | "add-form" | "detail"
  const [view, setView] = useState<"list" | "add-form" | "detail">("list");
  const [analysisCache, setAnalysisCache] = useState<Record<string, any>>({});
  const [loadingFieldId, setLoadingFieldId] = useState<string | null>(null);

  // Form state
  const [drawnPolygon, setDrawnPolygon] = useState<[number, number][]>([]);
  const [drawnAcres, setDrawnAcres] = useState(0);
  const [detectedVillage, setDetectedVillage] = useState("");
  const [detectedDistrict, setDetectedDistrict] = useState("");
  const [formFarmName, setFormFarmName] = useState("");
  const [formCrop, setFormCrop] = useState("");
  const [formVariety, setFormVariety] = useState("");
  const [formSowingDate, setFormSowingDate] = useState("");
  const [formIrrigation, setFormIrrigation] = useState("");
  const [formFarming, setFormFarming] = useState("");
  const [formStatus, setFormStatus] = useState<"sown" | "barren">("sown");

  const center: [number, number] = searchCoords ?? [16.5, 80.6];

  const resetForm = () => {
    setDrawnPolygon([]); setDrawnAcres(0);
    setDetectedVillage(""); setDetectedDistrict("");
    setFormFarmName(""); setFormCrop(""); setFormVariety("");
    setFormSowingDate(""); setFormIrrigation(""); setFormFarming("");
    setFormStatus("sown");
  };

  const handlePolygonDrawn = (polygon: [number, number][], acres: number, village: string, district: string) => {
    setDrawnPolygon(polygon);
    setDrawnAcres(acres);
    setDetectedVillage(village);
    setDetectedDistrict(district);
  };

  const handleAddField = async () => {
    if (!formFarmName.trim() || drawnPolygon.length < 3) return;
    const newField = {
      id: `field-${Date.now()}`,
      name: formFarmName.trim(),
      polygon: drawnPolygon,
      areaAcres: drawnAcres,
      areaHectares: parseFloat((drawnAcres * 0.404686).toFixed(4)),
      villageName: detectedVillage || "Unknown",
      districtName: detectedDistrict || "Unknown",
      landStatus: formStatus,
      cropName: formCrop,
      variety: formVariety,
      sowingDate: formSowingDate,
      irrigationType: formIrrigation,
      farmingType: formFarming
    };
    
    try {
      await fetch("http://127.0.0.1:8080/api/farmer-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newField)
      });
      const updated = [...registeredFields, { ...newField, createdAt: new Date().toISOString() } as RegisteredField];
      setRegisteredFields(updated);
      setActiveField(updated[updated.length - 1]);
      resetForm();
      setView("detail");
      fetchAnalysis(updated[updated.length - 1], formStatus);
    } catch (e) {
      console.error("Failed to add field:", e);
    }
  };

  const [detecting, setDetecting] = useState(false);
  const handleDetectField = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch("http://127.0.0.1:8080/api/farmer-fields/detect-field", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        });
        const data = await res.json();
        if (data.detected) {
          const field = registeredFields.find(f => f.id === data.fieldId);
          if (field) {
            handleSelectField(field);
          }
        } else {
          alert("You are currently not inside any registered field.");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setDetecting(false);
      }
    }, () => {
      alert("Unable to retrieve your location");
      setDetecting(false);
    });
  };

  const fetchAnalysis = async (field: RegisteredField, landStatus?: "sown" | "barren") => {
    const status = landStatus ?? field.landStatus ?? "sown";
    setLoadingFieldId(field.id);
    setFieldPolygonAnalysis(null);
    try {
      const res = await fetch("http://127.0.0.1:8080/api/analysis/field-polygon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ polygon: field.polygon, land_status: status, village_name: field.villageName }),
      });
      const data = await res.json();
      setAnalysisCache(prev => ({ ...prev, [field.id]: data }));
      setFieldPolygonAnalysis(data);
    } catch (e) {
      console.error("Analysis failed:", e);
    } finally {
      setLoadingFieldId(null);
    }
  };

  const handleSelectField = (field: RegisteredField) => {
    setActiveField(field);
    setView("detail");
    if (analysisCache[field.id]) {
      setFieldPolygonAnalysis(analysisCache[field.id]);
    } else if (field.landStatus) {
      fetchAnalysis(field);
    } else {
      setFieldPolygonAnalysis(null);
    }
  };

  const handleDeleteField = async (id: string) => {
    try {
      await fetch(`http://127.0.0.1:8080/api/farmer-fields/${id}`, { method: "DELETE" });
      const updated = registeredFields.filter(f => f.id !== id);
      setRegisteredFields(updated);
      if (activeField?.id === id) { setActiveField(null); setFieldPolygonAnalysis(null); }
      const nc = { ...analysisCache }; delete nc[id]; setAnalysisCache(nc);
      if (view === "detail") setView("list");
    } catch (e) {
      console.error("Failed to delete field:", e);
    }
  };

  // ── LEFT PANEL CONTENT ────────────────────────────────────────────────────
  const renderLeftPanel = () => {
    // ── ALL FIELDS LIST ────────────────────────────────────────────────────
    if (view === "list") {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="font-bold text-base text-gray-800">My Fields</span>
            <div className="flex gap-2">
              <button
                onClick={handleDetectField}
                disabled={detecting}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                {detecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />} Detect
              </button>
              <button
                onClick={() => { resetForm(); setView("add-form"); }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add Field
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {registeredFields.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <MapPin className="h-10 w-10 text-emerald-200 mb-3" />
                <div className="text-sm font-bold text-gray-600 mb-1">No Fields Registered</div>
                <div className="text-xs text-gray-400">Click "Add Field" to draw your farm boundary on the satellite map</div>
              </div>
            ) : (
              registeredFields.map(field => {
                const ndvi = analysisCache[field.id]?.ndvi;
                const isHealthy = ndvi !== undefined && ndvi >= 0.55;
                const isStressed = ndvi !== undefined && ndvi < 0.4;
                return (
                  <div
                    key={field.id}
                    onClick={() => handleSelectField(field)}
                    className="group relative bg-white border border-gray-100 hover:border-emerald-200 rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-base shrink-0">
                        {isHealthy ? "🌾" : isStressed ? "⚠️" : "🌱"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-800 truncate">{field.name}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {field.villageName} · {field.areaAcres.toFixed(2)} Ac
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          {field.landStatus === "sown" && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">🌱 Crop Sown</span>
                          )}
                          {field.landStatus === "barren" && (
                            <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">🌾 Barren</span>
                          )}
                          {ndvi !== undefined && (
                            <span className={`text-[9px] font-bold ${isHealthy ? "text-emerald-600" : isStressed ? "text-red-500" : "text-yellow-600"}`}>
                              NDVI {ndvi.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={e => { e.stopPropagation(); fetchAnalysis(field); }} className="p-1 rounded text-gray-400 hover:text-emerald-600 transition">
                          {loadingFieldId === field.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDeleteField(field.id); }} className="p-1 rounded text-gray-400 hover:text-red-500 transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }

    // ── ADD FIELD FORM ─────────────────────────────────────────────────────
    if (view === "add-form") {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <button onClick={() => { resetForm(); setView("list"); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="font-bold text-sm text-gray-800">Crop Details</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Field Status toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Field status</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFormStatus("sown")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${formStatus === "sown" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"}`}
                >
                  <Leaf className="h-3 w-3" /> Crop in field
                </button>
                <button
                  onClick={() => setFormStatus("barren")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${formStatus === "barren" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-400"}`}
                >
                  <Wheat className="h-3 w-3" /> Empty Land
                </button>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                {formStatus === "sown" ? "Use actual sowing date below (today or earlier)." : "We'll recommend the best crop for this land."}
              </div>
            </div>

            {/* Farm Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Farm Name</label>
              <input
                type="text"
                value={formFarmName}
                onChange={e => setFormFarmName(e.target.value)}
                placeholder="Enter farm name"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            {/* Crop Name */}
            <SelectField label="Crop Name" value={formCrop} onChange={setFormCrop} options={CROP_OPTIONS} placeholder="Search or select crop" />

            {/* Variety */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Variety</label>
              <input
                type="text"
                value={formVariety}
                onChange={e => setFormVariety(e.target.value)}
                placeholder="Enter crop variety"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            {/* Sowing Date */}
            {formStatus === "sown" && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sowing date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={formSowingDate}
                    onChange={e => setFormSowingDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            {/* Irrigation */}
            <SelectField label="Type Of Irrigation" value={formIrrigation} onChange={setFormIrrigation} options={IRRIGATION_OPTIONS} placeholder="Select irrigation" />

            {/* Farming Type */}
            <SelectField label="Type Of Farming" value={formFarming} onChange={setFormFarming} options={FARMING_OPTIONS} placeholder="Select farming type" />

            {/* Polygon info */}
            {drawnPolygon.length >= 3 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-1">
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Field Boundary Drawn
                </div>
                <div className="text-sm font-black text-emerald-600">{drawnAcres.toFixed(2)} Acres</div>
                <div className="text-[10px] text-emerald-600">{detectedVillage} · {detectedDistrict}</div>
              </div>
            )}

            {drawnPolygon.length < 3 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Draw Your Field on the Map
                </div>
                <div className="text-[10px] text-amber-600 mt-0.5">Use the polygon tool on the right to mark your field boundary</div>
              </div>
            )}
          </div>

          {/* Add Field button */}
          <div className="p-4 border-t border-gray-100 shrink-0">
            <button
              onClick={handleAddField}
              disabled={!formFarmName.trim() || drawnPolygon.length < 3}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Field
            </button>
          </div>
        </div>
      );
    }

    // ── FIELD DETAIL ───────────────────────────────────────────────────────
    if (view === "detail" && activeField) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <button onClick={() => setView("list")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-gray-800 truncate">{activeField.name}</div>
              <div className="text-[10px] text-gray-400 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {activeField.villageName} · {activeField.areaAcres.toFixed(2)} Acres
              </div>
            </div>
            <button onClick={() => { fetchAnalysis(activeField); }} title="Refresh analysis" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-emerald-600 transition">
              {loadingFieldId === activeField.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <FieldAnalysisPanel
              analysis={fieldPolygonAnalysis}
              field={activeField}
              loading={loadingFieldId === activeField.id}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-[calc(100vh-180px)] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* LEFT PANEL — white, clean */}
      <div className="w-[300px] shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
        {renderLeftPanel()}
      </div>

      {/* RIGHT — Satellite Map */}
      <div className="flex-1 relative">
        <Suspense fallback={
          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        }>
          <InlineFieldMap
            center={center}
            onPolygonDrawn={handlePolygonDrawn}
            existingFields={registeredFields}
          />
        </Suspense>

        {/* Bottom bar like reference */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-2.5 flex items-center justify-between z-[1000]">
          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-xs font-bold text-gray-600 flex items-center gap-2">
            <Satellite className="h-3.5 w-3.5 text-emerald-600" />
            {drawnPolygon.length >= 3
              ? `Polygon drawn · ${drawnAcres.toFixed(2)} Acres · ${detectedVillage || "..."}`
              : "Use the polygon tool to draw your field boundary"}
          </div>
          <button
            onClick={() => { resetForm(); setView("add-form"); }}
            className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-emerald-700 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add Field
          </button>
        </div>
      </div>
    </div>
  );
}
