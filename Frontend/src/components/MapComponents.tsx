import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Search, Leaf, X, Layers } from "lucide-react";
import satelliteImg from "@/assets/satellite-farm.jpg";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<any[]>(fields);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);

  // Sync prop center/fields with local state when they change
  useEffect(() => {
    setMapCenter(center);
    setDynamicFields(fields);
  }, [center, fields]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setMapCenter([lat, lon]);
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lon], 14, { duration: 1.5 });
        }

        // Simulate nearby agricultural fields for the newly searched location
        const simulatedFields = Array.from({ length: 5 }).map((_, i) => {
          const dom = Math.random() > 0.5 ? 'healthy' : Math.random() > 0.5 ? 'water' : 'disease';
          return {
            id: `sim-${i}`,
            name: `${searchQuery} Plot ${i + 1}`,
            x: 50 + (Math.random() - 0.5) * 40,
            y: 50 + (Math.random() - 0.5) * 40,
            dominant: dom,
            health: Math.floor(70 + Math.random() * 25),
            rec: "Simulated agricultural field data based on satellite index.",
          };
        });
        setDynamicFields(simulatedFields);
      }
    } catch (e) {
      console.error(e);
    }
    setIsSearching(false);
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
        
        {/* Render fields as markers/polygons */}
        {dynamicFields.map((f: any, idx: number) => {
          // Fake lat/lng near the center for visual demo
          const lat = mapCenter[0] + (f.y - 50) * 0.0005;
          const lng = mapCenter[1] + (f.x - 50) * 0.0005;
          
          // Custom HTML Icon for field status
          const markerHtml = `
            <div class="relative group cursor-pointer w-full h-full">
              <div class="absolute inset-0 bg-card/90 backdrop-blur border border-border rounded-lg shadow-lg flex items-center px-2 py-1 transform -translate-y-full hover:scale-110 transition whitespace-nowrap">
                <span class="h-2.5 w-2.5 rounded-full mr-1.5 ${f.dominant === 'healthy' ? 'bg-healthy' : f.dominant === 'water' ? 'bg-water' : 'bg-disease'} animate-pulse"></span>
                <span class="text-[10px] font-bold text-foreground">${f.name}</span>
              </div>
              <div class="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-card border border-border rotate-45"></div>
            </div>
          `;
          
          const icon = L.divIcon({
            html: markerHtml,
            className: 'bg-transparent',
            iconSize: [120, 30],
            iconAnchor: [60, 30],
          });

          return (
            <Marker 
              key={f.id} 
              position={[lat, lng]} 
              icon={icon}
              eventHandlers={{
                click: () => onFieldClick(f.id),
              }}
            >
              <Popup className="rounded-xl overflow-hidden shadow-xl">
                <div className="p-1">
                  <h3 className="font-bold text-sm">{f.name}</h3>
                  <div className="text-xs text-muted-foreground mb-2 mt-1">{f.rec}</div>
                  <div className="flex justify-between items-center bg-accent/40 rounded p-1.5 px-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Health</span>
                    <span className="text-[11px] font-bold text-healthy">{f.health}/100</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating UI Elements matching Geoman reference */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 h-10 px-3 bg-card/90 backdrop-blur border border-border rounded-lg shadow-lg pointer-events-auto">
          <Leaf className="h-4 w-4 text-primary" />
          <input 
            placeholder="Search farm location..." 
            className="flex-1 bg-transparent text-sm text-foreground outline-none w-48"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={isSearching}
          />
          <button onClick={handleSearch} disabled={isSearching} className="p-1 hover:bg-accent rounded">
            {isSearching ? <span className="h-4 w-4 block animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Search className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-[400] pointer-events-none">
        <button className="flex items-center gap-2 h-10 px-4 bg-card/90 backdrop-blur border border-border rounded-lg shadow-lg hover:bg-accent text-sm font-medium text-foreground transition pointer-events-auto">
          <Layers className="h-4 w-4" />
          Map Layers
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-[400] text-[10px] font-semibold bg-card/80 backdrop-blur border border-border px-2 py-1 rounded shadow-sm text-muted-foreground">
        Live GIS Data • Leaflet Geoman
      </div>
    </div>
  );
}

export function AddFieldModalContent({ onClose }: { onClose: () => void }) {
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
        <div className="absolute top-4 left-4 z-[400] w-64">
          <div className="flex items-center gap-2 h-10 px-3 bg-[#15191e] border border-white/10 rounded-lg shadow-lg">
            <Leaf className="h-4 w-4 text-green-500" />
            <input placeholder="Search location" className="flex-1 bg-transparent text-sm text-white outline-none" />
            <Search className="h-4 w-4 text-white/50" />
          </div>
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
