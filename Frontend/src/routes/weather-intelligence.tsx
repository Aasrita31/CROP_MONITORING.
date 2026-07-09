import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CloudSun, Thermometer, Droplets, Wind, CloudRain, Sun, MapPin, Search, Target } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useDashboardContext } from "@/context/DashboardContext";

export const Route = createFileRoute("/weather-intelligence")({
  component: WeatherIntelligence,
});

interface WeatherData {
  temperature: number;
  humidity: number;
  wind_speed: number;
  precipitation: number;
  condition: string;
}

function WeatherIntelligence() {
  const { crop } = useApp();
  const { searchQuery, searchCoords } = useDashboardContext();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [localQuery, setLocalQuery] = useState("");
  const [localLocation, setLocalLocation] = useState<{ name: string; lat: number; lon: number } | null>(null);

  // Derive the active location — either from a local search on this page, or from the global village search
  const activeName = localLocation?.name || searchQuery || null;
  const activeLat = localLocation?.lat ?? searchCoords?.[0] ?? null;
  const activeLon = localLocation?.lon ?? searchCoords?.[1] ?? null;

  // Fetch weather whenever active location changes
  useEffect(() => {
    if (activeLat === null || activeLon === null) {
      setWeather(null);
      return;
    }

    setLoading(true);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${activeLat}&longitude=${activeLon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m`
    )
      .then((res) => res.json())
      .then((data) => {
        const current = data.current || {};
        setWeather({
          temperature: current.temperature_2m ?? 0,
          humidity: current.relative_humidity_2m ?? 0,
          wind_speed: current.wind_speed_10m ?? 0,
          precipitation: current.precipitation ?? 0,
          condition:
            current.precipitation > 0
              ? "Rainy"
              : current.temperature_2m > 35
                ? "Hot & Sunny"
                : current.relative_humidity_2m > 70
                  ? "Humid"
                  : "Clear",
        });
      })
      .catch((err) => {
        console.error("Open-Meteo fetch failed:", err);
        setWeather(null);
      })
      .finally(() => setLoading(false));
  }, [activeLat, activeLon]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(localQuery)}&limit=1`,
        { headers: { "User-Agent": "AgriTwin-Weather/1.0" } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const place = data[0];
        setLocalLocation({
          name: place.display_name.split(",")[0].trim(),
          lat: parseFloat(place.lat),
          lon: parseFloat(place.lon),
        });
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    }
  };

  const handleGPS = () => {
    if (!("geolocation" in navigator)) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "User-Agent": "AgriTwin-Weather/1.0" } }
          );
          const data = await res.json();
          const name = data?.address?.village || data?.address?.town || data?.address?.city || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setLocalLocation({ name, lat: latitude, lon: longitude });
        } catch {
          setLocalLocation({ name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, lat: latitude, lon: longitude });
        }
      },
      () => setLoading(false)
    );
  };

  const conditionIcon = () => {
    if (!weather) return <CloudSun className="h-16 w-16 text-muted-foreground/30" />;
    if (weather.condition === "Rainy") return <CloudRain className="h-16 w-16 text-blue-400" />;
    if (weather.condition === "Hot & Sunny") return <Sun className="h-16 w-16 text-amber-400" />;
    if (weather.condition === "Humid") return <Droplets className="h-16 w-16 text-cyan-400" />;
    return <CloudSun className="h-16 w-16 text-emerald-400" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center text-primary">
          <CloudSun className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weather Intelligence</h1>
          <p className="text-muted-foreground text-sm">
            {activeName
              ? <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-400 inline" /> Real-time weather for <span className="text-emerald-400 font-semibold">{activeName}</span></span>
              : "Search for a location to view live weather data"
            }
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 w-full">
        <input
          type="text"
          placeholder="Enter village, town, or city name..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          disabled={loading}
          className="flex-1 px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition"
        />
        <button
          type="button"
          title="Use current GPS location"
          onClick={handleGPS}
          disabled={loading}
          className="px-3.5 py-2.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition"
        >
          <Target className="h-4.5 w-4.5 text-primary" />
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{ background: "var(--gradient-primary)" }}
          className="px-5 py-2.5 text-sm font-semibold text-primary-foreground rounded-lg shadow-sm hover:opacity-95 disabled:opacity-50 transition flex items-center gap-1.5"
        >
          <Search className="h-4 w-4" /> Get Weather
        </button>
      </form>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : weather && activeName ? (
        <>
          {/* Main Weather Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 rounded-2xl border border-border bg-card shadow-sm p-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-primary/30 to-transparent" />
              <div className="relative z-10 flex items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  {conditionIcon()}
                  <span className="text-sm font-semibold text-foreground">{weather.condition}</span>
                </div>
                <div>
                  <div className="text-6xl font-black text-foreground">
                    {weather.temperature.toFixed(1)}
                    <span className="text-2xl text-muted-foreground font-normal">°C</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Live temperature in {activeName}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card shadow-sm p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 grid place-items-center">
                  <Droplets className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Humidity</p>
                  <p className="text-2xl font-bold text-foreground">
                    {weather.humidity.toFixed(0)}<span className="text-sm text-muted-foreground ml-0.5">%</span>
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card shadow-sm p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 grid place-items-center">
                  <Wind className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Wind Speed</p>
                  <p className="text-2xl font-bold text-foreground">
                    {weather.wind_speed.toFixed(1)}<span className="text-sm text-muted-foreground ml-0.5"> km/h</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Precipitation</p>
              <p className="text-xl font-bold text-foreground">{weather.precipitation.toFixed(1)} <span className="text-xs text-muted-foreground">mm</span></p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Feels Like</p>
              <p className="text-xl font-bold text-foreground">{(weather.temperature + (weather.humidity > 60 ? 2 : -1)).toFixed(1)} <span className="text-xs text-muted-foreground">°C</span></p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">UV Index</p>
              <p className="text-xl font-bold text-foreground">{weather.temperature > 35 ? "High" : weather.temperature > 28 ? "Moderate" : "Low"}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Irrigation Advice</p>
              <p className="text-xl font-bold text-foreground">{weather.precipitation > 2 ? "Skip Today" : weather.humidity > 70 ? "Reduce" : "Normal"}</p>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
            <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">AI Weather Advisory</h3>
            <div className="p-3 border border-primary/20 bg-primary/5 rounded-lg text-sm text-foreground leading-relaxed">
              {weather.precipitation > 2
                ? `Rain detected in ${activeName}. Delay any scheduled fertilizer or pesticide application. Ensure drainage channels are clear.`
                : weather.temperature > 35
                  ? `High temperature alert in ${activeName}. Increase irrigation frequency for ${crop} fields. Consider mulching to reduce soil moisture loss.`
                  : weather.humidity > 70
                    ? `High humidity in ${activeName}. Monitor ${crop} crops for fungal diseases. Ensure proper air circulation around plants.`
                    : `Conditions in ${activeName} are favorable for ${crop}. Continue standard irrigation and monitoring schedules.`}
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 grid place-items-center">
              <CloudSun className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 grid place-items-center">
              <Search className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">Search for a Location</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Enter a village, town, or city name above to get real-time weather data powered by Open-Meteo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
