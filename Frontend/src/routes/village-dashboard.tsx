import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, MapPin, Leaf, Droplets, TrendingUp, Activity,
  CloudRain, Thermometer, BarChart3, Target
} from "lucide-react";
import { communityApi } from "@/services/communityApi";
import { useDashboardContext } from "@/context/DashboardContext";

export const Route = createFileRoute("/village-dashboard")({
  component: VillageDashboardPage,
});

function KpiCard({ label, value, unit, icon: Icon, color }: { label: string; value: string | number; unit?: string; icon: any; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-sidebar border border-sidebar-border rounded-xl p-4 hover:border-${color}-500/30 transition-colors`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">
            {value}{unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface VillageData {
  registered_farmers: number;
  registered_farms: number;
  total_area: number;
  crop_distribution: Record<string, number>;
  avg_ndvi: number;
  avg_evi: number;
  avg_ndmi: number;
  avg_savi: number;
  avg_soil_moisture: number;
  avg_yield_rating: number;
  disease_distribution: Record<string, number>;
  water_stress: string;
  most_common_irrigation: string;
  village_health_score: number;
}

function VillageDashboardPage() {
  const [data, setData] = useState<VillageData | null>(null);
  const [loading, setLoading] = useState(true);
  const { searchQuery, searchDistrict } = useDashboardContext();

  useEffect(() => {
    setLoading(true);
    const params: { village?: string; district?: string } = {};
    if (searchQuery) params.village = searchQuery;
    if (searchDistrict) params.district = searchDistrict;

    communityApi.getVillageDashboard(params)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchQuery, searchDistrict]);

  const locationLabel = searchQuery || "All Villages";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground text-center py-20">No village data available{searchQuery ? ` for ${searchQuery}` : ""}.</p>;

  const healthColor = data.village_health_score >= 80 ? "emerald" : data.village_health_score >= 55 ? "amber" : "red";

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          Village Intelligence Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aggregated analytics for <span className="text-emerald-400 font-semibold">{locationLabel}</span>
          {searchDistrict && <span className="text-muted-foreground"> · {searchDistrict}</span>}
        </p>
      </motion.div>

      {/* Village Health Score */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-sidebar border border-sidebar-border rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{locationLabel} Health Score</p>
            <div className="flex items-end gap-2">
              <span className={`text-5xl font-black text-${healthColor}-400`}>{data.village_health_score}</span>
              <span className="text-lg text-muted-foreground mb-1">/100</span>
            </div>
            <p className={`text-sm font-medium text-${healthColor}-400 mt-1`}>
              {data.village_health_score >= 80 ? "Excellent" : data.village_health_score >= 55 ? "Moderate" : "Needs Attention"}
            </p>
          </div>
          {/* Simple gauge */}
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="currentColor" strokeWidth="3" className="text-sidebar-border" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" strokeWidth="3" strokeDasharray={`${data.village_health_score}, 100`}
                className={`text-${healthColor}-500`} stroke="currentColor" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Registered Farmers" value={data.registered_farmers} icon={Users} color="emerald" />
        <KpiCard label="Registered Farms" value={data.registered_farms} icon={MapPin} color="blue" />
        <KpiCard label="Total Area" value={data.total_area} unit="acres" icon={Target} color="violet" />
        <KpiCard label="Water Stress" value={data.water_stress} icon={Droplets} color="cyan" />
      </div>

      {/* Satellite Indices */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Satellite Indices (Averages)</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "NDVI", value: data.avg_ndvi, icon: Leaf, desc: "Vegetation" },
            { label: "EVI", value: data.avg_evi, icon: TrendingUp, desc: "Enhanced Veg." },
            { label: "NDMI", value: data.avg_ndmi, icon: Droplets, desc: "Moisture" },
            { label: "SAVI", value: data.avg_savi, icon: Activity, desc: "Soil Adjusted" },
            { label: "Soil Moisture", value: data.avg_soil_moisture, icon: CloudRain, desc: "%" },
          ].map((idx, i) => (
            <motion.div
              key={idx.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-sidebar border border-sidebar-border rounded-xl p-4 text-center"
            >
              <idx.icon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{typeof idx.value === "number" ? idx.value.toFixed(idx.label === "Soil Moisture" ? 1 : 3) : idx.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{idx.label}</p>
              <p className="text-[10px] text-muted-foreground/60">{idx.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Crop Distribution + Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Crop Distribution */}
        <div className="bg-sidebar border border-sidebar-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Crop Distribution</h3>
          {Object.keys(data.crop_distribution).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.crop_distribution).map(([crop, count]) => {
                const total = Object.values(data.crop_distribution).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={crop}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{crop}</span>
                      <span className="text-muted-foreground">{count} farms · {pct}%</span>
                    </div>
                    <div className="h-2 bg-sidebar-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No crop data available</p>
          )}
        </div>

        {/* Other Details */}
        <div className="bg-sidebar border border-sidebar-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Village Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Yield Rating</span>
              <span className="text-amber-400 font-medium">
                {"★".repeat(Math.round(data.avg_yield_rating))}{"☆".repeat(5 - Math.round(data.avg_yield_rating))}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Irrigation Type</span>
              <span className="text-foreground font-medium">{data.most_common_irrigation}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Water Stress</span>
              <span className={`font-medium ${data.water_stress === "Low" ? "text-emerald-400" : data.water_stress === "Moderate" ? "text-amber-400" : "text-red-400"}`}>
                {data.water_stress}
              </span>
            </div>

            {Object.keys(data.disease_distribution).length > 0 && (
              <>
                <div className="border-t border-sidebar-border pt-3 mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Disease Distribution</p>
                  {Object.entries(data.disease_distribution).map(([level, count]) => (
                    <div key={level} className="flex justify-between text-xs py-1">
                      <span className="text-foreground">{level}</span>
                      <span className="text-muted-foreground">{count} farms</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
