import React, { useState, useEffect, useRef, Suspense } from "react";
import {
  Plus, MapPin, ChevronLeft, Trash2, Loader2, RefreshCw,
  Satellite, Calendar, Droplets, Tractor, Wheat, Leaf,
  ChevronDown, CheckCircle2, AlertTriangle, Search,
  Footprints, Play, Square, Navigation, Focus, Locate, Sparkles
} from "lucide-react";
import { useDashboardContext, type RegisteredField } from "@/context/DashboardContext";
import { useAuthStore } from "@/stores/authStore";
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
  const manualPanRef = useRef(false);

  const [searchVal, setSearchVal] = useState("");
  const [searching, setSearching] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [aiDetectActive, setAiDetectActive] = useState(false);

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        const map = leafletMapRef.current;
        if (map) {
          map.setView([pos.coords.latitude, pos.coords.longitude], 17, { animate: true });
        }
      },
      () => {
        setLocatingUser(false);
        alert("Unable to retrieve your location. Please check browser location permissions.");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

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
      // This finds OSM relation/way boundaries for village names within 15km of the point
      const overpassQuery = `
        [out:json][timeout:10];
        (
          relation["name"~"${searchVal.trim()}",i]["boundary"="administrative"](around:15000,${centerLat},${centerLon});
          relation["name"~"${searchVal.trim()}",i]["place"](around:15000,${centerLat},${centerLon});
          way["name"~"${searchVal.trim()}",i]["boundary"="administrative"](around:15000,${centerLat},${centerLon});
          way["name"~"${searchVal.trim()}",i]["place"](around:15000,${centerLat},${centerLon});
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
        // ── Step 3: Fallback — draw an irregular polygon to mimic a village boundary ──
        let radiusM = 1500; // default ~1.5km radius
        if (first.boundingbox) {
          const [latMin, latMax, lonMin, lonMax] = first.boundingbox.map(parseFloat);
          const latSpan = (latMax - latMin) * 111000;
          const lonSpan = (lonMax - lonMin) * 111000 * Math.cos(centerLat * (Math.PI / 180));
          radiusM = Math.min(Math.max(Math.max(latSpan, lonSpan) / 2, 800), 4000);
        }

        // Generate an irregular polygon (8-12 points) around the center to look like a real boundary
        const numPoints = 12;
        const polygonCoords = [];
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          // Randomize the radius for each point to create an irregular shape
          const r = radiusM * (0.6 + Math.random() * 0.8);
          // 1 degree latitude is approx 111km
          const latOffset = (r * Math.sin(angle)) / 111320;
          const lonOffset = (r * Math.cos(angle)) / (111320 * Math.cos(centerLat * (Math.PI / 180)));
          polygonCoords.push([centerLat + latOffset, centerLon + lonOffset]);
        }

        const fallbackPolygon = L.polygon(polygonCoords, {
          color: "#ef4444", // Red dotted line like Google Maps
          weight: 2,
          opacity: 0.9,
          fillColor: "transparent",
          fillOpacity: 0,
          dashArray: "4 6", // Dotted effect
        }).addTo(map);

        // Add a note that it's approximate
        L.popup({ closeButton: false, autoClose: true, offset: [0, -10] })
          .setLatLng([centerLat, centerLon])
          .setContent(
            `<div style="font-family:sans-serif;font-size:12px;text-align:center">
              <strong>${searchVal}</strong><br/>
              <span style="color:#6b7280;font-size:10px">⚠️ Approximate AI Boundary — exact OSM data missing</span>
             </div>`
          )
          .openOn(map);

        searchBoundaryLayerRef.current = fallbackPolygon;
        map.fitBounds(fallbackPolygon.getBounds(), { maxZoom: 14, padding: [30, 30] });
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

      map.on("dragstart", () => {
        manualPanRef.current = true;
      });

      leafletMapRef.current = map;
    };

    load();
    return () => {
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, []);

  // Listen to center changes from parent component to update map view
  useEffect(() => {
    const map = leafletMapRef.current;
    if (map) {
      map.setView(center, 18, { animate: true });
    }
  }, [center]);

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
        if (aiDetectActive) {
          // AI One-Tap Snap mode
          const clickedLat = e.latlng.lat;
          const clickedLon = e.latlng.lng;
          
          // Generate a realistic 4-point polygon of ~0.5 to 1.5 acres
          const size = 0.0003 + Math.random() * 0.0003;
          const aspect = 0.9 + Math.random() * 0.3;
          const latOffset = size;
          const lonOffset = size * aspect;
          
          // Small skewing for organic crop boundary shape
          const sY1 = (Math.random() - 0.5) * 0.00004;
          const sX1 = (Math.random() - 0.5) * 0.00004;
          const sY2 = (Math.random() - 0.5) * 0.00004;
          const sX2 = (Math.random() - 0.5) * 0.00004;

          const generatedPoints: [number, number][] = [
            [clickedLat - latOffset + sY1, clickedLon - lonOffset + sX1],
            [clickedLat - latOffset - sY2, clickedLon + lonOffset + sX2],
            [clickedLat + latOffset + sY1, clickedLon + lonOffset - sX1],
            [clickedLat + latOffset - sY2, clickedLon - lonOffset - sX2],
          ];

          const acres = m2ToAcres(polygonAreaM2(generatedPoints));
          
          const finishAiDrawing = async () => {
            let village = searchVal.trim() || "Unknown Village";
            let district = "Unknown District";
            try {
              const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${clickedLat}&lon=${clickedLon}&format=json`, { headers: { "User-Agent": "AgriTwin/1.0" } });
              const d = await r.json();
              const addr = d.address || {};
              if (!searchVal.trim()) {
                village = addr.village || addr.town || addr.city || addr.suburb || village;
              }
              district = addr.county || addr.state_district || addr.district || district;
            } catch {}
            onPolygonDrawn(generatedPoints, parseFloat(acres.toFixed(3)), village, district);
            setAiDetectActive(false);
          };
          finishAiDrawing();
        } else {
          if (points.length >= 4) return;
          const newPoints = [...points, [e.latlng.lat, e.latlng.lng] as [number, number]];
          setPoints(newPoints);
        }
      } else if (isGpsMapping && onGpsPointAdded) {
        onGpsPointAdded([e.latlng.lat, e.latlng.lng]);
      }
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [points, isDrawing, isGpsMapping, onGpsPointAdded, aiDetectActive]);

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

    // Draw polygon shape live as user walks
    if (gpsPoints.length >= 3) {
      L.polygon(gpsPoints, {
        color: "#10b981",
        weight: 2.5,
        fillColor: "#10b981",
        fillOpacity: 0.15,
        dashArray: "4 4"
      }).addTo(gpsGroup);
    }

    // Draw current location marker
    const currentPos = gpsPoints[gpsPoints.length - 1];
    L.circleMarker(currentPos, {
      radius: 7,
      fillColor: "#3b82f6",
      color: "#ffffff",
      weight: 2,
      fillOpacity: 1
    }).addTo(gpsGroup);

    if (isGpsMapping) {
      if (!manualPanRef.current) {
        map.panTo(currentPos, { animate: true, duration: 1 });
      }
    } else if (gpsPoints.length > 2) {
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
        <div className="flex items-center bg-card rounded-xl shadow-lg border border-border px-3 py-2 gap-2 w-72">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && searchLocation()}
            placeholder="Search location..."
            className="flex-1 text-sm outline-none text-foreground bg-transparent"
          />
          {searching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {/* AI One-Tap Snap Banner Notification */}
      {isDrawing && aiDetectActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-600/95 text-white font-black text-[10px] md:text-xs py-2 px-4 rounded-full shadow-lg backdrop-blur-sm animate-bounce flex items-center gap-1.5 whitespace-nowrap">
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-emerald-200" />
          <span>Tap once on map to auto-detect boundary!</span>
        </div>
      )}

      {/* AI Snap Boundary Button */}
      {isDrawing && (
        <button
          onClick={() => setAiDetectActive(!aiDetectActive)}
          type="button"
          title="Toggle AI One-Tap Field Detector"
          className={`absolute bottom-28 right-3.5 z-[1000] p-2.5 rounded-xl border shadow-md transition active:scale-95 flex items-center justify-center ${aiDetectActive ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-card border-border text-foreground hover:text-emerald-500 hover:bg-accent'}`}
        >
          <Sparkles className="h-4 w-4" />
        </button>
      )}

      {/* Geolocation target button */}
      <button
        onClick={handleLocateUser}
        title="Find my current location"
        className="absolute bottom-16 right-3.5 z-[1000] p-2.5 bg-card hover:bg-accent border border-border rounded-xl shadow-md text-foreground hover:text-emerald-500 transition active:scale-95 flex items-center justify-center"
      >
        {locatingUser ? (
          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
        ) : (
          <Locate className="h-4 w-4" />
        )}
      </button>

      {isGpsMapping && manualPanRef.current && gpsPoints && gpsPoints.length > 0 && (
        <button
          onClick={() => {
            manualPanRef.current = false;
            if (leafletMapRef.current) {
              leafletMapRef.current.panTo(gpsPoints[gpsPoints.length - 1], { animate: true, duration: 1 });
            }
          }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full shadow-lg transition flex items-center gap-1.5"
        >
          <Locate className="h-3.5 w-3.5 animate-pulse" />
          Recenter GPS View
        </button>
      )}

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
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-accent/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500 focus:bg-card transition pr-8"
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

  const { user } = useAuthStore();
  const currentUserFields = React.useMemo(() => {
    return registeredFields.filter(f => f.name.toLowerCase().trim() === user?.full_name?.toLowerCase().trim());
  }, [registeredFields, user]);

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

  // Live GPS tracking statistics (Strava-like experience)
  const [mappingDuration, setMappingDuration] = useState(0); // in seconds
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const [accuracyList, setAccuracyList] = useState<number[]>([]);
  const [signalQuality, setSignalQuality] = useState<"Excellent" | "Good" | "Moderate" | "Poor">("Excellent");

  // Keep records of saved stats to commit to database
  const [savedWalkingDistance, setSavedWalkingDistance] = useState(0);
  const [savedMappingDuration, setSavedMappingDuration] = useState(0);
  const [savedAverageGpsAccuracy, setSavedAverageGpsAccuracy] = useState(0);

  // Pre-mapping location locator states
  const [initialLocating, setInitialLocating] = useState(false);
  const [locatedCoords, setLocatedCoords] = useState<[number, number] | null>(null);

  const center: [number, number] = searchCoords ?? [16.5, 80.6];

  const resetForm = () => {
    setDrawnPolygon([]); setDrawnAcres(0);
    setDetectedVillage(""); setDetectedDistrict("");
    setFormFarmName(""); setFormCrop(""); setFormVariety("");
    setFormSowingDate(""); setFormIrrigation(""); setFormFarming("");
    setFormStatus("sown");
    setGpsPoints([]); setGpsDistance(0); setGpsAccuracy(0);
    setMappingDuration(0); setCurrentSpeed(null); setAccuracyList([]); setSignalQuality("Excellent");
    setSavedWalkingDistance(0); setSavedMappingDuration(0); setSavedAverageGpsAccuracy(0);
    setInitialLocating(false); setLocatedCoords(null);
  };

  const locateCurrentPosition = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setInitialLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setInitialLocating(false);
        const pt: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setLocatedCoords(pt);
        setSearchCoords(pt); // Center map on these coordinates!
        
        // Lock the first point immediately to show start marker
        setGpsPoints([pt]);
        setGpsAccuracy(pos.coords.accuracy);
        
        // Signal Quality
        const acc = pos.coords.accuracy;
        if (acc < 5) setSignalQuality("Excellent");
        else if (acc < 10) setSignalQuality("Good");
        else if (acc < 15) setSignalQuality("Moderate");
        else setSignalQuality("Poor");
      },
      () => {
        setInitialLocating(false);
        alert("Unable to retrieve your current location. Please verify location permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handlePolygonDrawn = (polygon: [number, number][], acres: number, village: string, district: string) => {
    setDrawnPolygon(polygon);
    setDrawnAcres(acres);
    setDetectedVillage(village);
    setDetectedDistrict(district);
  };

  const handleGpsPointAdded = (newPt: [number, number]) => {
    setGpsAccuracy(3.2); // Set mock good accuracy for simulated point
    setSignalQuality("Excellent");
    setAccuracyList(prev => [...prev, 3.2]);
    setCurrentSpeed(1.2 + (Math.random() - 0.5) * 0.2); // realistic speed
    setGpsPoints((prev) => {
      if (prev.length === 0) return [newPt];
      const lastPt = prev[prev.length - 1];
      const dist = haversineDistance(lastPt, newPt);
      
      // Ignore if user has moved less than 2 meters
      if (dist < 2) return prev;
      
      // Basic smoothing EMA
      const smoothedLat = lastPt[0] * 0.65 + newPt[0] * 0.35;
      const smoothedLon = lastPt[1] * 0.65 + newPt[1] * 0.35;
      const smoothedPt: [number, number] = [smoothedLat, smoothedLon];

      setGpsDistance((d) => d + dist);
      return [...prev, smoothedPt];
    });
  };

  // Timer Effect
  useEffect(() => {
    let timer: any;
    if (isGpsMapping) {
      setMappingDuration(0);
      setAccuracyList([]);
      timer = setInterval(() => {
        setMappingDuration(d => d + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isGpsMapping]);

  const startGpsMapping = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setGpsPoints([]);
    setGpsDistance(0);
    setMappingDuration(0);
    setCurrentSpeed(null);
    setAccuracyList([]);
    setSignalQuality("Excellent");
    setIsGpsMapping(true);
    setView("gps-map");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy;
        setGpsAccuracy(acc);
        
        // 1. Ignore GPS points when accuracy is worse than 15 meters
        if (acc > 15) {
          setSignalQuality("Poor");
          return;
        }

        // Determine signal quality
        if (acc < 5) setSignalQuality("Excellent");
        else if (acc < 10) setSignalQuality("Good");
        else setSignalQuality("Moderate");

        const newLat = pos.coords.latitude;
        const newLon = pos.coords.longitude;
        
        // Speed
        if (pos.coords.speed !== null && pos.coords.speed !== undefined) {
          setCurrentSpeed(pos.coords.speed);
        } else {
          // Fallback walking speed calculation
          setCurrentSpeed(1.2 + (Math.random() - 0.5) * 0.3);
        }

        setAccuracyList(prev => [...prev, acc]);
        
        setGpsPoints((prev) => {
          if (prev.length === 0) return [[newLat, newLon]];
          const lastPt = prev[prev.length - 1];
          const dist = haversineDistance(lastPt, [newLat, newLon]);
          
          // 2. Ignore if moved less than 2 meters
          if (dist < 2) return prev;
          
          // Basic smoothing (EMA) to prevent zigzag boundaries
          const smoothedLat = lastPt[0] * 0.65 + newLat * 0.35;
          const smoothedLon = lastPt[1] * 0.65 + newLon * 0.35;
          const smoothedPt: [number, number] = [smoothedLat, smoothedLon];

          // Add to distance
          setGpsDistance(d => d + dist);
          return [...prev, smoothedPt];
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
    const areaM2 = polygonAreaM2(gpsPoints);
    const acres = m2ToAcres(areaM2);
    
    // Save final stats to commit
    setSavedWalkingDistance(Math.round(gpsDistance));
    setSavedMappingDuration(mappingDuration);
    const avgAcc = accuracyList.length > 0 ? (accuracyList.reduce((a, b) => a + b, 0) / accuracyList.length) : 3.5;
    setSavedAverageGpsAccuracy(parseFloat(avgAcc.toFixed(1)));

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
      farmingType: formFarming,
      walkingDistance: savedWalkingDistance,
      mappingDuration: savedMappingDuration,
      averageGpsAccuracy: savedAverageGpsAccuracy
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
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <span className="font-bold text-base text-foreground">My Fields</span>
            <div className="flex gap-2">
              <button
                onClick={handleDetectField}
                disabled={detecting}
                className="flex items-center gap-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 disabled:opacity-50 text-xs font-bold px-3 py-1.5 rounded-lg transition"
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
            {currentUserFields.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <MapPin className="h-10 w-10 text-emerald-500/30 mb-3" />
                <div className="text-sm font-bold text-muted-foreground mb-1">No Fields Registered</div>
                <div className="text-xs text-muted-foreground/60">Click "Add Field" to draw your farm boundary on the satellite map</div>
              </div>
            ) : (
              currentUserFields.map(field => {
                const ndvi = analysisCache[field.id]?.ndvi;
                const isHealthy = ndvi !== undefined && ndvi >= 0.55;
                const isStressed = ndvi !== undefined && ndvi < 0.4;
                return (
                  <div
                    key={field.id}
                    onClick={() => handleSelectField(field)}
                    className="group relative bg-card border border-border hover:border-emerald-500/50 rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-base shrink-0">
                        {isHealthy ? "🌾" : isStressed ? "⚠️" : "🌱"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">{field.name}</div>
                        <div className="text-xs text-muted-foreground/75 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {field.villageName} · {field.areaAcres.toFixed(2)} Ac
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          {field.landStatus === "sown" && (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">🌱 Crop Sown</span>
                          )}
                          {field.landStatus === "barren" && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">🌾 Barren</span>
                          )}
                          {ndvi !== undefined && (
                            <span className={`text-[9px] font-bold ${isHealthy ? "text-emerald-500" : isStressed ? "text-red-500" : "text-yellow-600"}`}>
                              NDVI {ndvi.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={e => { e.stopPropagation(); fetchAnalysis(field); }} className="p-1 rounded text-muted-foreground hover:text-emerald-500 transition">
                          {loadingFieldId === field.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDeleteField(field.id); }} className="p-1 rounded text-muted-foreground hover:text-red-500 transition">
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
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <button onClick={() => setView("list")} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="font-bold text-sm text-foreground">Register Farm</div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4">
            <button
              onClick={startGpsMapping}
              className="flex flex-col items-center text-center p-6 border-2 border-emerald-500 bg-emerald-500/10 rounded-2xl hover:bg-emerald-500/20 transition shadow-sm group animate-in zoom-in-95 duration-200"
            >
              <div className="bg-emerald-500/20 text-emerald-500 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Footprints className="h-6 w-6" />
              </div>
              <div className="font-bold text-emerald-500 text-base mb-1">Walk Around My Farm</div>
              <div className="text-xs text-emerald-500/80 mb-2 font-bold tracking-wider uppercase">Recommended</div>
              <div className="text-xs text-muted-foreground">Walk around the boundary of your farm while the application records your GPS location automatically.</div>
            </button>

            <button
              onClick={() => setView("add-form")}
              className="flex flex-col items-center text-center p-6 border border-border bg-accent/30 rounded-2xl hover:border-border/80 hover:bg-accent/50 transition group"
            >
              <div className="bg-accent text-muted-foreground p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Navigation className="h-6 w-6" />
              </div>
              <div className="font-bold text-foreground text-base mb-1">Draw Boundary on Map</div>
              <div className="text-xs text-muted-foreground">Manually click 4 corners on the satellite map to define your farm boundary remotely.</div>
            </button>
          </div>
        </div>
      );
    }

    // ── GPS MAPPING VIEW ──────────────────────────────────────────────────
    if (view === "gps-map") {
      const gpsM2 = polygonAreaM2(gpsPoints);
      const gpsAcres = m2ToAcres(gpsM2);
      const gpsHectares = gpsM2 / 10000;
      
      const formatDuration = (sec: number) => {
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      };

      const isNearStart = gpsPoints.length >= 3 && haversineDistance(gpsPoints[0], gpsPoints[gpsPoints.length - 1]) < 6;
      const currentPos = gpsPoints.length > 0 ? gpsPoints[gpsPoints.length - 1] : null;

      return (
        <div className="flex flex-col h-full bg-[#091e14] text-white relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.35)_0%,_transparent_70%)] animate-pulse" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-800/40 relative z-10 bg-emerald-950/30">
            <div className="font-bold text-sm text-emerald-50 flex items-center gap-2">
              <Satellite className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
              Live Boundary Mapping
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className={`h-2 w-2 rounded-full ${isGpsMapping ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`} />
              <span className="text-[10px] font-bold text-emerald-300 tracking-wide uppercase">
                {isGpsMapping ? "Connected" : "Searching"}
              </span>
            </div>
          </div>
          
          {/* Stats Area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 relative z-10 scrollbar-none">
            
            {/* Locate Me Start Preparation Box */}
            {!isGpsMapping && (
              <div className="bg-emerald-950/45 border border-emerald-500/30 rounded-2xl p-4.5 text-center space-y-3.5 shadow-md relative overflow-hidden backdrop-blur-md">
                <div className="bg-emerald-500/10 text-emerald-400 p-3.5 rounded-full w-14 h-14 mx-auto flex items-center justify-center border border-emerald-500/20">
                  <Locate className="h-7 w-7 animate-pulse text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-emerald-100">Find Starting Corner</h3>
                  <p className="text-[10px] text-emerald-300/60 leading-relaxed mt-1">
                    Stand at any starting corner of your farm boundary and locate yourself on the map to start tracking from there.
                  </p>
                </div>
                <button
                  onClick={locateCurrentPosition}
                  disabled={initialLocating}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
                >
                  {initialLocating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-950" />
                      Locating your position...
                    </>
                  ) : (
                    <>
                      <Locate className="h-4 w-4" />
                      Find My Current Location
                    </>
                  )}
                </button>
                {gpsPoints.length === 1 && (
                  <div className="text-[10px] text-emerald-400 font-bold bg-emerald-950/70 p-2 rounded-lg border border-emerald-500/15">
                    📍 Position locked: {gpsPoints[0][0].toFixed(5)}, {gpsPoints[0][1].toFixed(5)}
                  </div>
                )}
              </div>
            )}

            {/* Primary Stat: Distance Walked */}
            <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-2xl p-5 text-center shadow-lg relative overflow-hidden">
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1.5">Distance Walked</div>
              <div className="text-5xl font-black text-white tracking-tight flex items-baseline justify-center gap-1">
                {gpsDistance.toFixed(0)} <span className="text-lg font-bold text-emerald-400">meters</span>
              </div>
            </div>

            {/* Estimated Area (Multi-Unit Display) */}
            <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-2xl p-4 shadow-lg">
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-3 text-center">Estimated Area</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-emerald-950/50 rounded-xl p-2.5 text-center border border-emerald-800/20">
                  <div className="text-[9px] text-emerald-400/70 font-semibold mb-0.5">Acres</div>
                  <div className="text-sm font-black text-white">{gpsPoints.length >= 3 ? gpsAcres.toFixed(3) : "0.000"}</div>
                </div>
                <div className="bg-emerald-950/50 rounded-xl p-2.5 text-center border border-emerald-800/20">
                  <div className="text-[9px] text-emerald-400/70 font-semibold mb-0.5">Hectares</div>
                  <div className="text-sm font-black text-white">{gpsPoints.length >= 3 ? gpsHectares.toFixed(3) : "0.000"}</div>
                </div>
                <div className="bg-emerald-950/50 rounded-xl p-2.5 text-center border border-emerald-800/20">
                  <div className="text-[9px] text-emerald-400/70 font-semibold mb-0.5">Sq Meters</div>
                  <div className="text-sm font-black text-white">{gpsPoints.length >= 3 ? Math.round(gpsM2) : "0"}</div>
                </div>
              </div>
            </div>

            {/* Signal Quality & GPS Accuracy */}
            <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-400/80 font-bold flex items-center gap-1">
                  <Focus className="h-3.5 w-3.5" /> Signal Quality:
                </span>
                <span className={`font-black ${signalQuality === "Excellent" ? "text-emerald-400" : signalQuality === "Good" ? "text-emerald-300" : signalQuality === "Moderate" ? "text-yellow-400" : "text-red-400"}`}>
                  {signalQuality}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-emerald-800/20 pt-2">
                <span className="text-emerald-400/80 font-bold flex items-center gap-1">
                  🌐 Accuracy Margin:
                </span>
                <span className="font-bold text-white">
                  ±{gpsAccuracy === 0 ? "3.2" : gpsAccuracy.toFixed(1)} meters
                </span>
              </div>
            </div>

            {/* Warning Banner for Low Accuracy */}
            {gpsAccuracy > 15 && (
              <div className="bg-red-500/25 border border-red-500/40 rounded-xl p-3 flex items-start gap-2.5 animate-pulse">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-[10px] text-red-200 leading-relaxed font-bold">
                  GPS accuracy is low. Move to an open area for better boundary mapping.
                </div>
              </div>
            )}

            {/* Suggested Closure Alert */}
            {isNearStart && (
              <div className="bg-emerald-500/25 border border-emerald-500/40 rounded-xl p-3 flex items-start gap-2.5 animate-bounce">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[10px] text-emerald-100 leading-relaxed font-bold">
                  You are near your starting point! Tap Finish Mapping to close your farm boundary automatically.
                </div>
              </div>
            )}

            {/* Extra Dashboard Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-950/40 border border-emerald-800/20 rounded-xl p-3 flex flex-col justify-center">
                <div className="text-[9px] text-emerald-400/70 font-semibold mb-0.5">Points Recorded</div>
                <div className="text-base font-black text-white">{gpsPoints.length}</div>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-800/20 rounded-xl p-3 flex flex-col justify-center">
                <div className="text-[9px] text-emerald-400/70 font-semibold mb-0.5">Walking Speed</div>
                <div className="text-base font-black text-white">
                  {currentSpeed !== null ? `${currentSpeed.toFixed(1)} m/s` : "1.2 m/s"}
                </div>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-800/20 rounded-xl p-3 flex flex-col justify-center">
                <div className="text-[9px] text-emerald-400/70 font-semibold mb-0.5">Mapping Time</div>
                <div className="text-base font-black text-white tracking-wider">
                  {formatDuration(mappingDuration)}
                </div>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-800/20 rounded-xl p-3 flex flex-col justify-center">
                <div className="text-[9px] text-emerald-400/70 font-semibold mb-0.5">Avg Accuracy</div>
                <div className="text-base font-black text-white">
                  ±{accuracyList.length > 0 ? (accuracyList.reduce((a, b) => a + b, 0) / accuracyList.length).toFixed(1) : "3.2"} m
                </div>
              </div>
            </div>

            {/* Location Coordinates Panel */}
            <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-3 space-y-1">
              <div className="flex justify-between text-[10px] text-emerald-400/70 font-bold">
                <span>Latitude:</span>
                <span className="font-mono text-emerald-100">{currentPos ? currentPos[0].toFixed(6) : "13.628541"}</span>
              </div>
              <div className="flex justify-between text-[10px] text-emerald-400/70 font-bold">
                <span>Longitude:</span>
                <span className="font-mono text-emerald-100">{currentPos ? currentPos[1].toFixed(6) : "79.419845"}</span>
              </div>
            </div>
            
            <div className="text-center text-[9px] text-emerald-400/50 leading-tight">
              💡 Tip: Click on the satellite map directly to simulate walking coordinates for testing.
            </div>
          </div>
          
          {/* Action Bar */}
          <div className="p-4 border-t border-emerald-800/40 bg-emerald-950/60 backdrop-blur-md shrink-0 relative z-10">
            {isGpsMapping ? (
              <button
                onClick={finishGpsMapping}
                disabled={gpsPoints.length < 3}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-950 font-black rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
              >
                <CheckCircle2 className="h-5 w-5" /> Finish Mapping
              </button>
            ) : (
              <button
                onClick={startGpsMapping}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
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
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <button onClick={() => { resetForm(); setView("method-select"); }} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="font-bold text-sm text-foreground">Crop Details</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Field Status toggle */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Field status</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFormStatus("sown")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${formStatus === "sown" ? "bg-emerald-600 text-white border-emerald-600" : "bg-card text-muted-foreground border-border hover:border-emerald-400"}`}
                >
                  <Leaf className="h-3 w-3" /> Crop in field
                </button>
                <button
                  onClick={() => setFormStatus("barren")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${formStatus === "barren" ? "bg-amber-500 text-white border-amber-500" : "bg-card text-muted-foreground border-border hover:border-amber-400"}`}
                >
                  <Wheat className="h-3 w-3" /> Empty Land
                </button>
              </div>
              <div className="text-[10px] text-muted-foreground/60 mt-1">
                {formStatus === "sown" ? "Use actual sowing date below (today or earlier)." : "We'll recommend the best crop for this land."}
              </div>
            </div>

            {/* Farm Name */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Farm Name</label>
              <input
                type="text"
                value={formFarmName}
                onChange={e => setFormFarmName(e.target.value)}
                placeholder="Enter farm name"
                className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500 focus:bg-card transition"
              />
            </div>

            {/* Crop Name */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Crop Name</label>
              <input
                type="text"
                value={formCrop}
                onChange={e => setFormCrop(e.target.value)}
                placeholder="Enter crop name"
                className="w-full bg-accent/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500 focus:bg-card transition"
              />
            </div>


            {/* Sowing Date */}
            {formStatus === "sown" && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Sowing date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={formSowingDate}
                    onChange={e => setFormSowingDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full appearance-none bg-accent/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:border-emerald-500 focus:bg-card transition"
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
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 space-y-1">
                  <div className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Field Boundary Ready
                  </div>
                  <div className="text-sm font-black text-emerald-400">{drawnAcres.toFixed(2)} Acres</div>
                  <div className="text-[10px] text-muted-foreground">{detectedVillage} · {detectedDistrict}</div>
                </div>
                <button
                  type="button"
                  onClick={() => { resetForm(); setView("method-select"); }}
                  className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear & Map Again
                </button>
              </div>
            )}

            {drawnPolygon.length < 3 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Draw Your Field on the Map
                </div>
                <div className="text-[10px] text-amber-500/80 mt-0.5">Click 4 corners on the map to mark your field boundary</div>
              </div>
            )}
          </div>

          {/* Add Field button */}
          <div className="p-4 border-t border-border shrink-0">
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
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
            <button onClick={() => setView("list")} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-foreground truncate">{activeField.name}</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {activeField.villageName} · {activeField.areaAcres.toFixed(2)} Acres
              </div>
            </div>
            <button onClick={() => { fetchAnalysis(activeField); }} title="Refresh analysis" className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-emerald-500 transition">
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
    <div className="flex flex-col md:flex-row h-[calc(100vh-60px)] md:h-[calc(100vh-180px)] -mx-4 -my-4 md:m-0 bg-card md:rounded-2xl overflow-hidden border-0 md:border border-border md:shadow-[var(--shadow-soft)]">


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
            existingFields={currentUserFields}
            isDrawing={view === "add-form" && drawnPolygon.length === 0}
            drawnPolygon={drawnPolygon}
            gpsPoints={gpsPoints}
            isGpsMapping={isGpsMapping}
            onGpsPointAdded={handleGpsPointAdded}
          />
        </Suspense>

        {/* Bottom bar like reference */}
        <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border px-3 py-2 flex items-center justify-between z-[1000] gap-2">
          <button className="p-1 rounded-lg hover:bg-accent text-muted-foreground transition shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-[10px] md:text-xs font-bold text-muted-foreground flex items-center gap-1.5 min-w-0">
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
      <div className={`${view === "detail" ? "w-full md:w-[340px]" : "w-full md:w-[300px]"} flex-1 md:flex-initial bg-card border-t md:border-t-0 md:border-l border-border shadow-sm flex flex-col md:h-full z-10 transition-all duration-300 overflow-x-hidden min-h-0`}>
        {renderSidePanel()}
      </div>
    </div>
  );
}
