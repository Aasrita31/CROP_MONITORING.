import React, { useState, useEffect, useRef, Suspense } from "react";
import {
  Plus, MapPin, ChevronLeft, Trash2, Loader2, RefreshCw,
  Satellite, Calendar, Droplets, Tractor, Wheat, Leaf,
  ChevronDown, CheckCircle2, AlertTriangle, Search,
  Footprints, Play, Square, Navigation, Focus
} from "lucide-react";
import { useDashboardContext, type RegisteredField } from "@/context/DashboardContext";
import { FieldAnalysisPanel } from "./FieldAnalysisPanel";

// Lazy-load Leaflet to avoid SSR issues
declare global { interface Window { L: any } }

const CROP_OPTIONS = ["Paddy (Rice)"];
const VARIETY_OPTIONS = [
  "BPT-5204 (Samba Mahsuri)",
  "MTU-1010",
  "MTU-7029 (Swarna)",
  "IR-64",
  "JGL-1798",
  "Pusa Basmati-1121",
  "ADT-43",
  "ADT-45"
];
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

// Haversine distance
function haversineDistance(pt1: [number, number], pt2: [number, number]): number {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (pt2[0] - pt1[0]) * rad;
  const dLon = (pt2[1] - pt1[1]) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(pt1[0] * rad) * Math.cos(pt2[0] * rad) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ── Inline satellite map with drawing ──────────────────────────────────────
function InlineFieldMap({
  center, onPolygonDrawn, existingFields, isDrawing, drawnPolygon, gpsPoints, isGpsMapping, onGpsPointAdded
}: {
  center: [number, number];
  onPolygonDrawn: (polygon: [number, number][], acres: number, village: string, district: string) => void;
  existingFields: RegisteredField[];
  isDrawing: boolean;
  drawnPolygon: [number, number][];
  gpsPoints?: [number, number][];
  isGpsMapping?: boolean;
  onGpsPointAdded?: (pt: [number, number]) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const drawnLayersRef = useRef<any>(null);

  const [searchVal, setSearchVal] = useState("");
  const [searching, setSearching] = useState(false);

  const searchBoundaryLayerRef = useRef<any>(null);

  const searchLocation = async () => {
    if (!searchVal.trim() || !leafletMapRef.current) return;
    const L = window.L;
    if (!L) return;
    setSearching(true);

    // Remove previous boundary layer
    if (searchBoundaryLayerRef.current) {
      leafletMapRef.current.removeLayer(searchBoundaryLayerRef.current);
      searchBoundaryLayerRef.current = null;
    }

    const map = leafletMapRef.current;
    const styleOpts = {
      color: "#3b82f6",
      weight: 3,
      opacity: 0.9,
      fillColor: "#3b82f6",
      fillOpacity: 0.12,
      dashArray: "8 4",
    };

    try {
      // ── Step 1: Nominatim — ask for polygon_geojson ─────────────────────
      const query = encodeURIComponent(searchVal + ", Andhra Pradesh, India");
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5&countrycodes=in&polygon_geojson=1`,
        { headers: { "User-Agent": "AgriTwin/1.0" } }
      );
      const nomData = await nomRes.json();

      if (!nomData || nomData.length === 0) {
        setSearching(false);
        return;
      }

      const first = nomData[0];
      const centerLat = parseFloat(first.lat);
      const centerLon = parseFloat(first.lon);

      // Check if Nominatim returned a real polygon (not just a point)
      const polygonResult = nomData.find((d: any) =>
        d.geojson && (d.geojson.type === "Polygon" || d.geojson.type === "MultiPolygon")
      );

      if (polygonResult) {
        // ── Got real polygon from Nominatim ─────────────────────────────
        const layer = L.geoJSON(polygonResult.geojson, { style: styleOpts }).addTo(map);
        searchBoundaryLayerRef.current = layer;
        map.fitBounds(layer.getBounds(), { maxZoom: 15, padding: [30, 30] });
        setSearching(false);
        return;
      }

      // ── Step 2: Try Overpass API for the actual admin boundary ──────────
      // This finds OSM relation/way boundaries for village names
      const overpassQuery = `
        [out:json][timeout:20];
        (
          relation["name"~"${searchVal.trim()}",i]["boundary"="administrative"];
          relation["name"~"${searchVal.trim()}",i]["place"];
          way["name"~"${searchVal.trim()}",i]["boundary"="administrative"];
        );
        out geom;
      `;

      let boundaryDrawn = false;
      try {
        const ovRes = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "data=" + encodeURIComponent(overpassQuery),
        });
        const ovData = await ovRes.json();

        if (ovData.elements && ovData.elements.length > 0) {
          // Convert Overpass elements to GeoJSON
          const features: any[] = [];
          for (const el of ovData.elements) {
            if (el.type === "way" && el.geometry) {
              const coords = el.geometry.map((pt: any) => [pt.lon, pt.lat]);
              if (coords.length >= 3) {
                // Close the ring
                if (coords[0][0] !== coords[coords.length - 1][0] ||
                    coords[0][1] !== coords[coords.length - 1][1]) {
                  coords.push(coords[0]);
                }
                features.push({
                  type: "Feature",
                  geometry: { type: "Polygon", coordinates: [coords] },
                  properties: el.tags || {}
                });
              }
            } else if (el.type === "relation" && el.members) {
              // For relations, collect all outer way geometries
              const outerCoords: number[][][] = [];
              for (const member of el.members) {
                if (member.role === "outer" && member.geometry) {
                  const ring = member.geometry.map((pt: any) => [pt.lon, pt.lat]);
                  if (ring.length >= 3) {
                    if (ring[0][0] !== ring[ring.length - 1][0] ||
                        ring[0][1] !== ring[ring.length - 1][1]) {
                      ring.push(ring[0]);
                    }
                    outerCoords.push(ring);
                  }
                }
              }
              if (outerCoords.length > 0) {
                features.push({
                  type: "Feature",
                  geometry: outerCoords.length === 1
                    ? { type: "Polygon", coordinates: outerCoords }
                    : { type: "MultiPolygon", coordinates: outerCoords.map(r => [r]) },
                  properties: el.tags || {}
                });
              }
            }
          }

          if (features.length > 0) {
            const geojsonLayer = L.geoJSON(
              { type: "FeatureCollection", features },
              { style: styleOpts }
            ).addTo(map);
            searchBoundaryLayerRef.current = geojsonLayer;
            map.fitBounds(geojsonLayer.getBounds(), { maxZoom: 15, padding: [30, 30] });
            boundaryDrawn = true;
          }
        }
      } catch (ovErr) {
        console.warn("Overpass query failed, using fallback:", ovErr);
      }

      if (!boundaryDrawn) {
        // ── Step 3: Fallback — draw a circle (better than a square box) ──
        // Estimate village radius from bounding box if available
        let radiusM = 800; // default ~800m radius
        if (first.boundingbox) {
          const [latMin, latMax, lonMin, lonMax] = first.boundingbox.map(parseFloat);
          const latSpan = (latMax - latMin) * 111000; // degrees to meters
          const lonSpan = (lonMax - lonMin) * 111000 * Math.cos(centerLat * Math.PI / 180);
          radiusM = Math.min(Math.max(Math.max(latSpan, lonSpan) / 2, 400), 3000);
        }

        const circle = L.circle([centerLat, centerLon], {
          radius: radiusM,
          ...styleOpts,
          fillOpacity: 0.1,
          dashArray: "6 6",
        }).addTo(map);

        // Add a note that it's approximate
        L.popup({ closeButton: false, autoClose: true, offset: [0, -10] })
          .setLatLng([centerLat, centerLon])
          .setContent(
            `<div style="font-family:sans-serif;font-size:12px;text-align:center">
              <strong>${searchVal}</strong><br/>
              <span style="color:#6b7280;font-size:10px">⚠️ Approximate area — no boundary in OpenStreetMap</span>
             </div>`
          )
          .openOn(map);

        searchBoundaryLayerRef.current = circle;
        map.fitBounds(circle.getBounds(), { maxZoom: 15, padding: [30, 30] });
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
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
        { maxNativeZoom: 17, maxZoom: 24, attribution: "Esri Satellite" }
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

      leafletMapRef.current = map;
    };

    load();
    return () => {
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, []);

  const [points, setPoints] = useState<[number, number][]>([]);

  // Reset drawing points when parent polygon is cleared
  useEffect(() => {
    if (drawnPolygon.length === 0) {
      setPoints([]);
    }
  }, [drawnPolygon]);

  // Click handler to collect up to 4 points or drop simulator pins
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const onClick = (e: any) => {
      if (isDrawing) {
        if (points.length >= 4) return;
        const newPoints = [...points, [e.latlng.lat, e.latlng.lng] as [number, number]];
        setPoints(newPoints);
      } else if (isGpsMapping && onGpsPointAdded) {
        onGpsPointAdded([e.latlng.lat, e.latlng.lng]);
      }
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [points, isDrawing, isGpsMapping, onGpsPointAdded]);

  // Render temporary drawing layers
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const L = window.L;
    if (!L) return;

    const tempGroup = L.featureGroup().addTo(map);

    // Draw markers for corners (only during active drawing phase)
    if (points.length < 4) {
      points.forEach((pt, index) => {
        L.marker(pt, {
          icon: L.divIcon({
            html: `<div class="h-6 w-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg">${index + 1}</div>`,
            className: 'bg-transparent',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(tempGroup);
      });
    }

    // Draw connecting lines or shape
    if (points.length >= 2) {
      L.polygon(points, {
        color: "#22c55e",
        weight: 3,
        fillColor: points.length >= 3 ? "#22c55e" : "transparent",
        fillOpacity: points.length >= 3 ? 0.2 : 0
      }).addTo(tempGroup);
    }

    // Auto-calculate on 4th point
    if (points.length === 4 && drawnPolygon.length === 0) {
      const finishDrawing = async () => {
        const acres = m2ToAcres(polygonAreaM2(points));
        const avgLat = points.reduce((s, p) => s + p[0], 0) / 4;
        const avgLon = points.reduce((s, p) => s + p[1], 0) / 4;

        let village = searchVal.trim() || "Unknown Village";
        let district = "Unknown District";
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${avgLat}&lon=${avgLon}&format=json`, { headers: { "User-Agent": "AgriTwin/1.0" } });
          const d = await r.json();
          const addr = d.address || {};
          if (!searchVal.trim()) {
            village = addr.village || addr.town || addr.city || addr.suburb || village;
          }
          district = addr.county || addr.state_district || addr.district || district;
        } catch {}

        onPolygonDrawn(points, parseFloat(acres.toFixed(3)), village, district);
      };
      finishDrawing();
    }

    return () => {
      map.removeLayer(tempGroup);
    };
  }, [points, drawnPolygon, isDrawing]);

  // Render GPS tracking path
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !gpsPoints || gpsPoints.length === 0) return;

    const L = window.L;
    if (!L) return;

    const gpsGroup = L.featureGroup().addTo(map);

    // Draw path
    L.polyline(gpsPoints, { color: "#3b82f6", weight: 4, dashArray: "5 5" }).addTo(gpsGroup);

    // Draw current location marker
    const currentPos = gpsPoints[gpsPoints.length - 1];
    L.circleMarker(currentPos, {
      radius: 6,
      fillColor: "#3b82f6",
      color: "#ffffff",
      weight: 2,
      fillOpacity: 1
    }).addTo(gpsGroup);

    if (isGpsMapping) {
      map.panTo(currentPos, { animate: true, duration: 1 });
    } else if (gpsPoints.length > 2) {
      L.polygon(gpsPoints, { color: "#22c55e", weight: 3, fillColor: "#22c55e", fillOpacity: 0.2 }).addTo(gpsGroup);
      map.fitBounds(L.polygon(gpsPoints).getBounds(), { padding: [30, 30] });
    }

    return () => {
      map.removeLayer(gpsGroup);
    };
  }, [gpsPoints, isGpsMapping]);

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
    searchCoords, setSearchCoords,
    setSearchQuery, setVillageAnalysis,
  } = useDashboardContext();

  // View modes
  const [view, setView] = useState<"list" | "method-select" | "gps-map" | "add-form" | "detail">("list");
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

  // GPS mapping state
  const [gpsPoints, setGpsPoints] = useState<[number, number][]>([]);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(0);
  const [gpsDistance, setGpsDistance] = useState<number>(0);
  const [isGpsMapping, setIsGpsMapping] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const center: [number, number] = searchCoords ?? [16.5, 80.6];

  const resetForm = () => {
    setDrawnPolygon([]); setDrawnAcres(0);
    setDetectedVillage(""); setDetectedDistrict("");
    setFormFarmName(""); setFormCrop(""); setFormVariety("");
    setFormSowingDate(""); setFormIrrigation(""); setFormFarming("");
    setFormStatus("sown");
    setGpsPoints([]); setGpsDistance(0); setGpsAccuracy(0);
  };

  const handlePolygonDrawn = (polygon: [number, number][], acres: number, village: string, district: string) => {
    setDrawnPolygon(polygon);
    setDrawnAcres(acres);
    setDetectedVillage(village);
    setDetectedDistrict(district);
  };

  const handleGpsPointAdded = (newPt: [number, number]) => {
    setGpsAccuracy(3.0); // Set mock good accuracy for simulated point
    setGpsPoints((prev) => {
      if (prev.length === 0) return [newPt];
      const lastPt = prev[prev.length - 1];
      const dist = haversineDistance(lastPt, newPt);
      setGpsDistance((d) => d + dist);
      return [...prev, newPt];
    });
  };

  const startGpsMapping = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setGpsPoints([]);
    setGpsDistance(0);
    setIsGpsMapping(true);
    setView("gps-map");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy;
        setGpsAccuracy(acc);
        
        // Ignore points with bad accuracy (>20m)
        if (acc > 20) return;

        const newPt: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        
        setGpsPoints((prev) => {
          if (prev.length === 0) return [newPt];
          const lastPt = prev[prev.length - 1];
          const dist = haversineDistance(lastPt, newPt);
          
          // Only record if moved > 3 meters to avoid noise
          if (dist > 3) {
            setGpsDistance(d => d + dist);
            return [...prev, newPt];
          }
          return prev;
        });
      },
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  };

  const stopGpsMapping = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsGpsMapping(false);
  };

  const finishGpsMapping = async () => {
    stopGpsMapping();
    if (gpsPoints.length < 3) {
      alert("Not enough points collected to form a boundary (minimum 3 required).");
      return;
    }
    const acres = m2ToAcres(polygonAreaM2(gpsPoints));
    
    // Auto-detect village from first point
    const firstPt = gpsPoints[0];
    let village = "Unknown Village";
    let district = "Unknown District";
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${firstPt[0]}&lon=${firstPt[1]}&format=json`, { headers: { "User-Agent": "AgriTwin/1.0" } });
      const d = await r.json();
      const addr = d.address || {};
      village = addr.village || addr.town || addr.city || addr.suburb || village;
      district = addr.county || addr.state_district || addr.district || district;
    } catch {}

    handlePolygonDrawn(gpsPoints, parseFloat(acres.toFixed(3)), village, district);
    setView("add-form");
  };

  useEffect(() => {
    return () => stopGpsMapping(); // Cleanup on unmount
  }, []);

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
      await fetch("/api/farmer-fields", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("agritwin_token")}`
        },
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
        const res = await fetch("/api/farmer-fields/detect-field", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("agritwin_token")}`
          },
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
      const res = await fetch("/api/analysis/field-polygon", {
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

    // ── Broadcast to all analytics panels ──────────────────────────────
    // Compute centroid of the drawn polygon
    if (field.polygon && field.polygon.length >= 3) {
      const lats = field.polygon.map(p => p[0]);
      const lons = field.polygon.map(p => p[1]);
      const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const centerLon = lons.reduce((a, b) => a + b, 0) / lons.length;

      // Update global state so NDVI / NDMI / EVI / SAVI panels reflect this field
      setSearchQuery(field.villageName);
      setSearchCoords([centerLat, centerLon]);

      // Fetch village-level satellite analysis for all analytics panels
      const token = localStorage.getItem("agritwin_token");
      fetch(
        `/api/analysis/village?name=${encodeURIComponent(field.villageName)}&latitude=${centerLat}&longitude=${centerLon}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
        .then(res => res.json())
        .then(analysis => setVillageAnalysis(analysis))
        .catch(err => console.error("Village analysis fetch failed:", err));
    }
    // ────────────────────────────────────────────────────────────────────

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
      await fetch(`/api/farmer-fields/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("agritwin_token")}` }
      });
      const updated = registeredFields.filter(f => f.id !== id);
      setRegisteredFields(updated);
      if (activeField?.id === id) { setActiveField(null); setFieldPolygonAnalysis(null); }
      const nc = { ...analysisCache }; delete nc[id]; setAnalysisCache(nc);
      if (view === "detail") setView("list");
    } catch (e) {
      console.error("Failed to delete field:", e);
    }
  };

  // ── SIDE PANEL CONTENT (Right Side) ───────────────────────────────────────
  const renderSidePanel = () => {
    // ── LIST VIEW ─────────────────────────────────────────────────────────
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
                onClick={() => { resetForm(); setView("method-select"); }}
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

    // ── METHOD SELECT VIEW ────────────────────────────────────────────────
    if (view === "method-select") {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <button onClick={() => setView("list")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="font-bold text-sm text-gray-800">Register Farm</div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4">
            <button
              onClick={startGpsMapping}
              className="flex flex-col items-center text-center p-6 border-2 border-emerald-500 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition shadow-sm group"
            >
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Footprints className="h-6 w-6" />
              </div>
              <div className="font-bold text-emerald-800 text-base mb-1">Walk Around My Farm</div>
              <div className="text-xs text-emerald-600/80 mb-2 font-semibold tracking-wide uppercase">Recommended</div>
              <div className="text-xs text-gray-600">Walk around the boundary of your farm while the application records your GPS location automatically.</div>
            </button>

            <button
              onClick={() => setView("add-form")}
              className="flex flex-col items-center text-center p-6 border border-gray-200 bg-gray-50 rounded-2xl hover:border-gray-300 hover:bg-gray-100 transition group"
            >
              <div className="bg-gray-200 text-gray-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Navigation className="h-6 w-6" />
              </div>
              <div className="font-bold text-gray-800 text-base mb-1">Draw Boundary on Map</div>
              <div className="text-xs text-gray-500">Manually click 4 corners on the satellite map to define your farm boundary remotely.</div>
            </button>
          </div>
        </div>
      );
    }

    // ── GPS MAPPING VIEW ──────────────────────────────────────────────────
    if (view === "gps-map") {
      const gpsAcres = m2ToAcres(polygonAreaM2(gpsPoints));
      return (
        <div className="flex flex-col h-full bg-emerald-900 text-white relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(52,211,153,0.4)_0%,_transparent_70%)] animate-pulse-glow" />
          </div>

          <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-800/50 relative z-10">
            <div className="font-bold text-sm text-emerald-50 flex items-center gap-2">
              <Satellite className="h-4 w-4 text-emerald-400" />
              Live Boundary Mapping
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center px-6 space-y-8 relative z-10">
            <div className="text-center">
              <div className="text-[10px] text-emerald-300/70 font-semibold uppercase tracking-wider mb-1">Distance Walked</div>
              <div className="text-5xl font-black text-white">{gpsDistance.toFixed(0)} <span className="text-xl text-emerald-400">m</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 flex flex-col items-center justify-center backdrop-blur-md">
                <div className="text-[9px] text-emerald-300/70 font-bold uppercase tracking-wider mb-0.5">Points Recorded</div>
                <div className="text-lg font-bold text-emerald-100">{gpsPoints.length}</div>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 flex flex-col items-center justify-center backdrop-blur-md">
                <div className="text-[9px] text-emerald-300/70 font-bold uppercase tracking-wider mb-0.5">Estimated Area</div>
                <div className="text-lg font-bold text-emerald-100">{gpsPoints.length >= 3 ? gpsAcres.toFixed(2) : "---"} <span className="text-xs">Ac</span></div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <Focus className={`h-4 w-4 ${gpsAccuracy > 15 || gpsAccuracy === 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span className={`text-xs font-semibold ${gpsAccuracy > 15 || gpsAccuracy === 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  GPS Accuracy: {gpsAccuracy === 0 ? "Unavailable (HTTP)" : `${gpsAccuracy.toFixed(1)}m`}
                </span>
              </div>
              <div className="text-[10px] text-emerald-300/60 text-center max-w-[250px] leading-relaxed">
                {gpsAccuracy === 0 ? (
                  <span className="text-amber-300 font-medium">💡 Hint: Since location is blocked over HTTP, tap the satellite map directly to drop manual boundary corners!</span>
                ) : (
                  "Keep walking around the perimeter, or tap the map to drop pins manually."
                )}
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-emerald-800/50 bg-emerald-950/80 backdrop-blur-md shrink-0 relative z-10">
            {isGpsMapping ? (
              <button
                onClick={finishGpsMapping}
                disabled={gpsPoints.length < 3}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-emerald-950 font-black rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <CheckCircle2 className="h-5 w-5" /> Finish Mapping
              </button>
            ) : (
              <button
                onClick={startGpsMapping}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <Play className="h-5 w-5 fill-current" /> Start Mapping
              </button>
            )}
            
            <button
              onClick={() => { stopGpsMapping(); setView("method-select"); }}
              className="w-full py-2.5 mt-2 bg-transparent text-emerald-300/80 hover:text-emerald-100 text-xs font-bold transition flex items-center justify-center"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    // ── ADD FIELD FORM ─────────────────────────────────────────────────────
    if (view === "add-form") {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <button onClick={() => { resetForm(); setView("method-select"); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
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
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Crop Name</label>
              <input
                type="text"
                value={formCrop}
                onChange={e => setFormCrop(e.target.value)}
                placeholder="Enter crop name"
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
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-1">
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Field Boundary Ready
                  </div>
                  <div className="text-sm font-black text-emerald-600">{drawnAcres.toFixed(2)} Acres</div>
                  <div className="text-[10px] text-emerald-600">{detectedVillage} · {detectedDistrict}</div>
                </div>
                <button
                  type="button"
                  onClick={() => { resetForm(); setView("method-select"); }}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear & Map Again
                </button>
              </div>
            )}

            {drawnPolygon.length < 3 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Draw Your Field on the Map
                </div>
                <div className="text-[10px] text-amber-600 mt-0.5">Click 4 corners on the map to mark your field boundary</div>
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

    // ── FIELD DETAIL VIEW ──────────────────────────────────────────────────
    if (view === "detail" && activeField) {
      return (
        <div className="flex flex-col h-full animate-in slide-in-from-right duration-200 w-full md:w-[340px]">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
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
              field={activeField}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">


      {/* RIGHT — Satellite Map */}
      <div className="h-[250px] sm:h-[350px] md:h-full flex-none md:flex-1 relative">
        <Suspense fallback={
          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        }>
          <InlineFieldMap
            center={center}
            onPolygonDrawn={handlePolygonDrawn}
            existingFields={registeredFields}
            isDrawing={view === "add-form" && drawnPolygon.length === 0}
            drawnPolygon={drawnPolygon}
            gpsPoints={gpsPoints}
            isGpsMapping={isGpsMapping}
            onGpsPointAdded={handleGpsPointAdded}
          />
        </Suspense>

        {/* Bottom bar like reference */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 px-3 py-2 flex items-center justify-between z-[1000] gap-2">
          <button className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-[10px] md:text-xs font-bold text-gray-600 flex items-center gap-1.5 min-w-0">
            <Satellite className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              {drawnPolygon.length >= 3
                ? `Boundary defined · ${drawnAcres.toFixed(2)} Ac`
                : view === "gps-map"
                  ? "Walk boundary to map"
                  : view === "add-form"
                    ? "Tap corners to define"
                    : "Select a field to view"}
            </span>
          </div>
          <button
            onClick={() => { resetForm(); setView("method-select"); }}
            className="flex items-center gap-1 bg-emerald-600 text-white text-[10px] md:text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-emerald-700 transition shrink-0"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      </div>

      {/* MAIN PANEL (Right Side) */}
      <div className={`${view === "detail" ? "w-full md:w-[340px]" : "w-full md:w-[300px]"} flex-1 md:flex-initial bg-white border-t md:border-t-0 md:border-l border-gray-200 shadow-sm flex flex-col md:h-full z-10 transition-all duration-300 overflow-x-hidden min-h-0`}>
        {renderSidePanel()}
      </div>
    </div>
  );
}
